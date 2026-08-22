# API Testing Guide — CODPO Backend

Semua endpoint berbasis `Authorization: Bearer <SUPABASE_JWT>` (bukan cookie)
supaya bisa dites langsung pakai curl/Postman tanpa frontend.

Base: `http://localhost:3000` (dev) — jalankan `npm run dev`.
JWT didapat dari Supabase Auth (lihat §0).

---

## 0. Dapatkan JWT test account

```bash
# signup (sekali per akun) — response berisi access_token
curl -s "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"seller@test.local","password":"password123","data":{"name":"Seller A"}}'

# login
curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"seller@test.local","password":"password123"}'
# → simpan .access_token ke $TOK_A (seller), $TOK_B (buyer)

export H_A="Authorization: Bearer $TOK_A"
export H_B="Authorization: Bearer $TOK_B"
```

## A. Listings

```bash
# Search publik (tanpa login) + ranking komponenal
curl "http://localhost:3000/api/listings?q=iphone&lat=-6.1&lng=106.9&radius_m=5000&sort=recommended"

# Detail publik (views ikut nambah)
curl "http://localhost:3000/api/listings/<LISTING_ID>"

# Pasang listing (auth)
curl -X POST http://localhost:3000/api/listings -H "$H_A" -H "Content-Type: application/json" \
  -d '{"title":"iPhone 13 128GB mulus","description":"fullset",
       "category_slug":"hp-tablet","condition":"seperti_baru",
       "normal_price":6000000,"bu_price":4800000,
       "bu_expires_at":"2026-09-01T00:00:00Z","sale_type":"BU",
       "cod_available":true,"area_label":"Bekasi Utara","lat":-6.1,"lng":106.9}'

# Update / hapus milik sendiri
curl -X PATCH http://localhost:3000/api/listings/<ID> -H "$H_A" -H "Content-Type: application/json" \
  -d '{"normal_price":5500000}'
curl -X DELETE http://localhost:3000/api/listings/<ID> -H "$H_A"
```

Ekspektasi negatif: PATCH/DELETE pakai `$H_B` → 403/404; `bu_price > normal_price` → 422 (constraint DB).

## B. Upload presign

```bash
curl -X POST http://localhost:3000/api/upload/presign -H "$H_A" -H "Content-Type: application/json" \
  -d '{"kind":"listing","mime":"image/jpeg","size":200000,"listing_id":"<ID>"}'
# → PUT upload_url dengan header Content-Type sama. Mime lain (mis. image/gif) → 415.
```

## C. Chat

```bash
# Buyer buka chat listing
curl -X POST http://localhost:3000/api/conversations -H "$H_B" -H "Content-Type: application/json" \
  -d '{"listing_id":"<ID>"}'

# Kirim & baca pesan
curl -X POST http://localhost:3000/api/conversations/<CONV_ID>/messages -H "$H_B" -H "Content-Type: application/json" \
  -d '{"type":"text","body":"gan masih ready?"}'
curl http://localhost:3000/api/conversations/<CONV_ID>/messages -H "$H_A"

# Inbox
curl http://localhost:3000/api/conversations -H "$H_A"
```

Realtime (integrasi nanti): subscribe `messages` via Supabase Realtime — RLS membatasi ke participant.

## D. COD flow lengkap

```bash
# 1. Buyer ajukan COD
curl -X POST http://localhost:3000/api/cod/requests -H "$H_B" -H "Content-Type: application/json" \
  -d '{"listing_id":"<ID>","preferred_date":"2026-09-01","preferred_time":"15:00","meeting_point":"Alun-alun Bekasi"}'

# 2a. Seller accept → session_id + transaction pending dibuat atomik
curl -X PATCH http://localhost:3000/api/cod/requests/<REQ_ID> -H "$H_A" -H "Content-Type: application/json" \
  -d '{"action":"accept"}'
# 2b. alternatif: {"action":"counter","counter_date":...,"counter_time":...,"counter_meeting_point":...}
# 2c. alternatif: {"action":"reject"}

# 3. Transisi state (validasi server-side, invalid jump → 400)
curl -X POST http://localhost:3000/api/cod/sessions/<SESS_ID>/state -H "$H_B" -H "Content-Type: application/json" \
  -d '{"state":"scheduled"}'   # lalu otw, arrived, item_check, completed

# 4. Live tracking: opt-in dulu, kirim posisi (throttle server-side 30s/50m)
curl -X PATCH http://localhost:3000/api/cod/sessions/<SESS_ID>/location -H "$H_B" -H "Content-Type: application/json" \
  -d '{"enabled":true}'
curl -X POST http://localhost:3000/api/cod/sessions/<SESS_ID>/location -H "$H_B" -H "Content-Type: application/json" \
  -d '{"lat":-6.1,"lng":106.9,"accuracy_m":10}'   # → stored | throttled
curl http://localhost:3000/api/cod/sessions/<SESS_ID> -H "$H_B"   # titik terakhir kedua pihak

# 5. Completed → transaction otomatis 'completed', listing otomatis 'sold'
curl http://localhost:3000/api/transactions -H "$H_B"
```

