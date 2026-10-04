# Dashboard Owner — Penginapan

**Route:** `/owner/penginapan`
**Status:** ✅ Selesai
**File utama:** `frontend/components/owner/OwnerPenginapanPage.tsx`

## Ringkasan
Deep-dive performa bisnis penginapan per tipe tenda, dari sudut pandang pemilik. Fokusnya angka bisnis (booking, pendapatan, kontribusi), bukan operasional harian — pengelolaan konten & booking tetap di menu Admin, halaman ini cukup menautkan ke sana.

## Cara Kerja
Sama seperti Ringkasan Owner, halaman fetch `GET /admin/bookings` + `GET /admin/room-types`, memetakan lewat `toAdminBooking()`, lalu mengoper ke fungsi analitik `lib/data/owner.ts` yang khusus penginapan (`calcRoomTypePerformance`, `calcBookingByType`, `calcBySource`, `calcPenginapanStats`). Semua metrik dihitung untuk periode yang dipilih via `RangeFilter`.

## Sub-fitur
- **Filter Periode** (`RangeFilter`).
- **4 stat card** — Total Pendapatan, Total Booking, Rata-rata per Booking, dan Tipe Terlaris (nama + kontribusi %).
- **Donut Booking per Tipe** — sebaran booking antar tipe tenda.
- **Donut WhatsApp vs Walk-in** — proporsi sumber booking.
- **Tabel Performa per Tipe Tenda** (`RoomTypeLeaderboard`) — booking, pendapatan, dan kontribusi % per tipe, diurutkan.
- **Link "Lihat Detail Booking →"** — ke Data Booking (`/admin/penginapan/booking`).
- **Export Laporan (PDF)**.

## Keputusan Desain Penting
Untuk booking yang mencakup lebih dari satu tipe tenda, pendapatannya **diaproksimasi proporsional per qty** — karena `priceSnapshot` hanya menyimpan satu angka gabungan per booking, belum ada subtotal per tipe yang terpisah di database. Jadi angka pendapatan per tipe di sini adalah estimasi, bukan pemisahan harga presisi; catatan ini juga ditampilkan di UI supaya pembacanya tahu.

Kolom okupansi per tipe sengaja **tidak** ditampilkan di tabel performa. Rata-rata harian sepanjang periode membuat tipe yang jarang dipesan terlihat 0%/rendah, padahal itu wajar untuk bisnis yang masih berkembang — kurang actionable bagi pemilik. Okupansi harian tetap tersedia di Ringkasan Admin yang memang untuk operasional.

## Terhubung ke
- `GET /admin/bookings`, `GET /admin/room-types`
- `lib/data/owner.ts` (`calcRoomTypePerformance`, `calcBookingByType`, `calcBySource`, `calcPenginapanStats`)
- `lib/pdf/report.ts` (`OWNER_REPORT_THEME`)
