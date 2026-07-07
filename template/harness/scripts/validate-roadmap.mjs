#!/usr/bin/env node
// Usage: node validate-roadmap.mjs [file ...]
// No args: validates every harness/docs/roadmap/mvp-*.json.
// Errors (exit 1) = schema violations agents must fix. Warnings = review notes.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROADMAP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/roadmap");
const TASK_STATUS = new Set(["todo", "doing", "done", "blocked"]);
const MVP_STATUS = new Set(["todo", "in_progress", "done"]);
const VERIFY_TYPES = new Set(["unit", "e2e", "manual"]);
const SEVERITIES = new Set(["blocking", "default-ok"]);

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(ROADMAP_DIR)
      .filter((f) => /^mvp-.+\.json$/.test(f))
      .map((f) => join(ROADMAP_DIR, f));

if (files.length === 0) {
  console.error(`no mvp-*.json files found in ${ROADMAP_DIR}`);
  process.exit(1);
}

let errors = 0;
let warnings = 0;

function check(file, path, ok, msg, level = "error") {
  if (ok) return;
  if (level === "error") errors++;
  else warnings++;
  console.log(`${level === "error" ? "ERROR" : "warn "} ${file} :: ${path} — ${msg}`);
}

for (const file of files) {
  const name = file.replace(/^.*roadmap\//, "");
  let j;
  try {
    j = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    check(name, "$", false, `invalid JSON: ${e.message}`);
    continue;
  }

  check(name, "mvp", Number.isInteger(j.mvp) || name.includes("example"), "must be an integer");
  check(name, "objective", typeof j.objective === "string" && j.objective.length > 0, "required");
  check(name, "status", MVP_STATUS.has(j.status), `must be one of ${[...MVP_STATUS].join("|")}`);
  check(name, "scope.included", Array.isArray(j.scope?.included), "must be an array");
  check(name, "scope.excluded", Array.isArray(j.scope?.excluded), "must be an array");

  for (const [i, q] of (j.openQuestions || []).entries()) {
    const p = `openQuestions[${i}]`;
    check(name, p, typeof q.id === "string" && q.id.length > 0, "id required");
    check(name, p, typeof q.question === "string" && q.question.length > 0, "question required");
    check(name, p, SEVERITIES.has(q.severity), `severity must be ${[...SEVERITIES].join("|")}`);
    check(name, p, typeof q.answered === "boolean", "answered must be a boolean");
    check(
      name,
      p,
      !q.answered || (typeof q.answer === "string" && q.answer.length > 0),
      "answered questions need a non-empty answer",
    );
    check(
      name,
      p,
      typeof q.default === "string" || q.severity === "blocking",
      "non-blocking questions need a default",
      "warn",
    );
  }

  const ids = new Set();
  for (const [si, s] of (j.sprints || []).entries()) {
    check(
      name,
      `sprints[${si}]`,
      typeof s.id === "string" && typeof s.title === "string",
      "id + title required",
    );
    if (s.detail) checkPlanRef(name, `sprints[${si}].detail`, s.detail);
    for (const [gi, g] of (s.goals || []).entries()) {
      const gp = `sprints[${si}].goals[${gi}]`;
      check(
        name,
        gp,
        typeof g.id === "string" && typeof g.title === "string",
        "id + title required",
      );
      if (g.detail) checkPlanRef(name, `${gp}.detail`, g.detail);
      for (const [ti, t] of (g.tasks || []).entries()) {
        const tp = `${gp}.tasks[${ti}] (${t.id ?? "?"})`;
        check(name, tp, typeof t.id === "string" && t.id.length > 0, "id required");
        check(name, tp, !ids.has(t.id), `duplicate task id "${t.id}"`);
        ids.add(t.id);
        check(
          name,
          tp,
          typeof t.desc === "string" && t.desc.length >= 15,
          "desc required (a real sentence, not a stub)",
        );
        check(name, tp, typeof t.area === "string" && t.area.length > 0, "area required");
        check(name, tp, TASK_STATUS.has(t.status), `status must be ${[...TASK_STATUS].join("|")}`);
        const v = t.verify;
        check(
          name,
          tp,
          v && typeof v === "object" && !Array.isArray(v),
          "verify must be an object",
        );
        if (v && typeof v === "object") {
          check(
            name,
            tp,
            VERIFY_TYPES.has(v.type),
            `verify.type must be ${[...VERIFY_TYPES].join("|")}`,
          );
          check(name, tp, typeof v.desc === "string" && v.desc.length > 0, "verify.desc required");
          if (v.type === "unit" || v.type === "e2e") {
            check(
              name,
              tp,
              typeof v.spec === "string" && v.spec.length > 0,
              `verify.spec required for type "${v.type}"`,
            );
          }
        }
        if (t.designRef) checkPlanRef(name, `${tp}.designRef`, t.designRef, "warn");
        check(
          name,
          tp,
          !(t.area === "app" && v?.type === "e2e" && !t.designRef),
          "UI task (area app, e2e-verified) without designRef — add one or confirm it has no visible surface",
          "warn",
        );
      }
    }
  }
}

function checkPlanRef(file, path, ref, level = "warn") {
  const target = join(ROADMAP_DIR, String(ref).split("#")[0]);
  check(file, path, existsSync(target), `referenced file not found: ${ref}`, level);
}

console.log(
  errors + warnings === 0
    ? `OK — ${files.length} file(s) valid`
    : `${errors} error(s), ${warnings} warning(s) in ${files.length} file(s)`,
);
process.exit(errors > 0 ? 1 : 0);
