# Tamu Langsung

**Route:** `/admin/penginapan/tamu-langsung`
**Status:** ✅ Selesai — fitur inti
**File utama:** `frontend/components/admin/penginapan/TamuLangsungPage.tsx` (wrapper atas `ReservationFormPage`, `channel="LANGSUNG"`), `backend/src/penginapan/reservations/reservations.service.ts`

## Ringkasan
Menu pencatatan untuk tamu yang datang dan **menginap mulai hari ini**, membayar penuh saat itu juga. Reservasi tersimpan dengan saluran `LANGSUNG` dan langsung berstatus `CHECKED_IN`, melewati tahap `DP`/`LUNAS`. Tamu yang datang untuk memesan tanggal lain dicatat lewat menu Catat Reservasi. Hanya `ADMIN_PENGINAPAN` yang bisa menulis.

## Cara Kerja
Karena berbagi komponen inti `ReservationFormPage` dengan menu Catat Reservasi, seluruh alur pengisiannya identik — Data Tamu, Tanggal, Pilih Tenda (`RoomGroupEditor` dengan ketersediaan real-time), catatan, diskon, override. Bedanya: tanggal check-in **dikunci ke hari ini** (input disabled), dan langkah Pembayaran tidak memilih DP/Lunas melainkan **Metode Bayar** (Tunai/QRIS/Transfer). Tidak ada konsep bayar sebagian; jumlah yang dibayar dipaksa jadi total penuh. Saat Simpan, form mengirim `channel: 'LANGSUNG'` beserta `payMethod` ke `POST /admin/reservations`.

## Sub-fitur
- **Field identik dengan Catat Reservasi** — nama, WA (regex nomor Indonesia yang sama), tanggal, `RoomGroupEditor`, catatan, diskon, override (lihat `fitur-catat-reservasi.md`).
- **Check-in terkunci hari ini** — tanggal hari ini dihitung dalam WIB.
- **Metode Bayar** — Tunai/QRIS/Transfer, menggantikan pilihan status DP/Lunas.
- **Banner info** — memberi tahu admin bahwa reservasi ini otomatis `CHECKED_IN`.

## Keputusan Desain Penting
Status `CHECKED_IN` **dipaksa di backend** untuk saluran `LANGSUNG`, apa pun yang dikirim frontend (`ReservationsService.create()`), dan backend **menolak** (`400`) saluran `LANGSUNG` yang check-in-nya bukan hari ini (WIB). Jadi aturan ini dijamin di sisi server, bukan sekadar default UI. Bersamaan dengan itu backend meng-set `checkedInAt` dan `lunasAt`, lalu membuat satu baris `Payment` untuk total penuh dengan metode bayar yang dipilih dan `recordedBy` = admin pencatat. Konsistensi ini penting supaya laporan pendapatan (yang menghitung dari `Payment.paidAt`) langsung mencatat uang tamu langsung pada hari itu.

Pengecekan ketersediaan memakai jalur atomik yang sama dengan Catat Reservasi (jumlah unit per tipe, `pg_advisory_xact_lock` dalam transaksi).

## Terhubung ke
- `POST /admin/reservations` (`channel: 'LANGSUNG'`, `payMethod`)
- `GET /admin/room-types/:id/availability`
- Komponen bersama: `ReservationFormPage`, `RoomGroupEditor` (detail di `fitur-catat-reservasi.md`)
- `backend/src/common/date-wib.ts` (`isBeforeTodayWib`, `isTodayWib`)
