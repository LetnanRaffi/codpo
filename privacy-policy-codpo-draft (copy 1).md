# Kebijakan Privasi CODPO

**⚠️ CATATAN: Ini draft awal, bukan dokumen hukum final. Wajib direview dan disesuaikan oleh konsultan hukum/pengacara sebelum dipasang live — khususnya untuk memastikan kepatuhan penuh terhadap UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).**

_Terakhir diperbarui: [ISI TANGGAL]_

---

## 1. Pengendali Data

CODPO ("kami") bertindak sebagai pengendali data pribadi pengguna Platform ini sesuai UU PDP. Untuk pertanyaan terkait data pribadi Anda, hubungi [ISI KONTAK/EMAIL DPO ATAU PENANGGUNG JAWAB].

## 2. Data yang Kami Kumpulkan

| Kategori        | Contoh Data                                                 | Sumber                                 |
| --------------- | ----------------------------------------------------------- | -------------------------------------- |
| Data akun       | Nama, nomor telepon/email, kata sandi (terenkripsi)         | Diberikan langsung saat registrasi     |
| Data profil     | Foto profil, rating, riwayat transaksi                      | Aktivitas di Platform                  |
| Data lokasi     | Koordinat GPS (untuk pencarian listing terdekat & sesi COD) | Izin eksplisit dari perangkat pengguna |
| Data listing    | Foto barang, deskripsi, harga                               | Diberikan langsung oleh Seller         |
| Data komunikasi | Isi chat antara Buyer-Seller                                | Aktivitas di Platform                  |
| Data teknis     | Alamat IP, jenis perangkat, log aktivitas                   | Otomatis saat menggunakan Platform     |

## 3. Tujuan Penggunaan Data

Kami menggunakan data pribadi untuk:

- Menyediakan dan mengoperasikan fitur Platform (pencarian lokasi, chat, COD, transaksi).
- Menghitung jarak dan menampilkan listing/pengguna terdekat.
- Memfasilitasi dan melacak sesi COD secara real-time **hanya selama sesi berlangsung**.
- Keamanan Platform (deteksi penipuan, moderasi, penanganan laporan).
- Komunikasi terkait akun/transaksi (notifikasi).

Kami **tidak** menjual data pribadi pengguna kepada pihak ketiga untuk kepentingan pemasaran.

## 4. Data Lokasi — Perlakuan Khusus

Karena sifatnya yang sensitif, data lokasi diperlakukan dengan aturan tambahan:

- Lokasi presisi/alamat pengguna **tidak pernah ditampilkan secara publik** kepada pengguna lain. Listing publik hanya menampilkan perkiraan area/jarak.
- Titik pertemuan (meeting point) presisi hanya dibagikan kepada kedua pihak setelah sesi COD disepakati.
- Pelacakan lokasi real-time (live tracking) hanya aktif **selama sesi COD berlangsung** (dari status diterima hingga selesai), dan berhenti otomatis setelah sesi selesai.
- Pengguna harus memberikan izin eksplisit (opt-in) sebelum lokasi dapat diakses oleh Platform.
- Riwayat pergerakan (movement history) tidak disimpan lebih lama dari yang diperlukan untuk keperluan operasional/penyelesaian sengketa.

## 5. Penyimpanan dan Keamanan Data

- Data pengguna disimpan pada infrastruktur [ISI: Supabase/PostgreSQL — sebutkan lokasi server/region data center].
- Media (foto listing, foto chat, foto profil) disimpan di Cloudflare R2.
- Kami menerapkan enkripsi kata sandi, kontrol akses (row-level security), dan praktik keamanan wajar lainnya.
- **[CATATAN REVIEW — PENTING, BUKAN URUSAN NANTI: Pasal 56 UU PDP soal transfer data lintas negara sudah berlaku SEKARANG (bukan menunggu aturan turunan yang masih draft). Kalau Supabase/Cloudflare R2 menyimpan data di region di luar Indonesia (perlu dicek konfigurasi region-nya), CODPO sudah harus memenuhi salah satu dari tiga syarat: (a) negara tujuan punya tingkat pelindungan data setara/lebih tinggi, (b) ada perjanjian/mekanisme pengamanan yang memadai (contoh: standard contractual clauses), atau (c) mendapat persetujuan eksplisit dari pengguna untuk transfer tersebut. Opsi (c) yang paling praktis untuk tahap awal — pastikan consent ini eksplisit, bukan cuma tersirat dari "menyetujui privacy policy" secara umum. Ini prioritas tinggi untuk dikonsultasikan.]**

