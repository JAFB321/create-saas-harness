# App state

The current shape of `apps/web` and the `@app/*` packages. Present-tense snapshot of what exists.

## Monorepo

- `apps/web` — Next.js 15 (App Router, React 19), Tailwind v4.
- `packages/core` (`@app/core`) — pure domain: payment state machine, plans/entitlements, zod schemas
  (auth, item), money formatting, email templates. No I/O.
- `packages/db` (`@app/db`) — Supabase clients (browser/server/service/middleware), env helpers,
  generated `database.types.ts`.
- `packages/integrations` (`@app/integrations`) — mock-first providers (payment/email/storage) behind
  interfaces, the provider factory, and `settleOrder` (the payment choke-point).
- `packages/config` (`@app/config`) — shared tsconfig/eslint/prettier/tailwind presets.

## Routes (`apps/web/app`)

- `/` — public landing.
- `/(auth)/login`, `/(auth)/signup` — auth forms (server actions in `(auth)/_actions.ts`:
  `loginAction`, `signupAction`, `signoutAction`).
- `/auth/callback` — OAuth/email-link code exchange.
- `/(app)/*` — authenticated area (gated by `middleware.ts` + `requireUser`):
  - `/dashboard` — plan + item usage summary.
  - `/items` — list/create/delete the example resource (`items/_actions.ts`).
  - `/billing` — plan cards; `startCheckoutAction` creates an order + provider checkout.
  - `/settings` — profile read-out.
- `/checkout/[orderId]` — provider redirect target; in mock mode shows a simulate panel.
- `/api/webhooks/payments` — verifies + parses the provider webhook, runs `settleOrder`, applies plan.
- `/api/health` — liveness + effective provider status.

## Auth & access

- `lib/auth.ts`: `getSessionUser()` / `requireUser()` read the Supabase session server-side.
- `middleware.ts` refreshes the session every request and redirects unauthenticated users away from
  the app area.
- Privileged writes (orders, subscriptions, payment_events, plan changes) go through the service-role
  client on the server; the browser only reads/writes its own rows under RLS.

## i18n

`lib/i18n.ts` holds keyed English strings (`t(key)`). UI strings are keyed so locales can be added.
