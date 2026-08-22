# Katalog Penginapan

**Route:** `/penginapan`
**Status:** ✅ Selesai (Versi 1)
**File utama:** `frontend/app/penginapan/page.tsx` → `frontend/components/public/ListingPage.tsx`

## Ringkasan
Katalog/brosur digital semua tenda & villa — daftar unit dengan foto, kapasitas, dan harga weekday/weekend, diambil langsung dari data yang dikelola admin lewat CMS.

## Cara Kerja
Saat halaman dibuka, sebuah `useEffect` memanggil `fetchPublicRoomTypes(locale)` dan menjalankan sebuah state machine eksplisit bernilai `'loading' | 'ready' | 'error'`. Selama `loading`, ditampilkan enam `RoomCardSkeleton`; kalau `error`, muncul kotak bergaris putus-putus dengan tombol "Coba lagi"; kalau `ready` tapi kosong, muncul ikon tenda + pesan; kalau ada data, ditampilkan grid `RoomCard`. Tombol "Coba lagi" bekerja dengan menaikkan sebuah counter `attempt` yang jadi salah satu dependency `useEffect` — jadi menekannya memicu ulang fetch yang sama tanpa perlu reload halaman. Nomor WhatsApp untuk CTA di bagian bawah diambil terpisah lewat `usePublicSettings()`.

## Sub-fitur
- **Header (`PageMast`)** — jumlah tipe unit, rentang harga (dihitung `Math.min`/`Math.max` atas `priceWeekday`/`priceWeekend` semua unit), dan jam check-in.
- **Grid Katalog** — `RoomCard` varian `"listing"` per unit.
- **State loading/error/kosong** — masing-masing punya tampilan sendiri (lihat Cara Kerja).
- **CTA Bantuan** — banner bawah dengan link WhatsApp untuk tamu yang mau tanya/reservasi.
- **Aksesibilitas** — perubahan status loading diumumkan lewat elemen `aria-live="polite"` (sr-only) untuk pembaca layar.

## Keputusan Desain Penting
`usePublicSettings()` diimplementasikan sebagai hook dengan **cache promise di tingkat modul**, bukan React Context. Alasannya: dalam satu halaman ada beberapa komponen (navbar, footer, CTA) yang butuh settings — tanpa cache, mereka akan memicu `GET /settings` berkali-kali. Dengan cache promise bersama, hanya satu request yang jalan. Kegagalan sengaja **tidak** di-cache, supaya kalau backend sempat down sesaat, percobaan berikutnya masih bisa berhasil.

## Terhubung ke
- `GET /room-types?lang=ID|EN` (`fetchPublicRoomTypes`)
- `GET /settings` (`usePublicSettings`)
- Klik kartu → `/penginapan/[slug]` (Detail Unit)
