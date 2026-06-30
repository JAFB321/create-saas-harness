# Database state

Postgres schema in `supabase/migrations`, surfaced to the app via `@app/db` types and clients.

## Enums

- `plan`: `free | pro | business`
- `order_status`: `pending | paid | failed | expired`
- `item_status`: `draft | active | archived`

## Tables

- `profiles` — 1:1 with `auth.users` (PK = user id). `email`, `full_name`, `role` (default `user`),
  `plan` (default `free`). A trigger (`handle_new_user`) creates the row on signup. `updated_at`
  maintained by trigger.
- `items` — the example owned resource. `owner_id → profiles`, `title`, `description`, `status`.
- `orders` — one-time payments. `user_id → profiles`, `amount_cents`, `currency`, `status`,
  `payment_method`, `provider_ref`, `idempotency_key` (unique), `fee_cents`, `metadata` (jsonb),
  `paid_at`.
- `subscriptions` — one per user (`user_id` unique). `plan`, `status`, `provider_ref`,
  `current_period_end`.
- `payment_events` — append-only audit written by `settleOrder` (`order_id`, `type`, `raw`).

## RLS

Enabled on every table. End users (anon/authenticated) can only touch their OWN rows:

- `profiles`: select/update own.
- `items`: full CRUD where `owner_id = auth.uid()`.
- `orders`, `subscriptions`: select own (writes are server-side via the service role).
- `payment_events`: no end-user policy (service role only).

## Clients

`@app/db` exposes `createBrowserClient`, `createServerClient` (cookies), `createServiceClient`
(service role; server-only, throws in the browser), `createMiddlewareClient`. Env is validated by
`getPublicEnv`/`getServiceEnv`.

## Idempotency

`settleOrder` is the single mutator of the order state machine: UUID guard at the entry, always
inserts a `payment_events` row, and a conditional UPDATE that excludes `paid` so concurrent webhooks
fulfill exactly once ("paid always wins").
