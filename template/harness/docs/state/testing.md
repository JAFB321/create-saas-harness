# Testing state

## Stack

- **Unit:** Vitest, per package (`packages/*/src/**/*.test.ts`). Pure domain logic — no external
  services. Run with `pnpm test` (via turbo) or per package.
- **E2E:** Playwright (`e2e/*.spec.ts`), Chromium. Runs against the production build (`next start`)
  with providers forced to mock. Requires a configured Supabase (local stack or a project).

## Unit coverage

- `@app/core`: `payment/state-machine.test.ts` (idempotency / "paid always wins"),
  `users/entitlements.test.ts` (plan limits).
- `@app/integrations`: `__tests__/factory.test.ts` (mock-first fallback),
  `__tests__/mock-payment.test.ts` (checkout + webhook parsing).

## E2E coverage

- `landing.spec.ts` — landing renders; unauthenticated redirect to `/login` (no Supabase needed for
  the redirect assertion since middleware handles it).
- `critical-flow.spec.ts` — signup → create item → upgrade → simulate paid → plan applied
  (needs Supabase).
- `helpers/auth.ts` — `signUpFreshUser` UI helper.

## Commands

| Command       | What                                                |
| ------------- | --------------------------------------------------- |
| `pnpm verify` | check-types + lint + unit tests (CI default)        |
| `pnpm test`   | unit tests across packages                          |
| `pnpm e2e`    | Playwright (auto-builds + starts the app)           |
| `pnpm e2e:server` | build + start the app for reuse across e2e runs |

## Convention

A task is `done` only when its `verify` is green. Never delete/skip a test to make a suite pass.
