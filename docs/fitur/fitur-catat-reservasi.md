# Catat Reservasi

**Route:** `/admin/penginapan/reservasi-baru`
**Status:** ✅ Selesai — fitur inti
**File utama:** `frontend/components/admin/penginapan/ReservasiBaruPage.tsx` (wrapper atas `ReservationFormPage`, `channel="RESERVASI"`), `backend/src/penginapan/reservations/reservations.service.ts`

## Ringkasan
Menu pencatatan reservasi untuk tamu yang menginap mulai **hari ini atau tanggal mendatang**, yang sudah sepakat lewat WhatsApp atau datang memesan langsung di lokasi untuk tanggal berikutnya. Admin memasukkan reservasi yang **sudah fix** — negosiasi harga & pembayaran DP terjadi di luar sistem. Reservasi tersimpan mulai dari status `DP` atau `LUNAS` dengan saluran `RESERVASI`. Hanya role `ADMIN_PENGINAPAN` yang bisa menulis.

## Cara Kerja
Form ini terbagi 4 langkah: Data Tamu, Tanggal Menginap, Pilih Tenda, dan Pembayaran. Inti kerumitannya ada di langkah Pilih Tenda yang memakai `RoomGroupEditor`: satu reservasi bisa mencakup beberapa unit, dan **tiap unit fisik adalah satu baris "Tenda" tersendiri** dengan tipe, jumlah dewasa, anak, dan extra bed masing-masing — bukan satu angka gabungan untuk seluruh reservasi. Ini perlu karena kalau tamu memesan dua tipe berbeda, komposisi orang di tiap unit bisa berbeda.

Sambil admin mengisi, tiap baris tenda memeriksa ketersediaan ke backend secara real-time (di-debounce 500ms) dan menampilkan status Penuh/Rendah/Oke inline — dengan memperhitungkan baris lain di form yang memakai tipe sama, supaya admin tidak menjual unit yang sama dua kali dalam satu form. Total harga dihitung otomatis dan live via `calcGroupsTotal` (tarif weekday/weekend per malam + extra bed), dan admin bisa meng-override dengan nominal manual kalau ada hasil nego. Saat Simpan, form memanggil `POST /admin/reservations`; sukses menampilkan kode reservasi baru dan me-reset form, gagal (mis. `409` karena tenda penuh, atau `400` karena tanggal check-in sebelum hari ini) memunculkan pesan error inline tanpa crash.

Di backend, `ReservationsService.create()` menolak check-in sebelum hari ini (WIB), membekukan harga, lalu di dalam satu transaksi database memeriksa ketersediaan dan membuat reservasi beserta baris `Payment` (DP sesuai nominal yang diisi, atau total penuh bila `LUNAS`, selalu metode transfer bank, `recordedBy` = admin pencatat).

## Sub-fitur
- **Data Tamu** — nama, no. WhatsApp. Nomor divalidasi regex `^(\+62|62|0)8[0-9]{7,12}$` di frontend (`lib/phone.ts`) dan backend.
- **Tanggal Menginap** — check-in/check-out. Input check-in memakai `min` = hari ini (WIB); checkout otomatis minimal check-in+1 hari.
- **Pilih Tenda** (`RoomGroupEditor`) — per unit fisik: tipe, dewasa, anak, extra bed, subtotal live, tombol duplikat/hapus/tambah. Dengan indikator ketersediaan real-time.
- **Pembayaran** — pilih Status (DP/Lunas). Kalau DP, wajib isi "Jumlah DP Diterima" (nominal beneran yang sudah masuk). Ada **bantuan DP**: menampilkan 50% dari total beserta tombol "Isi 50%" — hanya alat bantu, tidak dipaksakan. Diskon opsional (nominal atau persen).
- **Ringkasan & Override** — total otomatis dengan opsi ubah nominal manual.

## Keputusan Desain Penting
Form ini dan menu Tamu Langsung berbagi satu komponen inti `ReservationFormPage` — field-nya identik, yang beda hanya `channel`, status awal, dan isi langkah Pembayaran. Ini disengaja supaya perbaikan di satu tempat langsung berlaku untuk kedua menu.

Aturan tanggal ditegakkan di **backend**, bukan hanya di input form: check-in sebelum hari ini (zona waktu WIB, `backend/src/common/date-wib.ts`) ditolak `400`. Hari ini diperbolehkan.

Pengecekan ketersediaan **atomik**: jumlah unit yang diminta dijumlahkan per tipe tenda, lalu dicek di dalam transaksi dengan `pg_advisory_xact_lock` per tipe. Tanpa kunci ini, dua admin yang menyimpan bersamaan bisa sama-sama melihat sisa unit dan menjual unit yang sama (race condition / pemesanan ganda). Lihat `fitur-cek-ketersediaan.md`.

Form tidak menyimpan Foto KTP sama sekali. Admin sudah menerima foto KTP secara manual lewat chat WhatsApp saat nego (S&K poin 10 tetap berlaku, prosesnya di luar sistem).

Dropdown tenda dan harga tidak ditulis statis di frontend: form sekali di awal fetch `GET /admin/room-types` (hanya tipe aktif) untuk mengisi pilihan tenda, tarif weekday/weekend, dan tarif tambah orang, sehingga perubahan tarif oleh Super Admin langsung berlaku di form.

## Terhubung ke
- `POST /admin/reservations` (`CreateReservationDto`: `channel: 'RESERVASI'`, `initialStatus` DP/LUNAS, `paidAmount` bila DP)
- `GET /admin/room-types/:id/availability`
- `lib/pricing.ts` (`calcGroupsTotal`, `calcGroupSubtotal`) — lihat `fitur-mesin-harga.md`
- Backend `ReservationsService.create()` — membuat baris `Payment` untuk DP maupun Lunas
- Tabel `reservations`, `reservation_items`, `payments`
