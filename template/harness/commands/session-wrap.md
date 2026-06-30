---
description: Session wrap ritual — review, update state and docs, leave staged
allowed-tools: Bash, Read, Edit, Task
---

Run the wrap ritual defined in `harness/docs/workflow.md`. Steps:

1. Review which tasks were touched this session. Confirm each is `done` (verify PASS) or `blocked`
   (with a note). None left in `doing` without a reason.
2. **Adversarial review** — delegate the session diff (`git diff`) to the `reviewer` subagent against
   the plan/task. If it reports **correctness GAPS**, do NOT mark those tasks `done`: delegate the fix
   to the implementer that did the task (`dev-agent` or `dev-agent-pro`) and re-verify before closing.
   If it reports APPROVED (or only style), continue.
3. Delegate to the `doc-keeper` subagent:
   - Mark status in `harness/docs/roadmap/mvp-1.json` (only tasks with verifier PASS **and** reviewer
     approved → `done`).
   - Sync the state docs (`harness/docs/state/*.md`) with what was implemented.
4. Run `pnpm format` from the repo root to format everything before staging.
5. `git status` and `git add` the relevant changes. If you are on the main branch, create a branch
   first. **Do NOT commit**: leave everything staged and tell the human they MUST commit, proposing a
   message in English with the `type: description` format (feat/fix/refactor/chore).
6. Report to the human: completed tasks, blocked (with reason), reviewer gaps if any, the new sprint
   %, the suggested next task, and the proposed commit message.

Never `git commit` or `git push` unless the human explicitly asks.
