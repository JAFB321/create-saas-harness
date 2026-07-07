#!/usr/bin/env node
// Static server for the roadmap dashboard (replaces python3 -m http.server).
// Usage: node serve-roadmap.mjs [port]   (default 8080)
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/roadmap");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const fp = normalize(join(ROOT, urlPath === "/" ? "dashboard.html" : urlPath));
  if (!fp.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  if (!existsSync(fp) || statSync(fp).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, {
    "content-type": MIME[extname(fp)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(fp).pipe(res);
}).listen(PORT, () => {
  console.log(`roadmap dashboard → http://localhost:${PORT}/dashboard.html`);
});
