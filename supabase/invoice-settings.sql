-- ============================================================
-- Jala Cloud — Pengaturan Invoice (admin panel)
-- Baris tunggal (id = 1) — diubah lewat /dashboard/settings
-- ============================================================

create table if not exists public.invoice_settings (
  id            int primary key default 1 check (id = 1),
  company_name  text not null default 'InData Indonesia',
  company_sub   text not null default 'CV Jaring Laba Laba',
  payee_line    text not null default 'PAYMENT TO CV JALA',
  bank_line     text not null default 'Mandiri 1100007267880',
  client_name   text not null default 'Rumah Sakit Royal Prima Jambi',
  sales_name    text not null default 'Ronel Daniel Ramdhani',
  contact_phone text not null default '+62 812-2138-6406',
  updated_at    timestamptz not null default now()
);

alter table public.invoice_settings enable row level security;

drop policy if exists "invoice_settings_all" on public.invoice_settings;
create policy "invoice_settings_all"
  on public.invoice_settings
  for all
  to authenticated
  using (true)
  with check (true);

-- Seed baris tunggal
insert into public.invoice_settings (id) values (1) on conflict (id) do nothing;
