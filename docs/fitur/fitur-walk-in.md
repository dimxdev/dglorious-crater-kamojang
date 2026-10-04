# Tamu Langsung (Walk-in)

**Route:** `/admin/penginapan/walk-in`
**Status:** ✅ Selesai — fitur inti
**File utama:** `frontend/components/admin/penginapan/WalkinBookingPage.tsx` (wrapper atas `BookingFormPage`, `channel="WALK_IN"`)

## Ringkasan
Menu pencatatan untuk tamu yang datang dan memesan langsung di lokasi, membayar penuh saat itu juga. Booking tersimpan langsung berstatus `CHECKED_IN`, melewati tahap `DP`/`LUNAS` sepenuhnya.

## Cara Kerja
Karena berbagi komponen inti `BookingFormPage` dengan menu Booking WhatsApp, seluruh alur pengisiannya identik — Data Tamu, Tanggal, Pilih Tenda (`RoomGroupEditor` dengan ketersediaan real-time), catatan, diskon, override. Yang berbeda hanya langkah Pembayaran: alih-alih memilih status DP/Lunas, admin memilih **Metode Bayar** (Tunai/QRIS/Transfer), dan tidak ada konsep bayar sebagian karena tamu bayar penuh di tempat — jumlah yang dibayar dipaksa jadi total penuh. Sebuah banner info menjelaskan bahwa tamu ini melewati langkah Check-in. Saat Simpan, form mengirim `bookingChannel: 'WALK_IN'` beserta `payMethod`, dan backend menangani sisanya.

## Sub-fitur
- **Field identik dengan Booking WhatsApp** — nama, WA, tanggal, `RoomGroupEditor`, catatan, diskon, override (lihat `fitur-booking-whatsapp.md`).
- **Metode Bayar** — Tunai/QRIS/Transfer, menggantikan pilihan status DP/Lunas.
- **Banner info** — memberi tahu admin bahwa booking ini otomatis `CHECKED_IN` (tamu skip langkah check-in).

## Keputusan Desain Penting
Status `CHECKED_IN` **dipaksa di backend** untuk channel `WALK_IN`, apa pun yang dikirim frontend (`BookingsService.create()`) — jadi ini bukan sekadar default UI yang bisa dimanipulasi dari client, melainkan dijamin di sisi server. Bersamaan dengan itu backend meng-set `checkedInAt` dan langsung membuat satu baris `Payment` berstatus `PAID` untuk total penuh dengan metode bayar yang dipilih. Konsistensi ini penting supaya laporan pendapatan (yang menghitung dari `Payment.paidAt`) langsung mencatat uang walk-in pada hari itu.

## Terhubung ke
- `POST /admin/bookings` (`bookingChannel: 'WALK_IN'`, `payMethod`)
- `GET /admin/room-types/:id/availability`
- Komponen bersama: `BookingFormPage`, `RoomGroupEditor` (detail di `fitur-booking-whatsapp.md`)
