// Small filesystem helpers shared by the scaffolder and the template-sync script.
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Recursively copy `src` into `dest`.
 * Options:
 *   - skipSymlinks: don't copy symlinks (the scaffolder recreates them deterministically).
 *   - ignore: array of path segments (relative to the copy root) to skip entirely.
 *   - onFile(relPath, absDest): optional async hook after each file is written (e.g. token replace).
 */
export async function copyDir(src, dest, opts = {}) {
  const { skipSymlinks = true, ignore = [], onFile } = opts;
  const ignoreSet = new Set(ignore.map((p) => path.normalize(p)));

  async function walk(curSrc, curDest, rel) {
    const entries = await fs.readdir(curSrc, { withFileTypes: true });
    await fs.mkdir(curDest, { recursive: true });
    for (const entry of entries) {
      const relPath = path.normalize(path.join(rel, entry.name));
      if (ignoreSet.has(relPath)) continue;
      const srcPath = path.join(curSrc, entry.name);
      const destPath = path.join(curDest, entry.name);
      if (entry.isSymbolicLink()) {
        if (skipSymlinks) continue;
        const link = await fs.readlink(srcPath);
        await fs.symlink(link, destPath);
      } else if (entry.isDirectory()) {
        await walk(srcPath, destPath, relPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
        if (onFile) await onFile(relPath, destPath);
      }
    }
  }

  await walk(src, dest, "");
}

export async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function replaceTokensInFile(absPath, tokens) {
  let content;
  try {
    content = await fs.readFile(absPath, "utf8");
  } catch {
    return; // binary or unreadable — skip
  }
  let out = content;
  for (const [token, value] of Object.entries(tokens)) {
    out = out.split(token).join(value);
  }
  if (out !== content) await fs.writeFile(absPath, out);
}

// Heuristic: only run token replacement on text-ish files.
const TEXT_EXT = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".jsonc",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".css",
  ".html",
  ".yaml",
  ".yml",
  ".env",
  ".example",
  ".toml",
  ".sql",
]);

export function isTextFile(p) {
  const ext = path.extname(p).toLowerCase();
  return TEXT_EXT.has(ext) || p.endsWith(".env.example") || path.basename(p) === ".gitignore";
}
