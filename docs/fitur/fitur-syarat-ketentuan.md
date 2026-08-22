# Syarat & Ketentuan

**Route:** `/syarat-ketentuan`
**Status:** ✅ Selesai (Versi 1)
**File utama:** `frontend/app/syarat-ketentuan/page.tsx` → `frontend/components/public/TermsPage.tsx`

## Ringkasan
Halaman S&K berisi 12 poin resmi dari klien. Satu-satunya halaman publik yang isi prosanya benar-benar bersumber dari database, bukan konten statis.

## Cara Kerja
Saat halaman dibuka, `useEffect` (keyed ke `locale`) memanggil `fetchPublicSettings()` langsung ke `GET /settings`, lalu mengambil teks S&K sesuai bahasa aktif (`terms_conditions_id` atau `terms_conditions_en`) dan memecahnya jadi array poin lewat `.split('\n')`. Selama fetch berjalan ditampilkan 6 baris skeleton; kalau gagal, muncul state error. Nomor WhatsApp untuk CTA penutup diambil terpisah lewat `usePublicSettings()`.

## Sub-fitur
- **Daftar 12 poin S&K** — `<ol>` bernomor. Prefix angka asli tiap poin ("1. ", "2. ") di-strip dengan regex karena nomor indeksnya sudah dirender terpisah dengan gaya sendiri.
- **Loading skeleton** — 6 baris palsu saat menunggu fetch.
- **Error state** — kalau `GET /settings` gagal.
- **CTA Penutup** — box "ada pertanyaan?" dengan link WhatsApp.

## Keputusan Desain Penting
Halaman ini fetch settings **terpisah** dari hook cache `usePublicSettings()` yang dipakai halaman lain. Alasannya: teks S&K bergantung bahasa, sedangkan hook cache itu mengembalikan satu objek flat yang tidak terikat locale. Teks S&K disimpan sebagai **dua key terpisah** (`terms_conditions_id`/`terms_conditions_en`) — bukan satu kolom per-bahasa — karena `Setting.value` hanya menyimpan satu string per key. Jadi `TermsPage` harus memilih key yang benar tiap kali locale berganti, yang lebih pas dilakukan dengan fetch sendiri. Penomoran poin sengaja dipertahankan karena klien merujuk S&K berdasarkan nomor ("S&K poin 7").

## Terhubung ke
- `GET /settings` (`fetchPublicSettings`, `lib/api/settings.ts`) — key `terms_conditions_id`/`terms_conditions_en`
- `usePublicSettings()` — nomor WA CTA
