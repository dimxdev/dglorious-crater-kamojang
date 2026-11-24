# Cek Ketersediaan (Anti Pemesanan Ganda)

**Status:** ✅ Selesai — cross-cutting
**File utama:** `backend/src/penginapan/room-types/room-types.service.ts` (`checkAvailability`)

## Ringkasan
Satu fungsi ketersediaan yang dipakai bersama oleh semua jalur pembuatan/edit reservasi, sekaligus jadi pengaman tunggal terhadap pemesanan ganda (§4 PROJECT.md poin 8).

## Cara Kerja
`checkAvailability(roomTypeId, checkIn, checkOut, excludeReservationId?)` pertama mencari tipe tenda (404 kalau tidak ada / sudah di-soft-delete), lalu mengambil semua `ReservationItem` yang reservasi-nya belum HANGUS dan rentang tanggalnya bertumpang tindih dengan `[checkIn, checkOut)` — memakai uji overlap interval klasik `reservasi.checkIn < checkOut && reservasi.checkOut > checkIn`. Jumlah `qty` dari semua item yang overlap dijumlahkan jadi `bookedQty`, lalu `availableUnits = max(0, totalUnits - bookedQty)`. Hasilnya objek `{roomTypeId, totalUnits, bookedQty, availableUnits, isAvailable}`. Parameter `excludeReservationId` dipakai saat mengedit reservasi yang sudah ada, supaya reservasi itu tidak dihitung sebagai "bentrok dengan dirinya sendiri".

## Sub-fitur
- **Uji overlap tanggal** — reservasi dianggap bentrok kalau rentang menginapnya beririsan, bukan cuma kalau tanggalnya sama persis.
- **Kecualikan diri sendiri** (`excludeReservationId`) — untuk skenario edit/reschedule.
- **Abaikan HANGUS** — reservasi yang batal (uang hangus) tidak menghitung sebagai pemakai unit.

## Keputusan Desain Penting
Ketersediaan dihitung di **level qty per-tipe** (jumlah unit), **bukan** dengan mengunci unit fisik spesifik. Alasannya: reservasi tidak menunjuk unit fisik tertentu — yang relevan hanyalah "apakah masih ada sisa unit dari total tipe ini". Pendekatan qty ini yang membuat fungsi bisa dipakai konsisten di semua jalur.

Fungsi ini dipakai di **tiga tempat** dari satu sumber yang sama: saat create reservasi (`POST /admin/reservations`), saat edit/reschedule (`PATCH /admin/reservations/:code`, dengan exclude diri sendiri), dan lewat endpoint `GET /admin/room-types/:id/availability` yang dipanggil frontend real-time (debounced) saat admin mengisi form. Satu implementasi, tiga pemanggil — tidak ada logic ketersediaan paralel yang berpotensi drift dan membuka celah pemesanan ganda.

Pada pembuatan dan edit reservasi, pengecekan dijalankan **di dalam transaksi database** oleh `ReservationsService.assertUnitsAvailable()`: jumlah unit yang diminta dijumlahkan per tipe tenda (sebuah reservasi bisa memuat beberapa baris tenda bertipe sama), lalu tiap tipe dikunci dengan `pg_advisory_xact_lock` (urut menaik supaya tidak deadlock) sebelum `checkAvailability` dipanggil dengan klien transaksi yang sama. Kunci dilepas otomatis saat transaksi selesai. Dengan begitu dua permintaan bersamaan untuk unit terakhir tidak sama-sama lolos; yang kedua mendapat `409`.

## Terhubung ke
- Tabel `reservation_items` (qty per tenda per reservasi)
- `ReservationsService.create()`, `ReservationsService.editReservation()`
- `GET /admin/room-types/:id/availability` → `RoomGroupEditor.tsx` (indikator live di form reservasi)
