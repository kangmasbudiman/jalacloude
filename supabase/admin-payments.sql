-- ============================================================
-- Jala Cloud — Admin boleh melihat transaksi dompet client
-- (untuk daftar tagihan/pembayaran masuk di Admin Panel)
-- ============================================================

drop policy if exists "wallet_transactions_admin_read" on public.wallet_transactions;
create policy "wallet_transactions_admin_read"
  on public.wallet_transactions
  for select
  to authenticated
  using (public.is_admin());
