---
description: Session start ritual — load context, bring the env up, verify baseline
allowed-tools: Bash, Read
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
   starting from an empty roadmap (or suggest running `/project-setup` first). Identify the active
   sprint (first with `todo`/`doing` tasks) and the **next task** (first `todo` in order).
4. Read the detail plan (`detail`) for that task/goal/sprint if it exists, in
   `harness/docs/roadmap/plans/`.
5. Bring the env up: `pnpm up` (= `bash harness/scripts/dev-up.sh`).
6. Baseline smoke: run `pnpm e2e` (or warn if the test foundation does not exist yet).

At the end, report briefly: worktree/port if applicable, active sprint, current %, the suggested
next task with its `verify` (`type` + `desc`), and whether the baseline is green. Do NOT start
implementing until the human confirms.
