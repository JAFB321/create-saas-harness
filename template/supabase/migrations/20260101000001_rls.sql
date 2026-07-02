-- Row Level Security. The browser (anon/authenticated) can only touch its OWN rows.
-- Privileged writes (orders, subscriptions, payment_events) happen via the service role on the
-- server, which bypasses RLS — so those tables get NO permissive policies for end users.

alter table profiles enable row level security;
alter table items enable row level security;
alter table orders enable row level security;
alter table subscriptions enable row level security;
alter table payment_events enable row level security;

-- profiles: a user reads/updates only their own profile.
create policy "profiles: select own"
  on profiles for select using (auth.uid() = id);
create policy "profiles: update own"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Column-level guard: users must NOT self-edit `plan`/`role` (privilege escalation);
-- those only move via the service role (webhooks/admin). RLS alone can't restrict columns.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- items: owner has full CRUD over their own items.
create policy "items: select own"
  on items for select using (auth.uid() = owner_id);
create policy "items: insert own"
  on items for insert with check (auth.uid() = owner_id);
create policy "items: update own"
  on items for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "items: delete own"
  on items for delete using (auth.uid() = owner_id);

-- orders: a user may READ their own orders (writes are server-side via service role).
create policy "orders: select own"
  on orders for select using (auth.uid() = user_id);

-- subscriptions: a user may READ their own subscription (writes are server-side).
create policy "subscriptions: select own"
  on subscriptions for select using (auth.uid() = user_id);

-- payment_events: no end-user access (service role only).
