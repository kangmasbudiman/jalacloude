# Panduan Deploy Jala Cloud ke Vercel

> Vercel = hosting aplikasi Next.js. Supabase = database + login Google.
> Keduanya dipakai bersama; ikuti urutan langkah di bawah.

## Prasyarat

- [ ] Akun GitHub
- [ ] Proyek Supabase sudah dibuat (lihat README.md bagian "Mengaktifkan Login Google Asli")
- [ ] Skema database sudah dijalankan (`supabase/schema.sql` di SQL Editor Supabase)

## Langkah 1 — Push kode ke GitHub

```bash
git remote add origin https://github.com/USERNAME/jala-cloud.git
git push -u origin main
```

Tips: jangan pernah commit `.env.local` — sudah otomatis dikecualikan oleh `.gitignore`.

## Langkah 2 — Import proyek di Vercel

1. Buka [vercel.com](https://vercel.com) → login pakai GitHub.
2. **Add New… → Project** → pilih repo `jala-cloud`.
3. Vercel mendeteksi Next.js otomatis → klik **Deploy** (boleh di-skip dulu env vars-nya).

## Langkah 3 — Pasang environment variables (PENTING)

Di Vercel: **Project → Settings → Environment Variables**, tambahkan untuk
semua environment (Production, Preview, Development):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key Supabase |

Lalu **Deployments → teratas → ⋯ Redeploy**.
Wajib redeploy — nilai env baru hanya membeku (bake) ke build baru.

## Langkah 4 — Daftarkan domain Vercel di Supabase

Vercel akan memberi domain seperti `https://jala-cloud.vercel.app`.
Buka **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://jala-cloud.vercel.app` (domain produksi)
- **Redirect URLs** — pastikan SEMUA ada:
  - `https://jala-cloud.vercel.app/auth/callback` ← domain produksi
  - `http://localhost:3000/auth/callback` ← biarkan, untuk development

Tanpa ini login Google di produksi gagal dengan error
`redirect_uri_mismatch` — kesalahan paling umum saat pertama deploy.

⚠️ Ganti Google OAuth Client ID/Secret juga jika perlu: **Authorized redirect
URIs** di Google Cloud Console memakai URL callback **Supabase**
(`https://xxxx.supabase.co/auth/v1/callback`), bukan domain Vercel — biasanya
tidak perlu diubah.

## Langkah 5 — Verifikasi

1. Buka `https://jala-cloud.vercel.app` → tombol **Masuk dengan Google**.
2. Login → diarahkan ke `/dashboard`.
3. Dompet & Tagihan → isi saldo → buat VPS.
4. Data tersimpan di Supabase: cek **Table Editor → `vps_servers` / `wallet_transactions`**.

## Custom domain (opsional)

Di Vercel: **Settings → Domains → Add** (mis. `jalacloud.id`), arahkan DNS
sesuai instruksi Vercel, lalu tambahkan `https://domainmu.id/auth/callback`
ke Redirect URLs Supabase.

## Troubleshooting cepat

| Gejala | Penyebab umum |
|---|---|
| Klik tombol Google, error `redirect_uri_mismatch` | Redirect URL domain Vercel belum ditambahkan di Supabase (Langkah 4) |
| Login sukses tapi diarahkan balik ke `/login` | Env vars belum dipasang saat build → **Redeploy** (Langkah 3) |
| Banner "Supabase belum dikonfigurasi" muncul di produksi | `NEXT_PUBLIC_SUPABASE_*` kosong — cek di Settings → Environment Variables |
| Tombol deploy error "vps_servers does not exist" | Skema SQL belum dijalankan di proyek Supabase produksi |
