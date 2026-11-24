# Data Reservasi

**Route:** `/admin/penginapan/reservasi` (edit: `/admin/penginapan/reservasi/[code]/edit`)
**Status:** ✅ Selesai
**File utama:** `frontend/components/admin/penginapan/ReservationsPage.tsx`, `ReservationDetailModal.tsx`, `EditReservationPage.tsx`, `backend/src/penginapan/reservations/`

## Ringkasan
Tabel pusat semua reservasi — tempat admin mencari, memfilter, mengubah status, dan mengedit isi reservasi. Juga titik export laporan (PDF & Excel). Perubahan status (termasuk check-in) dilakukan langsung dari baris reservasi di sini; tidak ada menu Check-in terpisah. Role `ADMIN_PENGINAPAN` bisa membaca dan menulis; role `OWNER` hanya membaca reservasi lewat API untuk dashboard laporannya.

## Cara Kerja
Halaman fetch `GET /admin/reservations` (dengan loading/error + retry), lalu memetakan data ke bentuk tampilan lewat adapter `toDisplay()`. Ada dua "mode" penyaringan yang berbeda perilaku: **mode filter** (default) — data disaring berdasarkan Periode + Status + Saluran; dan **mode pencarian** — begitu kotak cari (kode/nama/no. WA) terisi, filter periode/status/saluran diabaikan total dan pencarian menyapu SELURUH reservasi. Ini disengaja supaya admin bisa menemukan reservasi spesifik walaupun sedang memfilter periode/status yang berbeda. Ada juga filter tambahan "Cari Tanggal Check-in" yang independen dan tetap berlaku di atas mode mana pun.

Klik satu baris membuka `ReservationDetailModal` — dikelompokkan per section (Data Tamu / Detail Menginap / Pembayaran), dengan tombol aksi ubah status yang muncul sesuai status saat ini (guard tombol, bukan input kode). Modal juga menampilkan **Riwayat Edit**: timeline setiap perubahan yang pernah dilakukan pada reservasi (siapa, kapan, alasan, dan before/after tiap field). Untuk mengubah isi reservasi, ada tombol Edit yang membuka halaman terpisah `EditReservationPage`.

## Sub-fitur
- **Filter** — Status (Semua/DP/Lunas/Check-in/Selesai/Hangus/Tidak Datang), Saluran (Reservasi/Langsung), Periode (`RangeFilter`: Hari Ini/Minggu Ini/Bulan Ini/Custom, wajib terisi, default Bulan Ini), plus "Cari Tanggal Check-in" opsional.
- **Search mandiri** — mengabaikan filter lain, menyapu semua reservasi (lihat Cara Kerja).
- **Pagination** — 20 baris per halaman.
- **Modal Detail** (`ReservationDetailModal`, dipakai bersama Ringkasan Admin) — section + tombol ubah status + Riwayat Edit.
- **Ubah status** — Tandai Lunas / Tandai Check-in (transisi maju), memanggil `PATCH /admin/reservations/:code/status`. Backend memvalidasi transisi (maju satu langkah saja; HANGUS hanya dari DP/LUNAS sebelum check-in; COMPLETED hanya dari CHECKED_IN; NO_SHOW hanya dari LUNAS) dan menolak `409` untuk transisi tak valid. Saat ke LUNAS, sisa pembayaran dicatat sebagai baris `Payment` baru (`recordedBy` = admin yang menekan tombol) sehingga total pembayaran = harga reservasi.
- **Edit Reservasi** — halaman `/admin/penginapan/reservasi/[code]/edit`: ubah nama/WA/tanggal/isi tenda/catatan/harga (override + diskon). Wajib mengisi **alasan edit** (min. 3 karakter). Bila tanggal/tenda berubah, backend cek ulang ketersediaan (tidak menghitung reservasi itu sendiri, dengan kunci advisory yang sama seperti saat membuat) dan hitung ulang harga otomatis. Check-in baru yang sebelum hari ini (WIB) ditolak, tetapi validasi ini hanya berlaku bila tanggal check-in benar-benar diubah, sehingga reservasi lama tetap bisa diedit catatannya. Setiap edit dicatat ke tabel audit `reservation_edit_logs` (model `ReservationEditLog`).
- **Export PDF** (landscape, ikut filter aktif) & **Export Excel** (`.xlsx`, 2 sheet) — lihat `fitur-export-pdf.md`, `fitur-export-excel.md`.

## Keputusan Desain Penting
**Tombol "Tandai Hangus" manual sengaja tidak ada di UI.** Status HANGUS di tampilan murni turunan otomatis — dihitung dari tanggal checkout yang lewat tanpa pelunasan/check-in, bukan aksi yang diklik admin. Menyediakan tombolnya hanya akan membuka celah inkonsistensi antara status manual dan status turunan.

Perubahan status memakai **guard tombol**, bukan pencarian kode: tombol "Tandai Check-in" hanya muncul saat status masih LUNAS, dan hilang begitu jadi CHECKED_IN. Karena tidak ada tamu yang mengakses sistem sendiri, tidak ada yang perlu "diverifikasi" lewat kode — admin cukup mengklik baris reservasi yang sudah terlihat.

**Perhatikan (gotcha untuk pembaca kode):** validasi aturan S&K "reschedule maksimal H-7 sebelum check-in" tidak ditegakkan oleh endpoint edit; aturan itu dijaga secara prosedural oleh admin.

## Terhubung ke
- `GET /admin/reservations` (OWNER + ADMIN_PENGINAPAN), `GET /admin/reservations/:code`
- `PATCH /admin/reservations/:code/status`, `PATCH /admin/reservations/:code` (hanya ADMIN_PENGINAPAN)
- Backend: `ReservationsService.editReservation()` & `assertValidTransition()`, tabel `reservation_edit_logs`
- `lib/pdf/report.ts`, `lib/excel/reservationReport.ts`
- `ReservationDetailModal.tsx` (dipakai bersama Ringkasan Admin)
