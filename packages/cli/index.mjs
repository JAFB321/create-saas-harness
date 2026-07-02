#!/usr/bin/env node
// create-saas-harness — scaffold a Next.js + Supabase SaaS monorepo with a built-in agent harness.
// Interactive by default; every choice is also a flag so the whole scaffold can run unattended:
//   npx create-saas-harness my-saas --payments stripe --storage supabase --email resend --pm pnpm -y
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { copyDir, pathExists, replaceTokensInFile, isTextFile } from "./lib/fs-utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// The module matrix: one entry per scaffold-time choice. Everything the CLI
// prunes/rewrites is declared here so adding a provider is a data change.
// ---------------------------------------------------------------------------
const CHOICES = {
  payments: {
    flag: "payments",
    message: "Payments provider?",
    initial: "stripe",
    options: [
      { value: "stripe", label: "Stripe", hint: "global default" },
      { value: "mercadopago", label: "MercadoPago", hint: "LATAM" },
    ],
  },
  storage: {
    flag: "storage",
    message: "Storage provider?",
    initial: "supabase",
    options: [
      { value: "supabase", label: "Supabase Storage", hint: "zero extra keys — reuses your Supabase project" },
      { value: "s3", label: "S3-compatible", hint: "Cloudflare R2 / AWS S3 / MinIO" },
    ],
  },
  email: {
    flag: "email",
    message: "Transactional email?",
    initial: "resend",
    options: [
      { value: "resend", label: "Resend", hint: "recommended" },
      { value: "none", label: "None for now", hint: "mock only — add a provider later" },
    ],
  },
  pm: {
    flag: "pm",
    message: "Package manager?",
    initial: "pnpm",
    options: [
      { value: "pnpm", label: "pnpm", hint: "recommended" },
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
    ],
  },
};

// What each choice re-exports from `<kind>/real.ts` in @app/integrations.
const REAL_ADAPTERS = {
  payments: {
    stripe: { module: "./stripe", klass: "StripePaymentProvider", kind: "Payment", label: "Stripe" },
    mercadopago: { module: "./mercadopago", klass: "MercadoPagoProvider", kind: "Payment", label: "MercadoPago" },
  },
  storage: {
    supabase: { module: "./supabase", klass: "SupabaseStorageProvider", kind: "Storage", label: "Supabase Storage" },
    s3: { module: "./s3", klass: "S3StorageProvider", kind: "Storage", label: "S3-compatible (R2/S3/MinIO)" },
  },
  email: {
    resend: { module: "./resend", klass: "ResendProvider", kind: "Email", label: "Resend" },
  },
};

const INTEGRATIONS_DIR = "packages/integrations/src";

// Files + package.json dependencies that belong to UNCHOSEN providers.
function pruneFor(config) {
  const files = [];
  const deps = [];
  const dropPayment = config.payments === "stripe" ? "mercadopago" : "stripe";
  files.push(`${INTEGRATIONS_DIR}/payment/${dropPayment}.ts`);
  deps.push(dropPayment);
  if (config.storage === "supabase") {
    files.push(`${INTEGRATIONS_DIR}/storage/s3.ts`);
    deps.push("@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner");
  } else {
    files.push(`${INTEGRATIONS_DIR}/storage/supabase.ts`);
    // The private bucket migration only makes sense for Supabase Storage.
    files.push("supabase/migrations/20260101000002_storage.sql");
  }
  if (config.email === "none") {
    files.push(`${INTEGRATIONS_DIR}/email/resend.ts`);
    deps.push("resend");
  }
  return { files, deps };
}

function realTsContent(kindKey, choice) {
  const KIND = { payments: "PAYMENT", storage: "STORAGE", email: "EMAIL" }[kindKey];
  if (kindKey === "email" && choice === "none") {
    return (
      `// No real email provider was selected at scaffold time — email stays mock-first.\n` +
      `// To add one later: drop an adapter in this folder (see the create-saas-harness template\n` +
      `// for a Resend reference) and re-export it here with PROVIDER_NAME + isConfigured.\n` +
      `export { MockEmailProvider as RealEmailProvider } from "./mock";\n` +
      `export const REAL_EMAIL_PROVIDER = "mock";\n` +
      `export const isRealEmailConfigured = (): boolean => false;\n`
    );
  }
  const a = REAL_ADAPTERS[kindKey][choice];
  return (
    `// The "real" (non-mock) ${kindKey} provider, selected at scaffold time (${choice}).\n` +
    `export {\n` +
    `  ${a.klass} as Real${a.kind}Provider,\n` +
    `  PROVIDER_NAME as REAL_${KIND}_PROVIDER,\n` +
    `  isConfigured as isReal${a.kind}Configured,\n` +
    `} from "${a.module}";\n`
  );
}

