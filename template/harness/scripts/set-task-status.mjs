#!/usr/bin/env node
// Usage: node set-task-status.mjs <mvpFile> <taskId>=<status> [<taskId>=<status> ...]
// status: todo|doing|done|blocked. Updates roadmap JSON in place, prints summary.
import { readFileSync, writeFileSync } from "node:fs";

const [, , file, ...pairs] = process.argv;
if (!file || pairs.length === 0) {
  console.error("usage: set-task-status.mjs <file> <taskId>=<status> ...");
  process.exit(1);
}
const j = JSON.parse(readFileSync(file, "utf8"));
const updates = new Map(pairs.map((p) => p.split("=")));
const valid = new Set(["todo", "doing", "done", "blocked"]);
let touched = 0;
for (const s of j.sprints || [])
  for (const g of s.goals || [])
    for (const t of g.tasks || []) {
      if (updates.has(t.id)) {
        const st = updates.get(t.id);
        if (!valid.has(st)) {
          console.error(`invalid status "${st}" for ${t.id}`);
          process.exit(1);
        }
        t.status = st;
        touched++;
      }
    }
if (touched !== updates.size) {
  console.error(`WARN: matched ${touched}/${updates.size} ids`);
}
// recompute mvp status
let total = 0,
  done = 0,
  doing = 0;
for (const s of j.sprints || [])
  for (const g of s.goals || [])
    for (const t of g.tasks || []) {
      total++;
      if (t.status === "done") done++;
      if (t.status === "doing") doing++;
    }
j.status = total > 0 && done === total ? "done" : done > 0 || doing > 0 ? "in_progress" : "todo";
writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
const pct = total > 0 ? Math.round((done / total) * 100) : 0;
console.log(`updated ${touched} | progress ${done}/${total} (${pct}%) | mvp.status=${j.status}`);
