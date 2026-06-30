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
  console.log(`✓ template synced -> ${path.relative(pkgRoot, destTemplate)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
