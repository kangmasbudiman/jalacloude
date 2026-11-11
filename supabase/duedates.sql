-- ============================================================
-- Jala Cloud — Tanggal jatuh tempo per order (VPS)
-- ============================================================

alter table public.vps_servers
  add column if not exists due_day smallint check (due_day between 1 and 31);

-- Admin boleh membaca server milik client (untuk kirim invoice)
drop policy if exists "vps_servers_admin_read" on public.vps_servers;
create policy "vps_servers_admin_read"
  on public.vps_servers
  for select
  to authenticated
  using (public.is_admin());
