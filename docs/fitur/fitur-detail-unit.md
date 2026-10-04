# Detail Unit Penginapan

**Route:** `/penginapan/[slug]`
**Status:** ✅ Selesai
**File utama:** `frontend/app/penginapan/[slug]/page.tsx` → `frontend/components/public/DetailPage.tsx`

## Ringkasan
Halaman detail satu tenda/villa — galeri foto, kapasitas, tarif tambah orang, fasilitas, aturan, dan harga. Ujung dari alur brosur publik; CTA-nya mengarahkan tamu ke WhatsApp, **bukan** form booking online.

## Cara Kerja
Halaman ini gabungan server + client component. Bagian server (`page.tsx`) membaca `slug` dari URL dan menyediakan `generateMetadata`: untuk kebutuhan SEO/Open Graph, ia fetch detail unit di sisi server — selalu dalam bahasa Indonesia, karena saat request datang locale pilihan user belum diketahui — lalu menyusun deskripsi OG dari tagline/kapasitas/harga (fallback ke judul generik kalau gagal). Konten interaktifnya di client component `DetailPage`, yang fetch `fetchPublicRoomTypeBySlug(slug, locale)` di `useEffect`. Kalau backend membalas `ApiError` status 404, halaman menampilkan state "tidak ditemukan" inline (dengan link kembali ke katalog) alih-alih `notFound()` Next — karena datanya datang dari API eksternal di client, bukan dari server component. Error lain memunculkan shell error generik. Nomor WA, jam check-in/out diambil dari `usePublicSettings()`.

## Sub-fitur
- **Breadcrumb** — `/penginapan` → nama unit.
- **Galeri** — foto cover + 2 foto samping. Kalau unit punya kurang dari 3 foto, sisanya diisi foto ambience statis (`attractionAirPanas`/`locationValley`) supaya galeri tidak terlihat kosong.
- **Kapasitas & Tarif Tambah Orang** — menampilkan opsi dengan/tanpa ekstra bed atau tarif flat, sesuai konfigurasi unit.
- **Callout Aturan Anak** — catatan aturan hitung kapasitas anak (§8.2 PROJECT.md).
- **Fasilitas** — daftar ikon + label, dengan link ke indeks fasilitas lengkap di `/tentang#fasilitas`.
- **Aturan** — section opsional, satu paragraf (bukan list — mengikuti bentuk `rules` di skema DB).
- **Kartu Harga (sticky sidebar)** — harga weekday/weekend + CTA WhatsApp.

## Keputusan Desain Penting
Halaman ini **tidak** punya `generateStaticParams` — katalog bersifat dinamis dari API, daftar slug tidak bisa dienumerasi saat build. Konsekuensinya halaman ini render-on-demand (`ƒ Dynamic`), bukan SSG. Semua tombol aksi mengarah ke WhatsApp deep link, tanpa form booking, karena situs ini sengaja tidak menyediakan booking online — reservasi dinegosiasikan lewat WhatsApp. Foto di-resolve lewat `resolveImageUrl()` yang menambahkan prefix origin API (`NEXT_PUBLIC_API_URL`) untuk URL relatif backend seperti `/uploads/...`.

## Terhubung ke
- `GET /room-types/:slug?lang=...` (`fetchPublicRoomTypeBySlug`)
- `GET /settings` (`usePublicSettings` — jam check-in/out, nomor WA)
- `lib/api/client.ts` (`ApiError`)
