# Export PDF Laporan

**Status:** ✅ Selesai (Versi 1) — cross-cutting, dipakai Admin & Owner
**File utama:** `frontend/lib/pdf/report.ts` (`exportReportPdf`)

## Ringkasan
Mesin export PDF generik yang dipakai bersama oleh Data Booking (Admin) dan kedua halaman Dashboard Owner. Satu fungsi, tema warna bisa beda per dashboard.

## Cara Kerja
`exportReportPdf` menerima satu objek berisi tema, daftar stat, daftar breakdown, tabel detail, label teks, dan opsi orientasi. Ia menggambar PDF secara terprogram lewat `jsPDF` + `jspdf-autotable` — bukan menangkap screenshot halaman — sehingga hasilnya teks tajam yang bisa di-zoom, bukan gambar raster buram. Modul ini sendiri tidak tahu apa-apa soal i18n: semua label sudah diterjemahkan oleh pemanggil dan dioper sebagai string jadi. Tabel detail digambar dengan `autoTable` yang mengurus pemenggalan halaman sendiri kalau datanya panjang.

## Sub-fitur
- **Dua tema** (`ReportTheme`): `ADMIN_REPORT_THEME` (hijau gelap + terracotta, cocok sidebar Admin) dan `OWNER_REPORT_THEME` (coklat gelap + emas, cocok layout Owner).
- **Struktur laporan** — header band (judul/perusahaan/periode/tanggal generate) → grid stat card 2 kolom → satu/lebih section breakdown (legenda donut versi teks) → tabel detail di halaman baru → footer nomor halaman di tiap halaman.
- **Orientasi** — `portrait` (default, dipakai Owner) atau `landscape` (dipakai Data Booking Admin yang tabelnya lebar).

## Keputusan Desain Penting
Isi laporan **mengikuti filter yang sedang aktif** di halaman pemanggil, bukan hanya baris yang kebetulan tampil di layar. Jadi kalau Data Booking sedang memfilter Bulan Ini + status Lunas, PDF-nya berisi semua booking yang cocok filter itu (auto-pagination sendiri), bukan cuma 20 baris di halaman aktif.

Modul dibuat sengaja tanpa dependensi i18n supaya benar-benar generik dan reusable lintas dashboard — pemanggil yang tahu bahasa aktif, jadi pemanggil yang menerjemahkan.

## Terhubung ke
- `BookingsPage.tsx` (Admin, landscape)
- `OwnerOverviewPage.tsx`, `OwnerPenginapanPage.tsx` (Owner, portrait)
- `lib/excel/bookingReport.ts` — berbagi logic ringkasan angka via `buildExportSummary()`
