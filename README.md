# Jala Cloud — Sewa Cloud VPS & Layanan Cloud

Platform sewa cloud VPS milik **CV JALA**. Dibangun dengan
**Next.js 16 + TypeScript + Tailwind CSS v4 + Supabase Auth**, dengan pola
login ala SumoPod (OAuth Google + PKCE). Tagline: *"Server aktif dalam 60 detik."*

## Fitur Tahap Ini (MVP)

- **Login via Google** (Supabase OAuth + PKCE) alih-alih password
- Halaman `/auth/callback` untuk menyelesaikan kembali dari Google (dengan penanganan error & timeout)
- **Landing page** berbahasa Indonesia (hero, produk, harga)
- **Dashboard shell**: sidebar 15 menu (dapat diciutkan) + topbar dengan profil Google
- Halaman Ringkasan + halaman **VPS** (buat server dummy dengan pemilihan paket, wilayah, password)
- Menu lain menampilkan halaman "Segera Hadir"
- **Mode demo** otomatis: kalau `.env.local` belum diisi, app tetap jalan tanpa login asli

## Harga Paket VPS

| Paket | Spesifikasi | Harga/bulan |
|---|---|---|
| Jala Mini | 1 vCPU • 1 GB RAM • 20 GB NVMe | Rp 350.000 |
| Jala Pro | 2 vCPU • 4 GB RAM • 60 GB NVMe | Rp 550.000 |
| Jala Max | 4 vCPU • 8 GB RAM • 120 GB NVMe | Rp 645.000 |

## Mengaktifkan Database (Tahap 2 — Dompet & VPS)

Setelah login Google aktif, jalankan skema database:

1. Buka **Supabase Dashboard → SQL Editor**.
2. Paste seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. Selesai — tabel `vps_servers` & `wallet_transactions` aktif dengan RLS
   (setiap pengguna hanya melihat data miliknya sendiri).

Alur bisnis yang aktif: isi saldo di **Dompet & Tagihan** → buka VPS →
"Deploy" memotong saldo dan mencatat transaksi otomatis.
Tanpa konfigurasi Supabase, semuanya tetap bisa dicoba dalam
**mode demo** (data disimpan di localStorage browser).

## Cara Jalankan

```bash
npm install
npm run dev
# buka http://localhost:3000
```

## Mengaktifkan Login Google Asli (5 menit)

### 1. Buat proyek Supabase
1. Daftar/masuk di [supabase.com](https://supabase.com) → **New project** (gratis).
2. Setelah jadi, buka **Project Settings → API**. Salin:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / publishable key` → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Buat OAuth Client Google
1. Buka [console.cloud.google.com](https://console.cloud.google.com) → buat project.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Isi nama app "Jala Cloud", email support, lalu tambahkan emailmu sebagai **test user** (sampai app dipublikasikan).
3. **Credentials → Create Credentials → OAuth Client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**: diambil dari Supabase (langkah 3) — bentuknya
     `https://xxxx.supabase.co/auth/v1/callback`

### 3. Hubungkan Google ke Supabase
1. Di Dashboard Supabase → **Authentication → Sign In / Up → Google** → toggle **Enable**.
2. Tempel **Client ID** dan **Client Secret** dari langkah 2.
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs** tambahkan: `http://localhost:3000/auth/callback`

### 4. Isi `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon/publishable key
```

Lalu restart `npm run dev`. Tombol "Masuk dengan Google" sudah aktif.

## Struktur Proyek

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx            # Halaman login (tombol Google)
│   ├── auth/callback/page.tsx    # Handler balikan OAuth
│   └── dashboard/
│       ├── layout.tsx            # Shell: sidebar + topbar + proteksi sesi
│       ├── page.tsx              # Ringkasan
│       ├── vps/page.tsx          # Manajemen VPS (dummy)
│       └── [slug]/page.tsx       # Placeholder "Segera Hadir"
├── components/
│   ├── auth-provider.tsx         # Context sesi (signInWithGoogle, signOut)
│   ├── google-button.tsx         # Tombol "Masuk dengan Google"
│   └── site-header.tsx           # Header landing + banner mode demo
└── lib/
    ├── supabase.ts               # Inisialisasi client Supabase
    └── menu.ts                   # Daftar menu sidebar
```

## Rencana Tahap Berikutnya

1. **Tahap 2** — halaman Billing (saldo & top-up), tabel data VPS dari database, halaman detail VPS (restart/stop, metric)
2. **Tahap 3** — guard middleware server-side (JWT Supabase) + backend provisioning
3. **Tahap 4** — fitur tambahan: domain, storage, email, AI API

---

© 2026 CV JALA — Jala Cloud. Seluruh hak cipta dilindungi.
