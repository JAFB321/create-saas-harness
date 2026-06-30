---
description: Verify the current work (unit + smoke E2E + types) via the verifier subagent
allowed-tools: Bash, Read, Task
---

Delegate verification of the current work to the `verifier` subagent. Optional argument `$ARGUMENTS`
= a task id or specific spec to verify; if empty, verify everything touched this session.

The verifier must:

1. Determine what to run based on the `verify` field of the task(s) in
   `harness/docs/roadmap/mvp-1.json`.
2. Run `pnpm test` and/or `pnpm e2e` and/or `pnpm check-types` as appropriate.
3. Return a PASS/FAIL/MANUAL verdict with evidence.

Remember the hard rule: a task is NOT marked `done` without a PASS verdict (or human confirmation if
it's `manual`). If FAIL, delegate the fix to the implementer that did the task (`dev-agent` or
`dev-agent-pro`) with the log and re-verify (max 3 retries; then `blocked`). If `dev-agent` fails
repeatedly on something complex/critical, escalate to `dev-agent-pro`.
