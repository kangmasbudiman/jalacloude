-- ============================================================
-- Jala Cloud — Role Admin/Client & Invoice dari Admin
-- Jalankan setelah schema.sql & invoice-settings.sql
-- ============================================================

-- Profil pengguna + role -------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

-- Cek apakah user yang login adalah admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- Otomatis buat profil setiap user baru (login Google) -------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill user yang sudah ada
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;

-- Invoice yang diunggah admin --------------------------------
create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles (id) on delete cascade,
  invoice_no   text not null,
  description  text not null default 'Cloud VPS',
  amount       numeric not null default 0,
  issued_at    date not null default current_date,
  file_path    text not null,
  file_name    text not null,
  mime_type    text,
  status       text not null default 'sent' check (status in ('sent', 'paid', 'void')),
  uploaded_by  uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);

alter table public.invoices enable row level security;

drop policy if exists "invoices_admin_all" on public.invoices;
create policy "invoices_admin_all"
  on public.invoices
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "invoices_client_read" on public.invoices;
create policy "invoices_client_read"
  on public.invoices
  for select
  to authenticated
  using (client_id = auth.uid());

create index if not exists invoices_client_idx on public.invoices (client_id);

-- Storage bucket privat untuk file invoice -------------------
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

drop policy if exists "invoices_storage_admin" on storage.objects;
create policy "invoices_storage_admin"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'invoices' and public.is_admin())
  with check (bucket_id = 'invoices' and public.is_admin());

drop policy if exists "invoices_storage_client_read" on storage.objects;
create policy "invoices_storage_client_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
