#!/usr/bin/env node
// create-saas-harness — scaffold a Next.js + Supabase SaaS monorepo with a built-in agent harness.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { copyDir, pathExists, replaceTokensInFile, isTextFile } from "./lib/fs-utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

// Template lives bundled next to the CLI (published) or at repo root (in-repo dev).
async function resolveTemplateDir() {
  const bundled = path.join(here, "template");
  if (await pathExists(bundled)) return bundled;
  const repo = path.resolve(here, "..", "..", "template");
  if (await pathExists(repo)) return repo;
  throw new Error("Could not locate the project template. Reinstall create-saas-harness.");
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function bail(msg) {
  p.cancel(msg);
  process.exit(1);
}

// Files/dirs that belong to the UNCHOSEN payment provider and should be pruned.
function prunePaths(provider) {
  const drop = provider === "stripe" ? "mercadopago" : "stripe";
  return [
    `packages/integrations/src/payment/${drop}.ts`,
    `packages/integrations/src/payment/${drop}.test.ts`,
    `packages/integrations/src/payment/__tests__/${drop}.test.ts`,
  ];
}

async function main() {
  console.log("");
  p.intro(pc.bgCyan(pc.black(" create-saas-harness ")));

  const projectName = await p.text({
    message: "Project name?",
    placeholder: "my-saas",
    validate: (v) => (v && v.trim().length >= 2 ? undefined : "Enter at least 2 characters."),
  });
  if (p.isCancel(projectName)) bail("Cancelled.");

  const defaultDir = slugify(projectName);
  const targetRel = await p.text({
    message: "Directory to create it in?",
    placeholder: `./${defaultDir}`,
    defaultValue: `./${defaultDir}`,
    initialValue: `./${defaultDir}`,
  });
  if (p.isCancel(targetRel)) bail("Cancelled.");

  const payments = await p.select({
    message: "Payments provider?",
    options: [
      { value: "stripe", label: "Stripe", hint: "global default" },
      { value: "mercadopago", label: "MercadoPago", hint: "LATAM" },
    ],
    initialValue: "stripe",
  });
  if (p.isCancel(payments)) bail("Cancelled.");

  const pm = await p.select({
    message: "Package manager?",
    options: [
      { value: "pnpm", label: "pnpm", hint: "recommended" },
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
    ],
    initialValue: "pnpm",
  });
  if (p.isCancel(pm)) bail("Cancelled.");

  const doInstall = await p.confirm({ message: "Install dependencies now?", initialValue: true });
  if (p.isCancel(doInstall)) bail("Cancelled.");

  const targetDir = path.resolve(process.cwd(), targetRel.replace(/^\.\//, ""));
  if (await pathExists(targetDir)) {
    const entries = await fs.readdir(targetDir).catch(() => []);
    if (entries.length) bail(`Directory ${targetDir} already exists and is not empty.`);
  }

  const slug = slugify(projectName);
  const tokens = {
    "{{PROJECT_NAME}}": projectName,
    "{{PROJECT_SLUG}}": slug,
    "{{PAYMENTS_PROVIDER}}": payments,
  };

  const s = p.spinner();

  // 1) Copy template (skip symlinks; recreated below).
  s.start("Copying template");
  const templateDir = await resolveTemplateDir();
  await fs.mkdir(targetDir, { recursive: true });
  await copyDir(templateDir, targetDir, {
    skipSymlinks: true,
    ignore: ["node_modules", ".next", ".turbo", "dist", ".git"],
    onFile: async (rel, abs) => {
      if (isTextFile(abs)) await replaceTokensInFile(abs, tokens);
    },
  });
  s.stop("Template copied");

  // 2) Recreate the .claude harness symlinks deterministically.
  s.start("Wiring the harness");
  const claudeDir = path.join(targetDir, ".claude");
  if (await pathExists(claudeDir)) {
    for (const [link, target] of [
      ["agents", "../harness/agents"],
      ["commands", "../harness/commands"],
      ["skills", "../harness/skills"],
    ]) {
      const linkPath = path.join(claudeDir, link);
      await fs.rm(linkPath, { recursive: true, force: true }).catch(() => {});
      try {
        await fs.symlink(target, linkPath);
      } catch {
        // Windows / no-symlink fallback: copy the real dir.
        await copyDir(path.join(targetDir, "harness", link), linkPath, { skipSymlinks: true });
      }
    }
  }
  s.stop("Harness wired");

  // 3) Prune the unchosen payment adapter, repoint real.ts, set the provider in env, drop unused dep.
  s.start("Configuring payments (" + payments + ")");
  for (const rel of prunePaths(payments)) {
    await fs.rm(path.join(targetDir, rel), { force: true }).catch(() => {});
  }
  // Repoint the "real" adapter re-export to the chosen provider so the factory's import stays valid.
  const realTs = path.join(targetDir, "packages/integrations/src/payment/real.ts");
  if (await pathExists(realTs)) {
    const klass = payments === "mercadopago" ? "MercadoPagoProvider" : "StripePaymentProvider";
    const from = payments === "mercadopago" ? "./mercadopago" : "./stripe";
    await fs.writeFile(
      realTs,
      `// The "real" (non-mock) payment provider, selected at scaffold time.\n` +
        `export { ${klass} as RealPaymentProvider } from "${from}";\n`,
    );
  }
  // Drop the unused payment SDK dependency.
  const integrationsPkg = path.join(targetDir, "packages/integrations/package.json");
  if (await pathExists(integrationsPkg)) {
    const pkg = JSON.parse(await fs.readFile(integrationsPkg, "utf8"));
    const unused = payments === "stripe" ? "mercadopago" : "stripe";
    if (pkg.dependencies) delete pkg.dependencies[unused];
    await fs.writeFile(integrationsPkg, JSON.stringify(pkg, null, 2) + "\n");
  }
  const envExample = path.join(targetDir, ".env.example");
  if (await pathExists(envExample)) {
    let env = await fs.readFile(envExample, "utf8");
    if (/^PAYMENTS_PROVIDER=/m.test(env)) {
      env = env.replace(/^PAYMENTS_PROVIDER=.*$/m, `PAYMENTS_PROVIDER=${payments}`);
    } else {
      env = `PAYMENTS_PROVIDER=${payments}\n` + env;
    }
    await fs.writeFile(envExample, env);
  }
  s.stop("Payments configured");

  // 4) Ensure a root .gitignore exists (guards against publish stripping it).
  const gitignore = path.join(targetDir, ".gitignore");
  if (!(await pathExists(gitignore))) {
    await fs.writeFile(
      gitignore,
      ["node_modules/", ".next/", ".turbo/", "dist/", ".env", ".env.local", "*.log", ".DS_Store"].join(
        "\n",
      ) + "\n",
    );
  }

  // 5) Install dependencies (optional).
  if (doInstall) {
    s.start(`Installing dependencies with ${pm}`);
    const res = spawnSync(pm, ["install"], { cwd: targetDir, stdio: "ignore", shell: process.platform === "win32" });
    if (res.status === 0) s.stop("Dependencies installed");
    else s.stop(pc.yellow(`Skipped install (run \`${pm} install\` manually).`));
  }

  // 6) git init + FIRST COMMIT.
  s.start("Initializing git");
  const git = (args) => spawnSync("git", args, { cwd: targetDir, stdio: "ignore" });
  const ok =
    git(["init", "-q"]).status === 0 &&
    git(["add", "-A"]).status === 0 &&
    git([
      "-c",
      "user.name=create-saas-harness",
      "-c",
      "user.email=noreply@create-saas-harness",
      "commit",
      "-q",
      "-m",
      "chore: scaffold from create-saas-harness",
    ]).status === 0;
  s.stop(ok ? "Git initialized (first commit created)" : pc.yellow("Git skipped — commit manually."));

  // 7) Next steps.
  const cd = path.relative(process.cwd(), targetDir) || ".";
  p.note(
    [
      `${pc.bold("1.")} cd ${cd}`,
      doInstall ? "" : `${pc.bold("2.")} ${pm} install`,
      `${pc.bold(doInstall ? "2." : "3.")} Open your agent (Claude Code) and run ${pc.cyan("/project-setup")}`,
      `   → it interviews you, then writes FOUNDATIONS/* and your roadmap.`,
      `${pc.bold(doInstall ? "3." : "4.")} Then read ${pc.cyan("INSTRUCTIONS.md")} for the daily loop.`,
    ]
      .filter(Boolean)
      .join("\n"),
    "Next steps",
  );
  p.outro(pc.green("Ready. Build something great."));
}

main().catch((e) => {
  p.cancel(String(e?.message || e));
  process.exit(1);
});
