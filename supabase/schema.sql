-- ============================================================
-- Jala Cloud — Skema Database (Tahap 2)
-- Cara pakai: buka Supabase Dashboard → SQL Editor → paste semua isi
-- file ini → Run.
-- ============================================================

-- Tabel server VPS --------------------------------------------
create table if not exists public.vps_servers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  plan        text not null,
  os          text not null,
  region      text not null,
  ip          text not null,
  /** Port NAT (VPS yang berbagi IP publik, dibedakan lewat port). null = IP penuh. */
  port        smallint,
  status      text not null default 'running' check (status in ('running', 'stopped')),
  created_at  timestamptz not null default now()
);

alter table public.vps_servers enable row level security;

drop policy if exists "vps_servers_user_all" on public.vps_servers;
create policy "vps_servers_user_all"
  on public.vps_servers
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabel transaksi dompet --------------------------------------
create table if not exists public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('topup', 'purchase')),
  amount      bigint not null check (amount > 0),
  description text not null,
  status      text not null default 'success',
  created_at  timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_transactions_user_all" on public.wallet_transactions;
create policy "wallet_transactions_user_all"
  on public.wallet_transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index bantu -------------------------------------------------
create index if not exists vps_servers_user_idx on public.vps_servers (user_id);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions (user_id);
