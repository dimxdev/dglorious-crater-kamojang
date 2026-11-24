# Dashboard Owner — Penginapan

**Route:** `/owner/penginapan`
**Status:** ✅ Selesai
**File utama:** `frontend/components/owner/OwnerPenginapanPage.tsx`

## Ringkasan
Deep-dive performa bisnis penginapan per tipe tenda, dari sudut pandang pemilik. Fokusnya angka bisnis (reservasi, pendapatan, kontribusi), bukan operasional harian — pengelolaan konten tenda dilakukan Super Admin dan pencatatan reservasi dilakukan Admin Penginapan; Owner hanya membaca.

## Cara Kerja
Sama seperti Ringkasan Owner, halaman fetch `GET /admin/reservations` + `GET /admin/room-types`, memetakan lewat `toAdminReservation()`, lalu mengoper ke fungsi analitik `lib/data/owner.ts` yang khusus penginapan (`calcRoomTypePerformance`, `calcReservationByType`, `calcBySource`, `calcPenginapanStats`). Semua metrik dihitung untuk periode yang dipilih via `RangeFilter`.

## Sub-fitur
- **Filter Periode** (`RangeFilter`).
- **4 stat card** — Total Pendapatan, Total Reservasi, Rata-rata per Reservasi, dan Tipe Terlaris (nama + kontribusi %).
- **Donut Reservasi per Tipe** — sebaran reservasi antar tipe tenda.
- **Donut Reservasi vs Langsung** — proporsi saluran reservasi (`RESERVASI`/`LANGSUNG`).
- **Tabel Performa per Tipe Tenda** (`RoomTypeLeaderboard`) — reservasi, pendapatan, dan kontribusi % per tipe, diurutkan.
- **Export Laporan (PDF)**.

## Keputusan Desain Penting
Untuk reservasi yang mencakup lebih dari satu tipe tenda, pendapatannya **diaproksimasi proporsional per qty** — karena `priceSnapshot` hanya menyimpan satu angka gabungan per reservasi, belum ada subtotal per tipe yang terpisah di database. Jadi angka pendapatan per tipe di sini adalah estimasi, bukan pemisahan harga presisi; catatan ini juga ditampilkan di UI supaya pembacanya tahu.

Kolom okupansi per tipe sengaja **tidak** ditampilkan di tabel performa. Rata-rata harian sepanjang periode membuat tipe yang jarang dipesan terlihat 0%/rendah, padahal itu wajar untuk bisnis yang masih berkembang — kurang actionable bagi pemilik. Okupansi harian tetap tersedia di Ringkasan Admin yang memang untuk operasional.

## Terhubung ke
- `GET /admin/reservations`, `GET /admin/room-types`
- `lib/data/owner.ts` (`calcRoomTypePerformance`, `calcReservationByType`, `calcBySource`, `calcPenginapanStats`)
- `lib/pdf/report.ts` (`OWNER_REPORT_THEME`)
