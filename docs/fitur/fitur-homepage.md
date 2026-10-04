# Homepage

**Route:** `/`
**Status:** ✅ Selesai
**File utama:** `frontend/app/page.tsx` → `frontend/components/public/HomePage.tsx`

## Ringkasan
Halaman depan situs publik — etalase pertama yang dilihat calon tamu sebelum menghubungi reservasi lewat WhatsApp. Menggabungkan hero, daya tarik wisata, preview tenda, info praktis, rute, dan FAQ dalam satu halaman panjang.

## Cara Kerja
Halaman ini komponen client (`'use client'`) yang dibungkus `PublicLayout` (navbar + footer + tombol WhatsApp mengambang). Sebagian besar isinya konten statis yang di-render langsung dari data lokal, **kecuali** blok preview penginapan: saat halaman dibuka, sebuah `useEffect` (keyed ke `locale`) memanggil `fetchPublicRoomTypes(locale)` ke backend dan menyimpan 3 hasil pertama ke state. Selama data itu masih `null`, tiga `RoomCardSkeleton` ditampilkan sebagai placeholder; begitu data masuk, diganti kartu tenda asli. Karena `useEffect`-nya bergantung pada `locale`, mengganti bahasa (ID↔EN) otomatis memicu fetch ulang supaya nama/deskripsi tenda ikut berganti bahasa.

## Sub-fitur
- **Hero** — foto full-bleed dengan judul, subjudul, dan dua tombol CTA (ke `/penginapan` dan `/tentang`). Fotonya ditarik naik (`-mt-18`) supaya sebagian tampil di belakang navbar sticky yang transparan, memberi kesan menyatu.
- **Daya Tarik** — grid bento asimetris: satu atraksi besar ("featured") plus tiga kecil, diambil dari subset atraksi yang ditandai `featured: true` di `lib/data/content.ts`.
- **Teaser Fasilitas** — satu baris ringkas yang mengarahkan ke indeks fasilitas lengkap di `/tentang#fasilitas`.
- **Preview Penginapan** — 3 tenda teratas dari API (lihat Cara Kerja), masing-masing `RoomCard`.
- **Info Praktis** — grid info umum (jam, lokasi, dll) dari `getInfoPraktis()`.
- **Cara ke Sini** — tabel rute perjalanan dari `getRoutes()` (`lib/data/visit.ts`).
- **FAQ** — accordion (`Disclosure`), pertanyaan-jawaban diturunkan dari 12 poin S&K.
- **CTA Penutup** — banner ajakan reservasi yang memakai ulang foto hero.

## Keputusan Desain Penting
Hanya data tenda yang di-fetch live dari backend; atraksi, info praktis, rute, dan FAQ semuanya konten lokal di `lib/data/`. Ini karena konten-konten itu belum dimodelkan sebagai entitas di database (belum ada CMS-nya) — jadi untuk sekarang cara mengubahnya adalah lewat edit kode, bukan lewat dashboard admin.

## Terhubung ke
- `GET /room-types?lang=ID|EN` (`fetchPublicRoomTypes`, `lib/api/roomTypes.ts`)
- `lib/data/content.ts`, `lib/data/visit.ts`, `lib/data/images.ts` — konten statis
- `PublicLayout` — navbar, footer, floating WhatsApp
