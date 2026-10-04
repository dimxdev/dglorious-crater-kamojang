# Export Excel (Data Booking)

**Status:** ✅ Selesai
**File utama:** `frontend/lib/excel/bookingReport.ts` (`exportBookingExcel`)

## Ringkasan
Export laporan booking ke file `.xlsx` bergaya, hanya dipakai di halaman Data Booking Admin. Beda dari PDF, angkanya tetap angka Excel asli sehingga bisa langsung dijumlah/diurutkan/difilter oleh penerima.

## Cara Kerja
`exportBookingExcel` memakai `ExcelJS` untuk membangun workbook dua sheet — "Ringkasan" dan "Detail Booking" — lalu menuliskannya ke buffer, membungkusnya jadi Blob, dan memicu download lewat elemen `<a>` sementara. Sheet Ringkasan berisi header brand, baris statistik, dan breakdown status/sumber (swatch warna + label digabung dalam satu cell pakai `richText`). Sheet Detail berisi header brand lalu tabel penuh mulai baris 6, dengan freeze pane di baris itu supaya header tetap terlihat saat scroll. Isi laporan mengikuti filter yang sedang aktif — logic ringkasan angkanya (`buildExportSummary()`) dibagi dengan Export PDF supaya kedua format selalu konsisten.

## Sub-fitur
- **Library `ExcelJS`** — dipilih karena bisa styling cell penuh (`xlsx`/SheetJS gratis nyaris tidak bisa).
- **Dua sheet** — Ringkasan + Detail Booking, sengaja dipisah.
- **Sheet Detail** — header baris 6 (bold, fill gelap, teks putih), zebra striping, kolom Total diformat `"Rp"#,##0` + bold, kolom status berwarna, **autofilter**, freeze pane, dan baris TOTAL memakai formula `SUM()` asli (bukan angka statis, jadi tetap benar bila baris difilter/diedit).
- **Angka asli, bukan teks** — kolom Total & breakdown pakai `numFmt` (tipe `number`), jadi bisa langsung dihitung native di Excel.

## Keputusan Desain Penting
Laporan sengaja **dipecah jadi dua sheet**, bukan satu. Kalau ringkasan dan tabel digabung dalam satu sheet, freeze pane header tabel jatuh di baris yang jauh ke bawah — hasilnya hampir seluruh tinggi jendela Excel ikut terkunci dan sheet terasa "tidak bisa di-scroll". Dengan memisah, sheet Detail bisa membekukan hanya 6 baris teratas, scroll kembali normal.

Nama sheet disanitasi lewat `safeSheetName` karena Excel melarang karakter `: \ / ? * [ ]` dan membatasi nama maksimal 31 karakter — tanpa ini, generate bisa gagal untuk nama tertentu.

## Terhubung ke
- `BookingsPage.tsx` — tombol "Export Excel" bersebelahan dengan "Export PDF"
- `buildExportSummary()` — logic ringkasan dibagi dengan `fitur-export-pdf.md`
