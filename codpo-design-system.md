# CODPO — Design System

> File ini acuan visual buat semua halaman/komponen yang dibangun ke depan. Isinya prinsip & alasan, bukan spek pixel-perfect kaku — kalau ada situasi yang gak ke-cover eksplisit di sini, ambil keputusan yang konsisten sama **semangat**-nya, bukan cari celah aturan.

---

## 1. Brand Essence

CODPO itu marketplace lokal buat orang **BU (Butuh Uang)** — bukan Shopee versi kecil. Referensi visualnya bukan marketplace app generik, tapi **budaya spanduk toko/pasar Indonesia**: tulisan "CUCI GUDANG", "OBRAL", harga lama dicoret spidol tangan. Urgent, jujur, gak baper, tapi tetap kerasa aman buat transaksi.

Rasa yang harus selalu ada di tiap halaman: **cepat, jujur soal harga, gak ribet, gak norak**.

---

## 2. Warna

```css
--ink: #1c1410; /* teks utama */
--paper: #ffffff; /* background utama */
--paper-soft: #f5f1ec; /* background section/card sekunder */
--bu-red: #e4402a; /* signature: urgensi, BU, CTA utama */
--bu-red-deep: #b82e1c; /* hover/pressed dari bu-red */
--trust-green: #1f7a5c; /* kepastian: COD tersedia, sukses, verified */
--gold: #d89b2c; /* langka: boost/premium doang */
```

**Prinsip pemakaian, bukan aturan pixel:**

- Ini semua warna yang ada. Jangan nambah hex baru buat kebutuhan biasa — kalau butuh variasi (lebih terang/gelap), turunkan dari token ini via opacity atau mix, bukan nemuin warna baru.
- `bu-red` itu bahasa urgensi — dipakai buat badge BU, CTA utama ("Ajukan COD"), dan elemen yang emang harus narik perhatian duluan. Kalau dipakai buat semua tombol/link, dia kehilangan makna "urgent"-nya. Semua elemen gak bisa sama-sama teriak.
- `trust-green` itu bahasa kepastian — COD availability, status sukses, verified seller. Jangan dipakai buat urgensi (itu jatahnya merah), biar user belajar: merah = ada deal, hijau = ini aman/pasti.
- `gold` sengaja dibikin langka. Kalau ada di lebih dari satu-dua tempat per halaman, dia berhenti kerasa premium.
- Jangan pakai warna Tailwind default (`red-500`, `orange-500`, dst) di luar token ini, walau keliatan mirip — itu yang bikin kerasa generic/AI-made.

---

## 3. Tipografi

Tiga peran, bukan satu font buat semua:

- **Display** (`Big Shoulders Display`, bold/condensed) — buat harga, headline besar, angka yang mau nonjol. Ini yang bawa "energi spanduk" — dipakai secukupnya, di tempat yang emang butuh berat visual, bukan default semua judul.
- **Body** (`Plus Jakarta Sans`) — teks umum, deskripsi, label, tombol. Ini yang paling sering dipakai, harus nyaman dibaca lama.
- **Meta/mono** (`IBM Plex Mono`) — data teknis: jarak ("1,2 km"), waktu, timestamp, id transaksi. Kontras dikit dari body bikin data kerasa "presisi", beda dari konten naratif.

**Prinsip skala:** bukan tabel pixel tetap, tapi ratio — tiap naik satu tingkat hierarki (body → subheading → heading → display-besar), lompatannya harus jelas kerasa, jangan cuma beda 2px yang gak keliatan bedanya.

---

## 4. Layout

**Yang udah diputusin dan berlaku di semua halaman:**

- Header sticky (logo, search, lokasi+radius) — selalu keliatan, gak ikut kompetisi ruang sama konten.
- Gak ada hero banner kosong tanpa data. Kalau section bisa nampilin barang asli, tampilin barang asli duluan. Kalau kosong, itu jadi empty state yang actionable, bukan promotional banner generik.
- Desktop nav: top category nav horizontal + header icon buttons (Chat/Favorit/Transaksi). **Bukan** sidebar kiri generik — itu keputusan final, jangan direvert walau ada referensi lama yang nunjukin sidebar.
- Grid listing: sesuaikan kolom ke lebar viewport (desktop 4 kolom, tablet 2-3, mobile 2) — prioritasin listing card tetap gampang di-scan, bukan maksa kolom banyak sampe card kegencet.
- Radius sudut & spacing: pilih satu sistem (misal radius 12-16px buat card, 20-24px buat pill/badge) dan **konsisten dipakai ulang**, jangan tiap komponen baru punya radius sendiri.

---

## 5. Signature Element — Coretan Harga

Elemen paling khas CODPO: **harga lama di listing BU dicoret kaya coretan spidol tangan** (bukan `text-decoration: line-through` polos) — garis ganda, agak miring, sedikit gak presisi, mirip orang beneran nyoret harga di kertas.

Ini elemen yang boleh "berani" secara visual. Tapi justru karena itu, **jangan disebar ke elemen lain**. Jangan bikin semua garis/underline di web ini pake gaya coretan tangan — itu bakal ngilangin efek "wah" nya dan malah jadi berisik. Satu elemen berani, sisanya tenang dan rapi.

---

## 6. Suara Komponen (copy/microcopy)

- Tombol pakai kata kerja aktif, sesuai aksi nyata: "Ajukan COD" bukan "Submit", "Pasang Listing" bukan "Create".
- Empty state kasih arah, bukan cuma bilang kosong: "Belum ada listing BU di radius ini — coba perlebar radius, atau jadi yang pertama pasang" bukan "Tidak ada data".
- Error state jelasin apa yang salah + cara benerin, gak minta maaf berlebihan.
- Badge/label pakai istilah yang biasa dipake user (BU, COD sekarang) — bukan istilah sistem/teknis.

---

## 7. Yang Dihindari

- Warna Tailwind default tanpa lewat token di atas.
- Cream background + aksen terracotta (`#D97757`-ish) — kombinasi ini udah jadi ciri khas "AI yang bikin desain", hindari walau sekilas mirip warm palette CODPO.
- Sidebar kiri generik buat navigasi desktop (sudah final diganti, lihat §4).
- Nge-stack banyak badge/warna dalam satu card sampe berisik — pilih maksimal 2 badge paling penting per listing card (biasanya BU + salah satu dari COD/rating).
- Efek coretan tangan dipakai di luar signature price strike.
- Bikin hero/banner promosi kosong di atas fold sebelum ada konten nyata.

---

## 8. Kalau Ketemu Situasi yang Gak Ke-cover di Sini

Prioritas keputusan: (1) konsisten sama token warna/font yang udah ada, (2) konsisten sama prinsip layout §4, (3) kalau masih ambigu, pilih opsi yang lebih tenang/sederhana daripada yang lebih ramai — baru laporkan balik sebagai catatan biar bisa direview, bukan diam-diam mutusin sendiri buat hal yang visually signifikan (warna baru, font baru, pattern navigasi baru).

---
