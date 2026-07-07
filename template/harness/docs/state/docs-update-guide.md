# Documentation update guide

Instructions for any model or agent working on this project. Read it before modifying any file in
`harness/docs/`. The full operational flow (rituals, loop, hard rules) is in
`harness/docs/workflow.md`.

## Core principle

Docs split into three categories:

| Category                             | Files                                       | Rule                                                                                                                                |
| ------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Project state (machine-readable)** | `roadmap/mvp-*.json` (active: `mvp-1.json`) | Source of truth for progress. The agent updates `status` per task. The % auto-computes in the dashboard — **never edited by hand**. |
| **Current code state**               | `state/*.md`                                | Reflects what **exists today** in the code. Updated **after** implementing changes. NOT a changelog (see rule below).               |
| **Planning**                         | `roadmap/plans/*.md`                        | Detailed design referenced from the JSON (`detail`).                                                                                |

`index.md` is an index — only change it when adding/removing files.

### Golden rule for `state/*.md`: state, not history

The `state/*.md` docs are an **objective snapshot of the current code**, not a record of how it got
there. Write each doc as if the code had always been this way.

**Forbidden in `state/*.md`:**

- **Roadmap references**: no `MVP-N`, `Sprint N`, `sN-tN`, "phase 7", nor roadmap decisions. Progress
  lives in `roadmap/*.json`, not here.
- **Changelog sections**: no `## Recent changes`, `## Resolved in ...`, "before/after", "(new)",
  "(removed)", nor migration narrative ("went from X to Y"). Document what **is**, not what **changed**.
- **Timestamps and dates**: `(2026-06-12)`, "after the sprint of the 11th", etc. Git history covers it.

**Instead:** describe current behavior, contracts and structure in the present tense. If a design
decision is still relevant (e.g. "private originals via signed URL"), explain the **what/why** of the
current state without tying it to when it was done.

### Active roadmap state

- Per-task `status`: `todo | doing | done | blocked`.
- **A task becomes `done` ONLY when its `verify` is green** (unit/e2e). Tasks with
  `verify.type: "manual"` → `done` only with human confirmation of behavior.
- `blocked` carries context (why); `done` tasks are not deleted.
- Do NOT edit percentages (auto-computed). Do NOT delete completed tasks.
- `verify` field schema (object, never a string): see `harness/docs/workflow.md`.

## When to update

### After each sprint or dev session

1. **Read the active MVP** to identify the tasks worked on.
2. **Set `status`** for each verified task via
   `node harness/scripts/set-task-status.mjs <mvpFile> <taskId>=<status> …` (`todo` → `done`, or
   `blocked` with reason). The % is auto-computed — don't edit it by hand.
3. **Update the affected current-state docs** (`state/*.md`): endpoints, routes, entities, components,
   modules. Remove resolved tech debt.

### When starting a new session

Read in this order for context: `index.md` → the active MVP → the state doc for the area you'll work
on. You don't need to read every doc each session — only the relevant ones.

## What NOT to do

- **Don't mix plans with current state.** `state/*.md` must not have "to build" or "pending" sections.
- **Don't turn `state/*.md` into history.** No MVP/sprint references, no "Recent changes", no timestamps.
- **Don't duplicate information.** If it's already in the code (e.g. an enum), reference it.
- **Don't create new docs** without updating `index.md`.

### `CLAUDE.md` (project root)

- Only update it when code conventions, stack, or commands change.
- Do **NOT** put project state (progress, sprints) there — that goes in the roadmaps.
- If a new reusable pattern or helper is added, document it here.
