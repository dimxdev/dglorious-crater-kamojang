# Cek Ketersediaan (Anti Double-Booking)

**Status:** ✅ Selesai (Versi 1) — cross-cutting
**File utama:** `backend/src/penginapan/room-types/room-types.service.ts` (`checkAvailability`)

## Ringkasan
Satu fungsi ketersediaan yang dipakai bersama oleh semua jalur pembuatan/edit booking, sekaligus jadi pengaman tunggal terhadap double-booking (§4 PROJECT.md poin 8).

## Cara Kerja
`checkAvailability(roomTypeId, checkIn, checkOut, excludeBookingId?)` pertama mencari tipe tenda (404 kalau tidak ada / sudah di-soft-delete), lalu mengambil semua `BookingItem` yang booking-nya belum HANGUS dan rentang tanggalnya bertumpang tindih dengan `[checkIn, checkOut)` — memakai uji overlap interval klasik `booking.checkIn < checkOut && booking.checkOut > checkIn`. Jumlah `qty` dari semua item yang overlap dijumlahkan jadi `bookedQty`, lalu `availableUnits = max(0, totalUnits - bookedQty)`. Hasilnya objek `{roomTypeId, totalUnits, bookedQty, availableUnits, isAvailable}`. Parameter `excludeBookingId` dipakai saat mengedit booking yang sudah ada, supaya booking itu tidak dihitung sebagai "bentrok dengan dirinya sendiri".

## Sub-fitur
- **Uji overlap tanggal** — booking dianggap bentrok kalau rentang menginapnya beririsan, bukan cuma kalau tanggalnya sama persis.
- **Kecualikan diri sendiri** (`excludeBookingId`) — untuk skenario edit/reschedule.
- **Abaikan HANGUS** — booking yang batal (uang hangus) tidak menghitung sebagai pemakai unit.

## Keputusan Desain Penting
Ketersediaan dihitung di **level qty per-tipe** (jumlah unit), **bukan** dengan mengunci unit fisik spesifik dari tabel `room_units`. Alasannya: `roomUnitId` di `booking_items` baru diisi saat check-in, jadi saat booking pertama dibuat belum ada unit spesifik untuk dicek — yang relevan hanyalah "apakah masih ada sisa unit dari total tipe ini". Pendekatan qty ini yang membuat fungsi bisa dipakai konsisten di semua jalur.

Fungsi ini dipakai di **tiga tempat** dari satu sumber yang sama: saat create booking (`POST /admin/bookings`), saat edit/reschedule (`PATCH /admin/bookings/:code`, dengan exclude diri sendiri), dan lewat endpoint `GET /admin/room-types/:id/availability` yang dipanggil frontend real-time (debounced) saat admin mengisi form. Satu implementasi, tiga pemanggil — tidak ada logic ketersediaan paralel yang berpotensi drift dan membuka celah double-booking.

## Terhubung ke
- Tabel `booking_items` (qty per tenda per booking)
- `BookingsService.create()`, `BookingsService.editBooking()`
- `GET /admin/room-types/:id/availability` → `RoomGroupEditor.tsx` (indikator live di form booking)
