# Changelog — CODPO

Semua perubahan penting project ini dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/), versi mengikuti fase development.

## [0.6.0] — 2026-08-23 · Backend Phase

### Added
- **Database schema** — 20 tabel PRD §46 dalam 10 migration terstruktur:
  profiles (publik-safe), user_contacts/user_locations (privat), categories,
  listings + listing_images, conversations + conversation_participants + messages,
  cod_requests/cod_sessions/cod_locations, transactions, reviews, reports,
  boost_products + listing_boosts, notifications, admin_users + admin_actions,
  app_config.
- **PostGIS** penuh (`geography(Point,4326)` + GiST) — radius via `ST_DWithin`,
  jarak via `ST_Distance`. View `listing_public` membulatkan koordinat ~110m
  (privacy PRD §13).
- **RLS semua tabel** sesuai §45/§26: chat participant-only lewat
  `conversation_participants`, listing owner-only untuk tulis & publik aktif
  untuk baca, kontak privat owner-only, admin-only untuk tabel admin.
  Guard trigger: status/verified profil hanya bisa diubah admin, kolom `views`
  tidak bisa ditulis seller, delete listing diblokir saat transaksi berjalan.
- **COD state machine** DB-enforced (§29): peta transisi eksplisit di
  `cod_transition_allowed`, invalid jump ditolak server-side;
  `item_check`/`completed` hanya buyer. Accept request → session + transaction
  dibuat atomik. Trigger sinkron otomatis: transaction.status mengikuti state,
  completed → listing sold.
- **Live tracking** (§30-31): opt-in eksplisit per sesi, throttle server-side
  (interval ≥30s + jarak ≥50m dari `app_config`), update ditolak setelah sesi
  selesai, retensi maks 50 titik/sesi aktif + purge 24 jam pasca-ended
  (pg_cron), RPC `purge_my_locations` scoped ketat ke diri sendiri.
- **Search & ranking** (§19-21): RPC `search_listings` PostGIS dengan semua
  filter (keyword, kategori, radius, harga, kondisi, BU, COD) + 5 sort +
  ranking deterministik dengan komponen skor individual terekspos (mode explain).
- **Auth** email+password Supabase, bootstrap profile otomatis via trigger,
  mode buyer↔seller sebagai flag (satu akun, PRD §6).
- **Storage R2**: presigned PUT upload langsung client→R2, validasi mime/size/
  kuota dibaca dari `app_config`.
- **BU expiry** dua lapis: guard on-read di semua query + pg_cron normalisasi.
  Cron lain: purge lokasi (hourly), expire sesi zombie, reminder COD.
- **API routes (20)**: listings CRUD+search, presign, conversations/messages,
  COD requests/state/location/sharing, transactions, reviews, reports,
  notifications, boost, admin (users/listings/categories/reports/boost/analytics).
- **Security cross-cutting** (§45): rate limiting per-scope, validasi Zod
  server-side, Bearer auth + cek status akun, pola 3 lapis
  (RLS → user-bound client → RPC logic), audit trail `admin_actions`.
- `scripts/rls_test.sql` — suite bukti RLS 30+ kasus (auto-rollback),
  `docs/api-testing.md`, `docs/backend-decisions.md`.

### Pending
- Push schema + eksekusi test suite menunggu kredensial Supabase project.
- Payment gateway boost belum diputuskan (Midtrans/Xendit) — pembayaran
  dicatat simulasi `paid`.

## [0.5.0] — 2026-08-22 · Legal Pages & Footer

### Added
- `/terms` dan `/privacy`: render live dari file draft markdown di repo root,
  styling keterbacaan-first (kolom 68ch, leading longgar), placeholder
  `[ISI ...]` / `[CATATAN REVIEW HUKUM...]` dirender apa adanya dengan
  highlight kuning pucat.
- Footer profesional marketplace: bg ink, brand + tagline, kolom Jelajahi/Akun/
  Bantuan & Legal, bottom bar copyright + "Dibuat di Indonesia". Link mati
  disensor sampai halamannya ada.
- Checkbox wajib setuju S&K + Privacy Policy di `/register`
  (button disabled + Zod literal).

### Fixed
- Highlight placeholder kini masuk elemen bold/italic.
- Loader dokumen repoint ke file draft asli; duplikat "(copy 1)" dihapus.

## [0.4.x] — 2026-08-22 · Supporting Pages & Review Fixes

### Added
- `/transactions` (tabs COD Aktif/Selesai/Batal, stepper status §29),
  `/favorites`, `/profile` (mode switcher buyer/seller, stats reputasi),
  `/seller/[id]` profil publik seller (§23) — menutup semua route 404.
- Wire link: account menu → Profil, listing "Lihat profil" → /seller/[id].

### Fixed (hasil review)
- Stale query di `/search` saat ganti pencarian dari header.
- Coretan harga konsisten pakai PriceStrike; hapus line-through ganda.
- CTA bar bawah ikut safe-area inset (iPhone).
- Tinggi chat layout vs room diselaraskan; aria-label thumbnail gallery.

## [0.3.0] — 2026-08-21 · Core Transaction Loop UI

### Added
- `/listing/[id]`: gallery, harga + coretan BU, kartu seller, dialog Ajukan
  COD, CTA sticky mobile di atas bottom nav. SSG 10 listing mock.
- `/sell`: form lengkap — preview foto lokal (objectURL), kategori, kondisi,
  toggle BU + harga + masa aktif, area publik + disclaimer privacy, success
  state jujur (belum tersimpan).
- `/chat`: split-view desktop, list→detail mobile, quick actions §25
  (Ajukan COD/Kirim Lokasi/Saya OTW/Sudah Sampai), bubbles text/image/COD.

## [0.2.0] — 2026-08-21 · Home & Discovery

### Added
- Listing card sesuai §18 + signature price-strike spidol (DS §5).
- Home 5 section §10: BU Terdekat, Baru Ditambahkan, Harga Menarik, Kategori,
  Semua Barang.
- `/search`: filter client-side (kategori/harga/kondisi/BU/COD), 5 sort,
  sidebar sticky desktop + bottom sheet mobile.
- `/category/[slug]` breadcrumb + grid, SSG 12 kategori.
- EmptyState actionable + loading skeleton + error boundary retry.

## [0.1.0] — 2026-08-21 · Shell & Navigasi + Setup

### Added
- Setup: Next.js 16 (App Router, TS, Tailwind v4), ESLint + Prettier,
  shadcn base (radix-nova), token warna design system
  (ink/paper/bu-red/trust-green/gold), fonts Big Shoulders + Plus Jakarta Sans
  + IBM Plex Mono, Supabase clients (@supabase/ssr) + proxy session refresh,
  R2 client config, bucket `codpo-images` (APAC).
- Sticky header: logo, search bar, location+radius picker (1-25km default 5),
  icon buttons Chat/Favorit/Transaksi berbadge, account menu + mock auth toggle.
- Desktop top category nav horizontal; mobile bottom nav 5 item dengan CTA
  Jual raised.
- Mock data shape PRD §46 di `lib/mock/` + `lib/types.ts`.
- Dark mode turunan hue brand via color-mix (next-themes).

### Notes
- Navigasi desktop diputuskan top category nav + header icons — BUKAN sidebar
  kiri (koreksi atas PRD §50, final).

[Unreleased]: backend menunggu kredensial Supabase; integrasi frontend menyusul
setelah backend dikonfirmasi.
