# Infra state

## Mock-first integrations

Every third-party integration sits behind an interface in `@app/integrations`, selected by a factory
that defaults to a mock when keys are absent (logs a `provider_fallback` warning, never crashes):

| Integration | Interface         | Mock                  | Real (scaffold-time choice)              | Env selector        |
| ----------- | ----------------- | --------------------- | ---------------------------------------- | ------------------- |
| Payments    | `PaymentProvider` | `MockPaymentProvider` | `RealPaymentProvider` → {{PAYMENTS_PROVIDER}} | `PAYMENTS_PROVIDER` |
| Email       | `EmailProvider`   | `MockEmailProvider`   | `RealEmailProvider` → {{EMAIL_PROVIDER}}     | `EMAIL_PROVIDER`    |
| Storage     | `StorageProvider` | `MockStorageProvider` | `RealStorageProvider` → {{STORAGE_PROVIDER}} | `STORAGE_PROVIDER`  |

Each integration's chosen adapter is re-exported from `packages/integrations/src/<kind>/real.ts`
(class + `REAL_*_PROVIDER` name + `isReal*Configured()`); the scaffolder repoints that file and
prunes the unchosen adapters and their SDK dependencies. `status.ts` decides "requested vs
effective" provider generically from those re-exports (used by `/api/health`). `factory.ts`
memoizes singletons (`resetProviders()` for tests). The real provider activates only when the env
selector matches the scaffold-time choice AND its keys are present; otherwise mock + one warning.

## Settlement

`settleOrder(orderId, input)` is the single payment-state mutator: UUID guard → append-only
`payment_events` → conditional UPDATE ("paid always wins", concurrent-safe) → best-effort fulfillment
(receipt email). The webhook route (`/api/webhooks/payments`) parses via the active provider, calls
`settleOrder`, and applies a plan upgrade when the paid order carries `metadata.plan`.

## Env

Validated in `@app/db/env.ts`. Required for the app to run: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Everything else is optional (mock-first).
`APP_BASE_URL` is required in deployed (preview/production) envs. Full list: `.env.example`.

## Deploy

- `supabase/` — config + migrations; `pnpm db:types` regenerates types.
- `.github/workflows/`: `verify` (types+lint+test on push/PR), `migrations` (pushes to the linked
  remote on merge to main; needs Supabase secrets). E2E runs locally (`pnpm e2e`) — CI doesn't spin
  a Supabase stack.
- Hosting target is Vercel (Next.js). Set the env vars in the host; never commit `.env.local`.
