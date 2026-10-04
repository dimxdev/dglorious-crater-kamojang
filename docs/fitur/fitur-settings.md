# Modul Settings

**Route API:** `GET /settings` (publik, tanpa login)
**Status:** ✅ Selesai — read-only; nilai diubah lewat database
**File utama:** `backend/src/settings/` (`settings-public.controller.ts`, `settings.service.ts`)

## Ringkasan
Penyimpanan konfigurasi global lintas-unit-bisnis — jam operasional, kontak, rekening pembayaran, teks S&K. Prinsipnya semua yang bisa berubah **wajib** di sini, tidak boleh hardcode (§4 PROJECT.md poin 6). Saat ini nilainya bisa dibaca lewat API, tapi diubah masih lewat database langsung.

## Cara Kerja
Ada satu endpoint, `GET /settings`, tanpa autentikasi (tamu memang tidak pernah login, jadi tidak perlu auth). Ia menjalankan `prisma.setting.findMany()` dan mengembalikan objek flat `{key: value}`. Di frontend, konsumsinya melewati `usePublicSettings()` — hook dengan cache promise tingkat-modul, sehingga beberapa komponen di satu halaman (navbar, footer, CTA) berbagi satu request alih-alih memicu `GET /settings` berkali-kali. Kegagalan tidak di-cache, jadi retry berikutnya bisa berhasil kalau backend sempat down.

## Sub-fitur
- **`GET /settings`** — endpoint publik read-only, balikan objek flat `{key: value}`.
- **Key yang di-seed:** `check_in_time` (14:00), `check_out_time` (12:00), `whatsapp_number`, `contact_email`, `instagram_url`, `tiktok_url`, `facebook_url`, `whatsapp_number_2`, serta `terms_conditions_id`/`terms_conditions_en` (12 poin S&K, disimpan 2 key terpisah karena `Setting.value` bukan per-bahasa).
- **`usePublicSettings()`** (frontend) — hook cache, dipakai `FloatingWhatsApp`, `Navbar`, `Footer`, `DetailPage`, `ListingPage`; `TermsPage` fetch terpisah karena butuh varian per-bahasa.

## Keputusan Desain Penting
Modul ini berada di root `src/settings/` (bukan di dalam salah satu unit bisnis seperti `penginapan/`) karena settings dipakai lintas semua unit — sama seperti `auth/`.

Teks S&K disimpan sebagai dua key terpisah (`terms_conditions_id`/`terms_conditions_en`) alih-alih satu tabel translasi relasional, karena tabel `settings` memang key-value flat dan `Setting.value` cuma satu string. Ini pendekatan pragmatis untuk kasus key-value, berbeda dari `room_type_translations` yang memang tabel relasional multi-bahasa.

Tidak ada CRUD admin untuk settings: nilai konfigurasi ini jarang berubah, jadi cukup diubah langsung lewat database. Tabel `Setting` hanya berisi `id`, `key` unik, `value`, dan `updatedAt`.

## Terhubung ke
- Prisma model `Setting` (tabel `settings`)
- `backend/prisma/seed.ts` (`SETTINGS` array — sumber nilai awal)
- `frontend/lib/api/settings.ts` (`fetchPublicSettings`, `waLink`), `frontend/lib/usePublicSettings.ts`
