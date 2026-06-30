# Agent workflow (operational harness)

Operating manual for any agent working on this project. It defines **what / how / when / where /
why** for every session. Load it at the start of each session (`/session-start`).

> New project? You should have run `/project-setup` first. That interview writes `FOUNDATIONS/*`
> (your product's source of truth) and fills `harness/docs/roadmap/mvp-*.json` with an executable
> roadmap. This file is about **executing** that roadmap, session by session.

## Why this exists

We work in sessions (often short). The harness guarantees that every session starts with the right
context, verifies its work, and does not break what already exists — without relying on the human
operator's memory.

## Source of truth

- **Project state (roadmap):** `harness/docs/roadmap/mvp-*.json` (the active MVP, e.g. `mvp-1.json`).
  Per-task status: `todo | doing | done | blocked`. The percentage is auto-computed; never edited by
  hand. **These are local working files (gitignored)** — the roadmap/sprints are each dev's
  work-in-progress, not versioned. The only versioned file is `mvp-example.json` (the template):
  copy it to `mvp-1.json` to start. (`/project-setup` generates the real `mvp-*.json` files for you.)
- **Human entry point:** `harness/docs/roadmap/dashboard.html` (`pnpm roadmap` →
  http://localhost:8080/dashboard.html). It discovers `mvp-N.json` files by scanning.
- **Detailed design:** `harness/docs/roadmap/plans/*.md`, referenced from the JSON (`detail`). Load
  only the plan for the task in progress (just-in-time). Also local (gitignored).
- **Current code state:** `harness/docs/state/*.md` (`app`, `database`, `testing`, `infra`).
  **Versioned in git** — they reflect what exists TODAY, with no roadmap/sprints. Updated
  post-implementation.
- **Product foundations:** `FOUNDATIONS/*.md` — the why/what of the product (vision, users,
  features, business model, inspirations, dev team). Read once at the start; it rarely changes.

## Hard rules (non-negotiable)

1. **Never delete, disable (`.skip`/`xfail`) or weaken a test to make it pass.** If a test fails,
   fix the code — or fix the test with an explicit justification.
2. **Never declare a task done without its `verify` green.** A task becomes `done` only when its
   verification (unit/e2e) passes. Tasks with `verify.type: "manual"` require explicit human
   confirmation of behavior.
3. **Never mark `done` by assertion.** "I implemented X" ≠ "X works". Always run the verification.
4. **Never commit without an explicit human request.** Leave changes staged.

## Start ritual (`/session-start`)

1. `pwd` — confirm the repo root directory.
2. Read `harness/docs/roadmap/mvp-1.json` → identify the active sprint (first with `todo`/`doing`
   tasks) and the next task.
3. `git log --oneline -5` — context from the last session.
4. `bash harness/scripts/dev-up.sh` (`pnpm up`) — bring the environment up deterministically. No
   manual steps.
5. Baseline smoke: `pnpm e2e` (or the critical subset) to confirm we start from green.

## Execution loop (orchestrator–workers)

The main session is the **orchestrator**. It does not implement code directly when the task is
non-trivial; it delegates to subagents with isolated context and receives condensed summaries.

```
for each task in the active sprint (in order):
  1. mark status "doing" in the JSON
  2. load the detail plan if it exists (task.detail / goal.detail / sprint.detail)
  3. pick an implementer and delegate:
       - `dev-agent-pro` (Opus) if the task is complex (>=3 files / crosses packages),
         touches a critical flow (payments/settlement, idempotency, webhooks, RLS,
         end-user access, signed URLs), or already failed in `dev-agent`
       - `dev-agent` (Sonnet) otherwise (1-2 files, simple UI, trivial CRUD)
  4. delegate verification -> `verifier` subagent (runs the task's verify; does NOT modify code)
  5. if it fails:
       - delegate the fix to the implementer with the failure log
       - re-verify (max 3 retries; if it persists -> mark "blocked" + note, move to another task)
  6. if it passes: adversarial review -> `reviewer` subagent (reads the diff in fresh context vs
     the plan/task; reports ONLY correctness gaps, not style). If GAPS -> back to step 5 (fix).
  7. if verifier PASS and reviewer approved: mark "done" in the JSON
```

Available subagents: `dev-agent` (implements, Sonnet), `dev-agent-pro` (implements complex/critical
tasks, Opus), `verifier` (runs tests, Haiku), `reviewer` (reviews design/correctness, Opus),
`doc-keeper` (state/docs, Haiku), `Explore` (read-only research). Model separation follows the
orchestrator–workers pattern: capability where decisions/reviews happen (Opus), cheap where the work
is mechanical (Haiku), the workhorse for executing code (Sonnet), Opus for the complex or critical.
`verifier` runs tests; `reviewer` reviews what tests don't cover (design, edge cases, regressions) —
they are complementary, not redundant.

## Wrap ritual (`/session-wrap`)

1. Confirm every touched task is `done` (verify green + reviewer approved) or `blocked` (with a note).
   None left in `doing` without a reason.
2. Delegate to `reviewer`: adversarial review of the session diff (`git diff`) vs the plan. If it
   reports **correctness GAPS**, do NOT mark those tasks `done`: delegate the fix to the implementer
   and re-verify before closing.
3. Delegate to `doc-keeper`: update `harness/docs/state/*.md` with what was implemented (endpoints,
   routes, entities, components) and mark task status in the roadmap JSON (only verifier-PASS +
   reviewer-approved tasks -> `done`).
4. Run `pnpm format` from the repo root before staging.
5. `git status` and `git add` the relevant changes (create a branch first if you are on the main
   branch). **Do NOT commit**: leave everything staged and tell the human they must commit,
   proposing a message in English with the `type: description` format (feat/fix/refactor/chore).
6. Report to the human: completed tasks, blocked (with reason), reviewer gaps if any, the new sprint
   %, the suggested next task, and the proposed commit message.

Never `git commit` or `git push` unless the human explicitly asks.

## When to change the plan

If during the work you discover new tasks or scope changes: edit `harness/docs/roadmap/mvp-1.json`
(add/edit tasks, never delete `done` tasks — mark context instead). The human validates via the
dashboard.

## Verification: what counts as "green"

| Type        | Command            | Covers                                                      |
| ----------- | ------------------ | ---------------------------------------------------------- |
| Aggregate   | `pnpm verify`      | Shortcut: types + lint + test for the whole project        |
| Unit        | `pnpm test`        | Critical business logic                                    |
| Smoke E2E   | `pnpm e2e`         | Critical UI/API flows                                      |
| Types       | `pnpm check-types` | Project type compilation                                   |
| Lint        | `pnpm lint`        | Style/quality rules                                        |

The `verifier` runs the task's exact `spec` (via `verify.spec`); `pnpm verify` is the aggregate
check for session wrap.

**Automatic guards (deterministic hooks).** `.claude/settings.json` defines the one layer the agent
cannot bypass (even in `bypassPermissions`):

- **Stop hook** — runs `pnpm check-types` at the end of every response. Lightweight guard (no tests
  or e2e): if types break, it surfaces a warning; silent when green. It does not replace `/verify`.
- **PreToolUse guard** (`harness/scripts/harness-guard.mjs`) — before each `Bash`/`Write`/`Edit`:
  blocks force push and `rm -rf` on dangerous paths; protects `.env*` files with secrets and
  already-applied migrations (`supabase/migrations/*.sql` that exist — brand-new ones are allowed).
  Returns `permissionDecision: "deny"` with a reason; everything else passes silently.

Review/disable them via the `/hooks` menu. **Maintenance:** review the harness every 3–6 months and
after model releases; retire guards that compensate for model limits already surpassed.

## Parallel worktrees (several MVPs / agents at once)

When several MVPs or agents run simultaneously, each lives in its own **git worktree** to isolate the
code. The infra (port, sandbox DB) is **derived** from the MVP number — not assigned by hand nor
written into the roadmap JSON (the JSON stays declarative: scope/tasks).

**Create:** `pnpm worktree:new <n>` (`harness/scripts/worktree-new.sh`). It derives and leaves ready:

| Resource | Value                  | Note                                        |
| -------- | ---------------------- | ------------------------------------------- |
| worktree | `../<repo>-mvp-<n>`    | sibling of the main repo                    |
| branch   | `feat/mvp-<n>`         | from `develop` (or the `[base]` you pass)   |
| port     | `3000 + <n>`           | app + `E2E_BASE_URL` (mvp-7 -> `:3007`)     |
| sandbox  | `mvp_<n>`              | isolated migration DB                       |

It symlinks `.env.local` and writes `.harness-env` with `MVP_N/PORT/E2E_BASE_URL/SANDBOX_DB`.
**In each worktree terminal:** run `source .harness-env` before `pnpm dev`/`pnpm e2e:local`.

**The local DB is a single shared stack** across all worktrees -> two lanes:

- **Lane 1 — migrations (parallel, isolated, no API).** `pnpm migrate:sandbox <n>` recreates
  `mvp_<n>` (a disposable DB in the same Postgres container) and applies the branch's `.sql` files in
  order. Validates that they apply cleanly without touching the canonical DB or other worktrees.
- **Lane 2 — full e2e (serialized by lock).** `pnpm e2e:local` is wrapped in `with-e2e-lock.sh`: an
  exclusive `flock`. Only one worktree runs e2e at a time; the lock auto-releases if the process
  dies. On taking the lock, if ownership changed since the last run, it reclaims the canonical DB
  (reset + regrant + seed).

**Clean up a worktree:** `git worktree remove ../<repo>-mvp-<n>` (+ `git branch -D feat/mvp-<n>`).

## Roadmap JSON schema (`roadmap/mvp-*.json`)

One file per MVP (`mvp-1`, `mvp-2`, …). The dashboard discovers them by scanning `mvp-N.json`.

```jsonc
{
  "mvp": 1,
  "objective": "...",
  "deadline": "YYYY-MM-DD",
  "availability": "...",
  "status": "todo | in_progress | done",
  "scope": { "included": ["..."], "excluded": ["..."] },
  "sprints": [
    {
      "id": "s1",
      "title": "...",
      "estimate": "~10h",
      "detail": "plans/s1.md", // optional
      "goals": [
        {
          "id": "s1-g1",
          "title": "...",
          "detail": "plans/s1.md", // optional
          "tasks": [
            {
              "id": "s1-g1-t1",
              "desc": "...",
              "area": "app",
              "status": "todo | doing | done | blocked",
              "verify": {
                "type": "unit | e2e | manual",
                "spec": "path/to/test",
                "desc": "what it verifies"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Rules for the `verify` field (always an object, never a string):

- `type: "manual"` → no `spec`; `done` requires human confirmation.
- `type: "unit"` → `spec` = path to the unit test file.
- `type: "e2e"` → `spec` = path to the e2e test file.
- `desc` = human-readable criterion of what is verified (used by the dashboard and the verifier).
