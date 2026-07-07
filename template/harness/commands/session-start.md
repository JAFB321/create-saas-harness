---
description: Session start ritual — load context, run the decision gate, bring the env up, verify baseline
allowed-tools: Bash, Read, Edit, AskUserQuestion
---

Run the session start ritual defined in `harness/docs/workflow.md`.

**Optional argument:** the MVP number for this session (e.g. `/session-start 7`). If omitted and the
`pwd` is already a worktree `…-mvp-<n>`, use that `<n>`; otherwise work in the main repo with no
isolation (classic behavior).

Steps:

0. **Worktree isolation (if an MVP number is given).** Let `<n>` be the argument (or the `<n>` from
   the `pwd` if you are already in `…-mvp-<n>`):
   - **Already inside the worktree `…-mvp-<n>`** (the `pwd` ends in `-mvp-<n>`): run
     `source .harness-env` and report `PORT`/`SANDBOX_DB`. Continue to step 1 using the roadmap
     `mvp-<n>.json`. Isolated session ready.
   - **You passed `<n>` but are in the main repo:** a running session can't move itself to another
     folder. So: if the worktree `../<repo>-mvp-<n>` does not exist, create it with
     `pnpm worktree:new <n>`; whether it exists or not, **stop** and tell the human the final step,
     verbatim:
     ```
     cd ../<repo>-mvp-<n> && source .harness-env
     # reopen the agent THERE and run: /session-start <n>
     ```
     Don't continue with the other steps.
   - **No MVP number:** skip this step (main repo, no isolation).
1. `pwd` and `git log --oneline -5` to confirm the directory and recent context.
2. Read `harness/docs/workflow.md` in full (hard rules + loop + Parallel worktrees section).
3. Read the active MVP roadmap: `harness/docs/roadmap/mvp-<n>.json` (`<n>` from step 0; default
   `mvp-1.json`). It is a local gitignored working file. If it does NOT exist, copy the template:
   `cp harness/docs/roadmap/mvp-example.json harness/docs/roadmap/mvp-<n>.json` and warn that you are
   starting from an empty roadmap (or suggest running `/project-setup` first). Run
   `pnpm roadmap:validate` — fix schema errors before trusting the file. Identify the active
   sprint (first with `todo`/`doing` tasks) and the **next task** (first `todo` in order).
4. Read the detail plan (`detail`) for that task/goal/sprint if it exists, in
   `harness/docs/roadmap/plans/`. If the next task has a `designRef`, read that design plan section
   and `.impeccable/design.json` so UI work has its contract loaded.
5. **Front-loaded decision gate.** Read the active MVP's `openQuestions`. If any have
   `answered: false`, ask the human **all of them in one pass** before doing anything else:
   - Group by `area`; use `AskUserQuestion` for questions with `options`, plain conversational
     questions otherwise. Always show each question's `default` so "you decide" is easy.
   - Persist each result: `Edit` the MVP JSON to set that question's `answer` and `answered: true`,
     and append one line per decision to `FOUNDATIONS/_decisions-log.md`
     (`- <question> → <answer> (session-start gate)`).
   - `severity: "blocking"` questions **must** be answered before execution. For `default-ok`, an
     empty/"you decide" reply records the `default`.
   - If every question is already answered, say so and continue — never re-ask.
     This is the single interrogation point: after the gate, execution runs autonomously (workflow.md
     hard rule 5).
6. Bring the env up: `pnpm up` (= `bash harness/scripts/dev-up.sh`).
7. Baseline smoke: run the critical-flow subset — `pnpm e2e e2e/critical-flow.spec.ts` — to confirm
   we start from green (full `pnpm e2e` is for `/verify` and wrap, not every open). Warn if the test
   foundation does not exist yet.

At the end, report briefly: worktree/port if applicable, any decisions just captured at the gate,
active sprint, current %, the suggested next task with its `verify` (`type` + `desc`), and whether the
baseline is green. Do NOT start implementing until the human confirms.
