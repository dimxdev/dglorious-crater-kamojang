# Mesin Hitung Harga (Pricing Engine)

**Status:** ✅ Selesai (Versi 1) — cross-cutting
**File utama:** `frontend/lib/pricing.ts`, `backend/src/penginapan/room-types/pricing.util.ts`

## Ringkasan
Kumpulan logika penghitungan harga menginap — tarif weekday/weekend dan tarif tambah orang/extra bed. Ada dua salinan (frontend & backend) yang wajib mirror satu sama lain, supaya preview harga di form persis sama dengan yang backend bekukan ke booking.

## Cara Kerja
Untuk menghitung harga satu grup tenda: `calcStayPrice` menjumlahkan tarif per malam sepanjang rentang menginap, memilih `priceWeekend` atau `priceWeekday` untuk tiap malam berdasarkan `isWeekendDate` (Sabtu/Minggu). Kalau ada extra bed, `extraBedRate` menentukan tarif tambahnya, lalu dikali jumlah extra bed dan jumlah malam. Total booking (`calcGroupsTotal`) adalah penjumlahan subtotal semua grup. Frontend memakai ini untuk menampilkan preview live saat admin mengisi form; backend memakai versi mirror-nya untuk menghitung ulang dan membekukan angka final ke `subtotalSnapshot`/`priceSnapshot` — sehingga sumber kebenaran harganya tetap di server, tapi user melihat angka yang sama sebelum submit.

## Sub-fitur
- **`calcNights(checkIn, checkOut)`** — jumlah malam.
- **`calcNightsBreakdown`** — memecah jadi malam weekday vs weekend (untuk info "X malam weekday, Y malam weekend" di form).
- **`isWeekendDate(date)`** — Sabtu/Minggu.
- **`calcStayPrice(room, checkIn, checkOut)`** — total tarif menginap per malam.
- **`extraBedRate(room, type)`** — tarif tambah orang: `extraFlatPrice` menang duluan kalau ada (dipakai unit non-berkasur), lalu `extraBedPrice` (dengan bed) atau `extraNoBedPrice` (tanpa bed).
- **`calcGroupSubtotal`/`calcGroupsTotal`** — subtotal per grup tenda (1 grup = 1 unit fisik) dan total gabungan.

## Keputusan Desain Penting
Definisi weekend (Sabtu–Minggu) dan asumsi bahwa tarif extra bed dihitung **per malam** (bukan sekali bayar untuk seluruh masa inap) masih merupakan **asumsi sementara yang belum dikonfirmasi klien** (PROJECT.md §11). Kalau nanti klien mengonfirmasi berbeda, kedua file (`pricing.ts` frontend & `pricing.util.ts` backend) harus diubah bersamaan agar tidak drift.

Perhitungan berbasis "satu grup = satu unit fisik", bukan qty per baris — karena kebutuhan tiap unit (dewasa/anak/extra bed) bisa berbeda dalam satu booking multi-tenda, jadi tidak bisa digabung jadi satu angka qty tunggal.

## Terhubung ke
- `RoomGroupEditor.tsx` — preview harga real-time di form booking
- `BookingsService.create()` & `editBooking()` — hitung ulang + bekukan ke snapshot
- `checkAvailability()` (`fitur-cek-ketersediaan.md`) — dipanggil bersamaan saat validasi form