// .env.example: keep only the blocks for chosen providers (marked `## >>> kind:choice`),
// strip the marker lines themselves, and point the selectors at the choices.
function applyEnvChoices(env, config) {
  const keep = new Set([
    `payments:${config.payments}`,
    `storage:${config.storage}`,
    ...(config.email === "resend" ? ["email:resend"] : []),
  ]);
  const out = [];
  let dropping = false;
  for (const line of env.split("\n")) {
    const open = line.match(/^## >>> ([a-z0-9:_-]+)\s*$/);
    const close = line.match(/^## <<< ([a-z0-9:_-]+)\s*$/);
    if (open) {
      dropping = !keep.has(open[1]);
      continue;
    }
    if (close) {
      dropping = false;
      continue;
    }
    if (!dropping) out.push(line);
  }
  return out
    .join("\n")
    .replace(/^PAYMENTS_PROVIDER=.*$/m, `PAYMENTS_PROVIDER=${config.payments}`)
    .replace(/^EMAIL_PROVIDER=.*$/m, `EMAIL_PROVIDER=${config.email === "none" ? "mock" : config.email}`)
    .replace(/^STORAGE_PROVIDER=.*$/m, `STORAGE_PROVIDER=${config.storage}`)
    .replace(/\n{3,}/g, "\n\n");
}

// The bundled template ships .gitignore/.npmrc as _gitignore/_npmrc (npm pack strips the
// dot-named originals from tarballs); restore them after copying. No-op for in-repo dev,
// where the template still has the dot-named files.
async function restoreDotfiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await restoreDotfiles(p);
    else if (entry.name === "_gitignore" || entry.name === "_npmrc") {
      const dotted = path.join(dir, "." + entry.name.slice(1));
      if (await pathExists(dotted)) await fs.rm(p, { force: true });
      else await fs.rename(p, dotted);
    }
  }
}

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

const HELP = `
${pc.bold("create-saas-harness")} — Next.js + Supabase SaaS monorepo with a built-in agent harness.

${pc.bold("Usage")}
  npx create-saas-harness [directory] [options]

${pc.bold("Options")}
  --name <name>            Project name (defaults to the directory name)
  --payments <provider>    stripe | mercadopago            (default: stripe)
  --storage <provider>     supabase | s3                   (default: supabase)
  --email <provider>       resend | none                   (default: resend)
  --pm <manager>           pnpm | npm | yarn | bun         (default: pnpm)
  --install / --no-install Install dependencies            (default: install)
  --git / --no-git         git init + first commit         (default: git)
  -y, --yes                Accept defaults for anything not passed (no prompts)
  -h, --help               Show this help
  --version                Show the CLI version

${pc.bold("Examples")}
  npx create-saas-harness
  npx create-saas-harness my-saas -y
  npx create-saas-harness my-saas --payments mercadopago --storage s3 --email none --pm pnpm -y
`;

function parseCliArgs() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        name: { type: "string" },
        payments: { type: "string" },
        storage: { type: "string" },
        email: { type: "string" },
        pm: { type: "string" },
        install: { type: "boolean" },
        "no-install": { type: "boolean" },
        git: { type: "boolean" },
        "no-git": { type: "boolean" },
        yes: { type: "boolean", short: "y" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean" },
      },
    });
  } catch (e) {
    console.error(pc.red(`\n${e.message}`));
    console.log(HELP);
    process.exit(1);
  }
  const { values, positionals } = parsed;
  for (const key of ["payments", "storage", "email", "pm"]) {
    const val = values[key];
    if (val !== undefined && !CHOICES[key].options.some((o) => o.value === val)) {
      const valid = CHOICES[key].options.map((o) => o.value).join(" | ");
      console.error(pc.red(`\nInvalid --${key} "${val}". Valid values: ${valid}`));
      process.exit(1);
    }
  }
  return { values, dir: positionals[0] };
}

async function promptOrDefault(flagValue, yes, ask, fallback) {
  if (flagValue !== undefined) return flagValue;
  if (yes) return fallback;
  const answer = await ask();
  if (p.isCancel(answer)) bail("Cancelled.");
  return answer;
}

