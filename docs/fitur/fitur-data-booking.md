# Data Booking

**Route:** `/admin/penginapan/booking`
**Status:** ✅ Selesai (Versi 1)
**File utama:** `frontend/components/admin/penginapan/BookingsPage.tsx`, `BookingDetailModal.tsx`, `EditBookingPage.tsx`

## Ringkasan
Tabel pusat semua booking — tempat admin mencari, memfilter, mengubah status, dan mengedit isi booking. Juga titik export laporan (PDF & Excel). Menggantikan menu Check-in terpisah: perubahan status kini dilakukan langsung dari baris booking di sini.

## Cara Kerja
Halaman fetch `GET /admin/bookings` (dengan loading/error + retry), lalu memetakan data ke bentuk tampilan lewat adapter `toDisplay()`. Ada dua "mode" penyaringan yang berbeda perilaku: **mode filter** (default) — data disaring berdasarkan Periode + Status + Sumber; dan **mode pencarian** — begitu kotak cari (kode/nama/no. WA) terisi, filter periode/status/sumber diabaikan total dan pencarian menyapu SELURUH booking. Ini disengaja supaya admin bisa menemukan booking spesifik walaupun sedang memfilter periode/status yang berbeda. Ada juga filter tambahan "Cari Tanggal Check-in" yang independen dan tetap berlaku di atas mode mana pun.

Klik satu baris membuka `BookingDetailModal` — dikelompokkan per section (Data Tamu / Detail Menginap / Pembayaran), dengan tombol aksi ubah status yang muncul sesuai status saat ini (guard tombol, bukan input kode). Modal juga menampilkan **Riwayat Edit**: timeline setiap perubahan yang pernah dilakukan pada booking (siapa, kapan, alasan, dan before/after tiap field). Untuk mengubah isi booking, ada tombol Edit yang membuka halaman terpisah `EditBookingPage`.

## Sub-fitur
- **Filter** — Status (7 nilai: Semua/DP/Lunas/Check-in/Selesai/Hangus/Tidak Datang), Sumber (WhatsApp/Walk-in), Periode (`RangeFilter`: Hari Ini/Minggu Ini/Bulan Ini/Custom, wajib terisi, default Bulan Ini), plus "Cari Tanggal Check-in" opsional.
- **Search mandiri** — mengabaikan filter lain, menyapu semua booking (lihat Cara Kerja).
- **Pagination** — 20 baris per halaman.
- **Modal Detail** (`BookingDetailModal`, dipakai bersama Ringkasan Admin) — section + tombol ubah status + Riwayat Edit.
- **Ubah status** — Tandai Lunas / Tandai Check-in (transisi maju), memanggil `PATCH /admin/bookings/:code/status`. Backend memvalidasi transisi (maju satu langkah saja; HANGUS hanya sebelum check-in) dan menolak `409` untuk transisi tak valid.
- **Edit Booking** — halaman `/admin/penginapan/booking/[code]/edit`: ubah nama/WA/tanggal/isi tenda/catatan/harga (override + diskon). Wajib mengisi **alasan edit** (min. 3 karakter). Bila tanggal/tenda berubah, backend cek ulang ketersediaan (tidak menghitung booking itu sendiri) dan hitung ulang harga otomatis. Setiap edit dicatat ke tabel audit `bookingEditLog`.
- **Export PDF** (landscape, ikut filter aktif) & **Export Excel** (`.xlsx`, 2 sheet) — lihat `fitur-export-pdf.md`, `fitur-export-excel.md`.

## Keputusan Desain Penting
**Tombol "Tandai Hangus" manual sengaja tidak ada.** Status HANGUS murni turunan otomatis — dihitung dari tanggal checkout yang lewat tanpa pelunasan/check-in, bukan aksi yang diklik admin. Menyediakan tombolnya hanya akan membuka celah inkonsistensi antara status manual dan status turunan.

Perubahan status memakai **guard tombol**, bukan pencarian kode: tombol "Tandai Check-in" hanya muncul saat status masih LUNAS, dan hilang begitu jadi CHECKED_IN. Karena di Versi 1 tidak ada tamu yang mengakses sistem sendiri, tidak ada yang perlu "diverifikasi" lewat kode — admin cukup mengklik baris booking yang sudah terlihat.

**Perhatikan (gotcha untuk pembaca kode):** endpoint & halaman Edit Booking penuh (`PATCH /admin/bookings/:code`, `EditBookingPage.tsx`, tabel `bookingEditLog`) sudah terbangun lengkap — jangan tertipu catatan lama di TASK.md yang sempat menyebutnya "ditunda". Yang benar-benar belum ada: validasi aturan S&K "reschedule maksimal H-7 sebelum check-in" — endpoint edit tidak menegakkannya.

## Terhubung ke
- `GET /admin/bookings`, `PATCH /admin/bookings/:code/status`, `PATCH /admin/bookings/:code`
- Backend: `BookingsService.editBooking()` & `assertValidTransition()`, tabel `bookingEditLog`
- `lib/pdf/report.ts`, `lib/excel/bookingReport.ts`
- `BookingDetailModal.tsx` (dipakai bersama Ringkasan Admin)
