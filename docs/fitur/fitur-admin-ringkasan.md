# Ringkasan Admin Penginapan

**Route:** `/admin/penginapan`
**Status:** ✅ Selesai
**File utama:** `frontend/components/admin/penginapan/OverviewPage.tsx`

## Ringkasan
Dashboard operasional harian untuk admin penginapan — menjawab "apa yang perlu disiapkan hari ini": siapa yang datang, siapa yang menginap, siapa yang check-out, berapa uang masuk, dan kondisi ketersediaan tenda.

## Cara Kerja
Saat dibuka, halaman fetch `GET /admin/reservations` dan `GET /admin/room-types` sekaligus (`Promise.all`), dengan state loading/error + tombol retry. Semua bagian halaman berputar di sekitar satu state **tanggal aktif** — ini penting: klik tanggal di kalender maupun pilih tanggal lewat input date sama-sama mengubah tanggal aktif ini, dan seluruh halaman (stat card, tab operasional, tabel transaksi, panel ketersediaan) ikut bergerak mengikutinya. Ini disengaja supaya kalender terasa "hidup" — bukan sekadar mengganti satu kotak kecil di bawahnya.

Data reservasi dari API dipetakan lewat adapter `toAdminReservation()` ke bentuk `AdminReservation`, supaya fungsi-fungsi util lama (`occupiedQtyOnDate`, `effectiveStatus`, dll di `lib/data/admin.ts`) bisa dipakai apa adanya. Status reservasi yang ditampilkan dihitung ulang di client lewat `effectiveStatus()` — yang otomatis mengubah CHECKED_IN jadi COMPLETED begitu tanggal checkout lewat, dan DP/LUNAS jadi HANGUS/NO_SHOW sesuai kondisi — jadi badge selalu mencerminkan realita tanggal tanpa admin perlu klik apa pun.

## Sub-fitur
- **4 stat card** — Reservasi Hari Ini (jumlah check-in), Transaksi Hari Ini (reservasi yang dibuat hari itu), Pendapatan Hari Ini, dan Pendapatan Bulan Ini. Dua angka pendapatan dihitung dari tanggal transaksi sungguhan (`Payment.paidAt`), bukan dari nilai kontrak reservasi (`priceSnapshot`) — jadi mencerminkan uang yang benar-benar masuk pada periode itu, seperti buku kas.
- **Tab Operasional** (Kedatangan / Menginap / Keberangkatan) — satu kartu bertab, jumlah tiap kategori terbaca langsung di tab. Kedatangan diurutkan LUNAS→DP→CHECKED_IN (yang belum check-in dan masih perlu disiapkan unitnya muncul duluan); Menginap diurutkan checkout terdekat; Keberangkatan diurutkan CHECKED_IN dulu.
- **Transaksi (tanggal aktif)** — semua reservasi yang `createdAt`-nya jatuh di tanggal aktif, diurutkan terbaru, dengan kolom jam.
- **Kalender Okupansi** — navigasi per bulan, warna per hari (tersedia/sebagian/penuh), outline khusus hari ini, dan saat satu tanggal dipilih menampilkan breakdown sisa unit per tipe tenda.
- **Modal Detail Reservasi** — klik baris mana pun (di tab operasional maupun tabel transaksi) membuka `ReservationDetailModal` yang sama dengan menu Data Reservasi; tombol ubah status di dalamnya memanggil API sungguhan lalu me-refresh halaman.

## Keputusan Desain Penting
Total kapasitas hanya dihitung dari tipe tenda yang `isActive` — tipe yang dinonaktifkan tidak dianggap kapasitas operasional. Status reservasi sengaja dihitung ulang di client (bukan memakai field `effectiveStatus` dari API) karena fungsi okupansi lokal seperti `occupiedQtyOnDate` memanggil `effectiveStatus()` secara internal — algoritmanya identik dengan versi backend, jadi konsisten, bukan sumber drift baru.

## Terhubung ke
- `GET /admin/reservations`, `GET /admin/room-types`
- `PATCH /admin/reservations/:code/status`
- `lib/data/admin.ts` (`occupiedQtyOnDate`, `effectiveStatus`)
- `ReservationDetailModal.tsx` (dipakai bersama Data Reservasi)