## 6. Hak Pengguna (sesuai UU PDP)

Sebagai pemilik data pribadi, pengguna berhak untuk:

- Mengakses dan mendapatkan salinan data pribadinya.
- Memperbarui atau memperbaiki data pribadi yang tidak akurat.
- Menghapus data pribadinya, termasuk menghapus akun (dengan pengecualian data yang wajib disimpan untuk kepentingan hukum/penyelesaian sengketa yang sedang berjalan).
- Menarik persetujuan (misalnya izin akses lokasi) kapan saja, dengan konsekuensi fitur terkait mungkin tidak dapat digunakan.
- Mengajukan keberatan atas pemrosesan data tertentu.
- Mengajukan pengaduan kepada otoritas Pelindungan Data Pribadi yang berwenang.

Permintaan terkait hak-hak di atas dapat diajukan melalui [ISI KONTAK/EMAIL].

## 7. Berbagi Data dengan Pihak Ketiga

Kami dapat membagikan data terbatas dengan:

- Penyedia layanan infrastruktur (hosting, storage, database) yang kami gunakan untuk mengoperasikan Platform.
- Pihak berwenang, jika diwajibkan oleh hukum atau untuk investigasi tindak kriminal terkait Platform.

Kami tidak membagikan data lokasi presisi atau data pribadi lain kepada pihak ketiga untuk kepentingan komersial di luar operasional Platform.

## 8. Retensi Data

Data pribadi disimpan selama akun aktif. Setelah akun dihapus, data akan dihapus atau dianonimkan dalam jangka waktu [ISI: misal 30 hari], kecuali data yang wajib disimpan untuk kepentingan hukum.

## 9. Anak di Bawah Umur

Platform ini tidak ditujukan untuk pengguna di bawah 18 tahun. Kami tidak dengan sengaja mengumpulkan data pribadi anak di bawah umur.

## 10. Perubahan Kebijakan

Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui Platform.

## 11. Kontak

Pertanyaan atau permintaan terkait data pribadi dapat disampaikan ke [ISI KONTAK/EMAIL].

---

**[CATATAN UNTUK REVIEW HUKUM — diperbarui:]**

1. **DPO (Pasal 53 UU PDP):** CODPO kemungkinan besar **wajib** menunjuk petugas/pejabat fungsi pelindungan data, bukan sekadar "kalau threshold terpenuhi" — salah satu kriteria wajibnya adalah "aktivitas utama pengendali data mencakup pemantauan sistematis dan teratur terhadap data pribadi dalam skala besar". Fitur **live GPS tracking selama sesi COD** kemungkinan besar masuk kategori ini. Ini keputusan konkret yang perlu diambil sebelum go-live, bukan catatan mengambang.

2. **Transfer data lintas negara (Pasal 56):** sudah berlaku sekarang, lihat catatan di §5 di atas — bukan menunggu aturan turunan.

3. **Notifikasi kebocoran data (Pasal 46):** kewajiban notifikasi ke pengguna terdampak dalam 3x24 jam **tetap berlaku** meski Lembaga PDP (badan pengawas) belum resmi terbentuk (per 2026 masih tahap harmonisasi regulasi) — bukan berarti kewajiban ini gugur, cuma penegakannya lewat jalur lain (UU ITE, gugatan perdata) selama badan pengawas belum aktif. Siapkan incident response plan dari sekarang.

4. **Pendaftaran PSE (Penyelenggara Sistem Elektronik):** di luar dokumen Privacy Policy ini, CODPO sebagai platform digital kemungkinan wajib terdaftar sebagai PSE Lingkup Privat ke Kementerian Komunikasi dan Digital — tanpa pendaftaran ini, ada risiko pemblokiran akses. Ini item operasional terpisah, bukan cuma soal teks dokumen.

5. Dasar pemrosesan data (consent/kontrak/kepentingan sah) untuk tiap kategori data di tabel §2 perlu dipetakan eksplisit satu-satu — draft ini belum melakukannya secara rinci per baris tabel.