async function main() {
  const { values: flags, dir: dirArg } = parseCliArgs();

  if (flags.help) {
    console.log(HELP);
    return;
  }
  if (flags.version) {
    const pkg = JSON.parse(await fs.readFile(path.join(here, "package.json"), "utf8"));
    console.log(pkg.version);
    return;
  }

  console.log("");
  p.intro(pc.bgCyan(pc.black(" create-saas-harness ")));

  const yes = Boolean(flags.yes);

  const projectName = await promptOrDefault(
    flags.name ?? (dirArg ? path.basename(dirArg) : undefined),
    yes,
    () =>
      p.text({
        message: "Project name?",
        placeholder: "my-saas",
        validate: (v) => (v && v.trim().length >= 2 ? undefined : "Enter at least 2 characters."),
      }),
    "my-saas",
  );

  const defaultDir = dirArg ?? `./${slugify(projectName)}`;
  const targetRel = await promptOrDefault(
    dirArg,
    yes,
    () =>
      p.text({
        message: "Directory to create it in?",
        placeholder: defaultDir,
        defaultValue: defaultDir,
        initialValue: defaultDir,
      }),
    defaultDir,
  );

  const config = {};
  for (const key of ["payments", "storage", "email", "pm"]) {
    const spec = CHOICES[key];
    config[key] = await promptOrDefault(
      flags[key],
      yes,
      () => p.select({ message: spec.message, options: spec.options, initialValue: spec.initial }),
      spec.initial,
    );
  }
  const pm = config.pm;

  const doInstall = await promptOrDefault(
    flags["no-install"] ? false : flags.install ? true : undefined,
    yes,
    () => p.confirm({ message: "Install dependencies now?", initialValue: true }),
    true,
  );
  const doGit = flags["no-git"] ? false : true;

  const targetDir = path.resolve(process.cwd(), targetRel.replace(/^\.\//, ""));
  if (await pathExists(targetDir)) {
    const entries = await fs.readdir(targetDir).catch(() => []);
    if (entries.length) bail(`Directory ${targetDir} already exists and is not empty.`);
  }

  const slug = slugify(projectName);
  const tokens = {
    "{{PROJECT_NAME}}": projectName,
    "{{PROJECT_SLUG}}": slug,
    "{{PAYMENTS_PROVIDER}}": config.payments,
    "{{STORAGE_PROVIDER}}": config.storage,
    "{{EMAIL_PROVIDER}}": config.email === "none" ? "mock" : config.email,
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
  await restoreDotfiles(targetDir);
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

  // 3) Assemble the chosen modules: prune unchosen adapters + deps, repoint the
  //    real.ts re-exports, and rewrite .env.example to only show relevant keys.
  s.start("Assembling modules");
  const { files: pruneFiles, deps: pruneDeps } = pruneFor(config);
  for (const rel of pruneFiles) {
    await fs.rm(path.join(targetDir, rel), { force: true }).catch(() => {});
  }
  for (const [kindKey, rel] of [
    ["payments", `${INTEGRATIONS_DIR}/payment/real.ts`],
    ["storage", `${INTEGRATIONS_DIR}/storage/real.ts`],
    ["email", `${INTEGRATIONS_DIR}/email/real.ts`],
  ]) {
    await fs.writeFile(path.join(targetDir, rel), realTsContent(kindKey, config[kindKey]));
  }
  const integrationsPkg = path.join(targetDir, "packages/integrations/package.json");
  if (await pathExists(integrationsPkg)) {
    const pkg = JSON.parse(await fs.readFile(integrationsPkg, "utf8"));
    for (const dep of pruneDeps) {
      if (pkg.dependencies) delete pkg.dependencies[dep];
    }
    await fs.writeFile(integrationsPkg, JSON.stringify(pkg, null, 2) + "\n");
  }
  const envExample = path.join(targetDir, ".env.example");
  if (await pathExists(envExample)) {
    const env = await fs.readFile(envExample, "utf8");
    await fs.writeFile(envExample, applyEnvChoices(env, config));
  }
  const chosen = {
    payments: REAL_ADAPTERS.payments[config.payments].label,
    storage: REAL_ADAPTERS.storage[config.storage].label,
    email: config.email === "none" ? "none (mock-first)" : REAL_ADAPTERS.email[config.email].label,
  };
  s.stop(`Modules assembled (${chosen.payments} · ${chosen.storage} · email: ${chosen.email})`);

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
  if (doGit) {
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
  }

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
