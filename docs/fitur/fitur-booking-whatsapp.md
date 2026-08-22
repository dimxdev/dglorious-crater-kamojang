# Booking WhatsApp

**Route:** `/admin/penginapan/booking-whatsapp`
**Status:** ✅ Selesai (Versi 1) — fitur inti Versi 1
**File utama:** `frontend/components/admin/penginapan/BookingWhatsappPage.tsx` (wrapper atas `BookingFormPage`, `channel="WHATSAPP"`)

## Ringkasan
Menu pencatatan booking yang sudah dealing lewat WhatsApp, saat tamu belum tiba di lokasi. Admin memasukkan booking yang **sudah fix** — negosiasi harga & pembayaran DP terjadi di WhatsApp, di luar sistem. Booking tersimpan mulai dari status `DP` atau `LUNAS`.

## Cara Kerja
Form ini terbagi 4 langkah: Data Tamu, Tanggal Menginap, Pilih Tenda, dan Pembayaran. Inti kerumitannya ada di langkah Pilih Tenda yang memakai `RoomGroupEditor`: satu booking bisa mencakup beberapa unit, dan **tiap unit fisik adalah satu baris "Tenda" tersendiri** dengan tipe, jumlah dewasa, anak, dan extra bed masing-masing — bukan satu angka gabungan untuk seluruh booking. Ini perlu karena kalau tamu memesan dua tipe berbeda, komposisi orang di tiap unit bisa berbeda.

Sambil admin mengisi, tiap baris tenda memeriksa ketersediaan ke backend secara real-time (di-debounce 500ms) dan menampilkan status Penuh/Rendah/Oke inline — dengan memperhitungkan baris lain di form yang memakai tipe sama, supaya admin tidak menjual unit yang sama dua kali dalam satu form. Total harga dihitung otomatis dan live via `calcGroupsTotal` (tarif weekday/weekend per malam + extra bed), dan admin bisa meng-override dengan nominal manual kalau ada hasil nego. Saat Simpan, form memanggil `POST /admin/bookings`; sukses menampilkan kode booking baru dan me-reset form, gagal (mis. `409` karena tenda penuh) memunculkan pesan error inline tanpa crash.

## Sub-fitur
- **Data Tamu** — nama, no. WhatsApp.
- **Tanggal Menginap** — check-in/check-out; checkout otomatis di-bump ke check-in+1 hari bila perlu.
- **Pilih Tenda** (`RoomGroupEditor`) — per unit fisik: tipe, dewasa, anak, extra bed (jumlah + jenis), subtotal live, tombol duplikat/hapus/tambah. Dengan indikator ketersediaan real-time.
- **Pembayaran** — pilih Status (DP/Lunas). Kalau DP, wajib isi "Jumlah DP Diterima" (nominal beneran yang sudah masuk, bukan diasumsikan 50%). Diskon opsional (nominal atau persen).
- **Ringkasan & Override** — total otomatis dengan opsi ubah nominal manual.

## Keputusan Desain Penting
Form ini dan menu Walk-in berbagi satu komponen inti `BookingFormPage` — field-nya identik, yang beda hanya default status dan isi langkah Pembayaran. Ini disengaja supaya perbaikan/perubahan di satu tempat langsung berlaku untuk kedua menu, tanpa perlu menjaga dua form kembar.

Form tidak menyimpan Foto KTP sama sekali. Admin sudah menerima foto KTP secara manual lewat chat WhatsApp saat nego (S&K poin 10 tetap berlaku, prosesnya di luar sistem) — menyimpannya lagi di sistem hanya menambah kerumitan tanpa kebutuhan bisnis nyata.

Karena `RoomGroupEditor` memakai slug tenda di dropdown sementara backend butuh `roomTypeId` numerik, form sekali di awal fetch `GET /admin/room-types` untuk membangun pemetaan slug→id.

## Terhubung ke
- `POST /admin/bookings` (`createBooking` — `bookingChannel: 'WHATSAPP'`, `initialStatus`, `paidAmount` bila DP)
- `GET /admin/room-types/:id/availability` (`checkRoomTypeAvailability`)
- `lib/pricing.ts` (`calcGroupsTotal`, `calcGroupSubtotal`) — lihat `fitur-mesin-harga.md`
- Backend `BookingsService.create()` — membuat baris `Payment` untuk DP maupun Lunas
