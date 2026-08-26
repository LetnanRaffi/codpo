# CODPO

Marketplace lokal untuk jual-beli barang secara COD. Aplikasi ini memakai Next.js App Router, Supabase (Auth, PostgreSQL, RLS, Realtime), dan Cloudflare R2 untuk media.

## Fitur

- Auth email/password, profil buyer/seller, dan kontrol akun admin
- Listing, pencarian radius, kategori, BU, boost, favorit, dan upload foto
- Chat realtime, permintaan COD, state transaksi, serta berbagi lokasi berbasis consent
- Riwayat transaksi, rating, laporan, notifikasi, dashboard seller, dan dashboard admin
- Row-level security, validasi API, rate limit, serta URL upload R2 yang ditandatangani

## Menjalankan lokal

Gunakan Node.js 20 atau lebih baru, lalu salin konfigurasi berikut ke `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL= # opsional; kosong memakai signed media endpoint
```

Instal dependency, terapkan migration, lalu jalankan aplikasi:

```bash
npm ci
node scripts/mgmt-push.mjs
npm run dev
```

`scripts/mgmt-push.mjs` memerlukan token Supabase Management API pada environment pengembangan yang sudah dikonfigurasi. Untuk deployment lain, migration di `supabase/migrations/` juga bisa diterapkan melalui workflow Supabase CLI/CI.

Di Supabase Auth, daftarkan origin deployment dan `/auth/callback` sebagai redirect URL. Konfigurasikan custom SMTP sebelum produksi agar email konfirmasi dan reset password tidak bergantung pada layanan email percobaan/rate limit bawaan.

`R2_PUBLIC_BASE_URL` boleh dikosongkan. Dalam kondisi itu, foto listing dilayani lewat signed endpoint publik yang tetap memeriksa visibilitas listing, sedangkan media chat hanya bisa diambil oleh participant yang login.

## Verifikasi

```bash
npm run lint
npx tsc --noEmit
npm run build -- --webpack
node scripts/cred-check.mjs
node scripts/api-e2e.mjs
```

E2E API membuat akun dan data sementara dengan prefix `codpo.test.` lalu membersihkannya kembali. Jalankan terhadap environment pengujian, bukan database produksi yang sedang menerima trafik.

Boost masih berada dalam mode MVP tanpa payment gateway: aktivasi dicatat sebagai transaksi uji dan tidak menarik dana. Sambungkan gateway + webhook sebelum menjual paket boost. Rate limiter aplikasi saat ini juga bersifat per-instance; ganti dengan penyimpanan terdistribusi sebelum menjalankan deployment multi-instance atau trafik tinggi.

## Struktur penting

- `app/` — halaman dan route handler Next.js
- `components/` — UI dan client interactions
- `lib/server/` — auth, validasi, query marketplace, dan helper API
- `supabase/migrations/` — schema, RLS, function, trigger, serta grant
- `scripts/api-e2e.mjs` — audit alur penuh lintas dua pengguna dan admin

Sebelum go-live, lengkapi data bisnis serta review hukum pada `tos-codpo-draft.md` dan `privacy-policy-codpo-draft.md`.
