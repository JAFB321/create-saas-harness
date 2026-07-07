-- Initial neutral SaaS schema. MVP-1 of your generated roadmap specializes this into your domain.

-- Enums -----------------------------------------------------------------------
create type plan as enum ('free', 'pro', 'business');
create type order_status as enum ('pending', 'paid', 'failed', 'expired');
create type item_status as enum ('draft', 'active', 'archived');

-- updated_at trigger ----------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles (1:1 with auth.users) ----------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  plan plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.users.email can be null (phone/anonymous signups); never abort the signup trigger.
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- items (the example CRUD resource) -------------------------------------------
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  status item_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_owner_id_idx on items (owner_id);
create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

-- orders (one-time payments) --------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status order_status not null default 'pending',
  payment_method text,
  provider_ref text,
  idempotency_key text unique,
  fee_cents integer,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index orders_user_id_idx on orders (user_id);

-- subscriptions ---------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  plan plan not null,
  status text not null default 'active',
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- payment_events (append-only audit) ------------------------------------------
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders (id) on delete cascade,
  type text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index payment_events_order_id_idx on payment_events (order_id);
