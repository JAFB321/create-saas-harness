#!/usr/bin/env node
/**
 * `pnpm db:types` — regenerates packages/db/src/database.types.ts from your Supabase schema.
 *
 * If the Supabase CLI is available with SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (or a local
 * stack), it regenerates from the live schema. Otherwise it keeps the versioned types and exits 0
 * (the repo ships hand-authored types that match supabase/migrations).
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), "packages/db/src/database.types.ts");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

function tryGen(args, label) {
  const res = spawnSync("npx", ["--yes", "supabase", "gen", "types", "typescript", ...args], {
    encoding: "utf8",
  });
  if (res.status === 0 && res.stdout && res.stdout.includes("export type Database")) {
    writeFileSync(OUT, res.stdout);
    console.log(`[db:types] regenerated via ${label} -> ${OUT}`);
    return true;
  }
  return false;
}

// 1) Remote project (if configured).
if (process.env.SUPABASE_ACCESS_TOKEN && PROJECT_REF) {
  if (tryGen(["--project-id", PROJECT_REF], "Supabase CLI (remote)")) process.exit(0);
  console.warn("[db:types] remote gen failed; trying local…");
}

// 2) Local stack (if running).
if (tryGen(["--local"], "Supabase CLI (local)")) process.exit(0);

// 3) Fall back to the versioned types.
if (!existsSync(OUT)) {
  console.error(`[db:types] Missing ${OUT} and no Supabase available to generate it.`);
  process.exit(1);
}
console.log(
  `[db:types] keeping versioned types at ${OUT}.\n` +
    "  To regenerate: set SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF, or run `supabase start` locally.",
);
process.exit(0);
