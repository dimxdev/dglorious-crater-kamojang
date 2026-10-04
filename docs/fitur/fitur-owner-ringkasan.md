# Dashboard Owner — Ringkasan

**Route:** `/owner`
**Status:** ✅ Selesai
**File utama:** `frontend/components/owner/OwnerOverviewPage.tsx`

## Ringkasan
Dashboard statistik & rekap tingkat bisnis untuk pemilik — eksklusif role `OWNER`. Menyajikan pendapatan, tren, okupansi, dan booking terbaru untuk periode yang dipilih.

## Cara Kerja
Halaman fetch `GET /admin/bookings` + `GET /admin/room-types` (dengan loading/error + retry), memetakan booking lewat adapter bersama `toAdminBooking()`, lalu mengoper hasilnya ke fungsi-fungsi analitik di `lib/data/owner.ts`. Semua fungsi analitik itu (`calcOwnerStats`, `calcRevenueTrend`, dll) menerima data booking + tipe tenda sebagai argumen dan menghitung metrik untuk periode yang dipilih via `RangeFilter`. Tiap metrik utama juga dihitung untuk periode sebelumnya yang sepadan (kemarin/minggu lalu/bulan lalu tergantung filter) untuk memunculkan delta persentase naik/turun.

## Sub-fitur
- **Filter Periode** (`RangeFilter`: Hari Ini/Minggu Ini/Bulan Ini/Custom).
- **4 metrik utama** — Total Pendapatan (kartu hero besar), Total Booking, Total Pengunjung, Rata-rata Tenda Terisi. Semua dengan delta % vs periode sebelumnya yang sepadan + sparkline mini.
- **Grafik Tren Pendapatan** — 6 bulan terakhir, skala Y dinamis mengikuti data.
- **Tabel Booking Terbaru** — klik baris membuka `BookingDetailModal` yang sama dengan Admin.
- **Export Laporan (PDF)** — mengikuti filter periode aktif.

## Keputusan Desain Penting
Fungsi analitik di `lib/data/owner.ts` **mewajibkan** data booking/rooms dioper sebagai parameter — tidak ada default yang diam-diam mengambil data contoh. Ini disengaja: kalau suatu pemanggil lupa mengoper data asli, TypeScript menolak compile, bukan diam-diam menampilkan angka dummy. Dengan begitu tidak ada risiko dashboard menampilkan angka yang tidak mencerminkan booking sungguhan.

Proteksi RBAC: halaman ini **eksklusif `OWNER`** — Super Admin sekalipun tidak bisa masuk (lihat `fitur-login-rbac.md`).

## Terhubung ke
- `GET /admin/bookings`, `GET /admin/room-types`
- `lib/data/owner.ts` (`calcOwnerStats`, `calcStatSparklines`, `calcRevenueTrend`, `calcRecentTransactions`)
- `lib/api/bookings.ts` (`toAdminBooking`)
- `lib/pdf/report.ts` (`OWNER_REPORT_THEME`)
