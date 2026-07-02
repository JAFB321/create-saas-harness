#!/usr/bin/env node
// Bundles the canonical repo template (../../../template) into this package
// (packages/cli/template) so it ships inside the published npm tarball.
// Run automatically on `prepack`. Symlinks under .claude are intentionally skipped —
// the scaffolder recreates them deterministically in the generated project.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyDir, pathExists } from "./fs-utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const srcTemplate = path.join(repoRoot, "template");
const destTemplate = path.join(pkgRoot, "template");

// npm pack ALWAYS strips .gitignore/.npmrc from tarballs, so ship them underscore-prefixed;
// the scaffolder renames them back (see restoreDotfiles in index.mjs).
async function underscoreDotfiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await underscoreDotfiles(p);
    else if (entry.name === ".gitignore" || entry.name === ".npmrc") {
      await fs.rename(p, path.join(dir, "_" + entry.name.slice(1)));
    }
  }
}

async function main() {
  if (!(await pathExists(srcTemplate))) {
    console.error(`! No template found at ${srcTemplate}`);
    process.exit(1);
  }
  await fs.rm(destTemplate, { recursive: true, force: true });
  await copyDir(srcTemplate, destTemplate, {
    skipSymlinks: true,
    ignore: ["node_modules", ".next", ".turbo", "dist"],
  });
  await underscoreDotfiles(destTemplate);
  console.log(`✓ template synced -> ${path.relative(pkgRoot, destTemplate)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
