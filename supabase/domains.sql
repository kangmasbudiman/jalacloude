-- ============================================================
-- Jala Cloud — Skema Domain (RS Royal Prima Jambi)
-- Dijalankan setelah schema.sql utama.
-- ============================================================

-- Tabel domain -----------------------------------------------
create table if not exists public.domains (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  domain_name        text not null unique,
  status             text not null default 'active'
                     check (status in ('active', 'expired', 'pending', 'transfer')),
  registrar          text not null default 'Jala Cloud',
  registered_at      timestamptz not null,
  expires_at         timestamptz not null,
  auto_renew         boolean not null default true,
  privacy_protection boolean not null default true,
  transfer_lock      boolean not null default true,
  nameservers        text[] not null default '{ns1.jalacloud.id,ns2.jalacloud.id}',
  created_at         timestamptz not null default now()
);

alter table public.domains enable row level security;

drop policy if exists "domains_user_all" on public.domains;
create policy "domains_user_all"
  on public.domains
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabel catatan DNS ------------------------------------------
create table if not exists public.domain_dns_records (
  id        uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains (id) on delete cascade,
  type      text not null check (type in ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA')),
  name      text not null default '@',
  value     text not null,
  priority  integer not null default 10,
  ttl       integer not null default 3600,
  created_at timestamptz not null default now()
);

alter table public.domain_dns_records enable row level security;

drop policy if exists "domain_dns_user_all" on public.domain_dns_records;
create policy "domain_dns_user_all"
  on public.domain_dns_records
  for all
  to authenticated
  using (
    exists (
      select 1 from public.domains d
      where d.id = domain_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.domains d
      where d.id = domain_id and d.user_id = auth.uid()
    )
  );

-- Index bantu -----------------------------------------------
create index if not exists domains_user_idx on public.domains (user_id);
create index if not exists domain_dns_domain_idx on public.domain_dns_records (domain_id);