## E. Reviews, Reports, Notifications, Boost

```bash
curl -X POST http://localhost:3000/api/reviews -H "$H_B" -H "Content-Type: application/json" \
  -d '{"transaction_id":"<TRX_ID>","rating":5,"body":"mulus"}'
curl "http://localhost:3000/api/reviews?reviewee_id=<USER_ID>"   # publik

curl -X POST http://localhost:3000/api/reports -H "$H_B" -H "Content-Type: application/json" \
  -d '{"target_type":"listing","target_id":"<ID>","reason":"fake_item"}'

curl http://localhost:3000/api/notifications -H "$H_A"           # unread_count included
curl -X PATCH http://localhost:3000/api/notifications/<NOTIF_ID> -H "$H_A" \
  -H "Content-Type: application/json" -d '{"read":true}'

curl http://localhost:3000/api/boost/products                    # publik
curl -X POST http://localhost:3000/api/listings/<ID>/boost -H "$H_A" -H "Content-Type: application/json" \
  -d '{"product_code":"boost_24h"}'
```

## F. Admin (butuh row di `admin_users` — lihat bawah)

```bash
# Promote admin pertama: jalankan di SQL Editor
-- insert into public.admin_users (user_id) select id from auth.users where email='kamu@domain';

curl -X PATCH http://localhost:3000/api/admin/users/<USER_ID> -H "$ADMIN_H" -H "Content-Type: application/json" \
  -d '{"action":"suspend","note":"scam"}'
curl -X PATCH http://localhost:3000/api/admin/listings/<ID> -H "$ADMIN_H" -H "Content-Type: application/json" \
  -d '{"action":"remove","note":"fake"}'
curl -X POST http://localhost:3000/api/admin/categories -H "$ADMIN_H" -H "Content-Type: application/json" \
  -d '{"slug":"alat-musik","name":"Alat Musik","sort_order":13}'
curl "http://localhost:3000/api/admin/reports?status=open" -H "$ADMIN_H"
curl -X PATCH http://localhost:3000/api/admin/reports/<REPORT_ID> -H "$ADMIN_H" -H "Content-Type: application/json" \
  -d '{"status":"resolved","resolution_note":"terverifikasi palsu"}'
curl -X PATCH http://localhost:3000/api/admin/boost/products/boost_24h -H "$ADMIN_H" \
  -H "Content-Type: application/json" -d '{"price_idr":5000}'
curl http://localhost:3000/api/admin/analytics -H "$ADMIN_H"
```

Setiap mutasi admin tercatat di tabel `admin_actions` (audit trail).

## G. RLS evidence — scripts/rls_test.sql

Jalankan **satu file** di Supabase SQL Editor setelah migrations di-push:

```bash
psql "$DB_URL" -f supabase/migrations/*.sql   # push schema (atau supabase db push)
psql "$DB_URL" -f scripts/rls_test.sql        # 30+ kasus PASS/FAIL, auto-rollback
```

Suite membuktikan antara lain:

- user A tidak bisa baca conversation A-B? (C ditolak) ✅
- B tidak bisa update/hapus listing A ✅
- C tidak bisa kirim pesan ke conversation orang lain ✅
- loncat state `accepted→completed` ditolak; `item_check/completed` hanya buyer ✅
- post lokasi sebelum opt-in / sebelum OTW ditolak; throttle jarak bekerja ✅
- purge lokasi scoped per-user (titik lawan aman) ✅
- duplicate review ditolak; non-participant review ditolak ✅
- report privat; admin resolve ter-audit ✅
- user biasa tidak bisa suspend diri sendiri ✅

## Rate limits aktif

| Scope          | Batas       |
| -------------- | ----------- |
| presign        | 30/menit/IP |
| message        | 30/menit/IP |
| cod-request    | 10/jam/IP   |
| cod-decide     | 30/menit/IP |
| cod-location   | 60/menit/IP |
| review         | 10/jam/IP   |
| report         | 5/jam/IP    |
| boost-buy      | 10/jam/IP   |
| listing-create | 10/jam/IP   |
