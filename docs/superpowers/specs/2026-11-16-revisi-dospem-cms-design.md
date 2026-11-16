# Revisi dosen pembimbing — desain (disetujui user 2026-11-16, opsi A)

## Revisi
1. **Validasi tanggal check-in** (form buat & edit reservasi): tanggal sebelum hari ini (WIB, Asia/Jakarta) ditolak. Hari ini boleh (walk-in). Frontend (input date `min`) + backend (400, pesan Indonesia). Saat edit, validasi hanya jika `checkIn` diubah — reservasi lama (mis. COMPLETED) tetap bisa diedit catatannya.
2. **Company profile dikelola SUPER_ADMIN, dwibahasa ID/EN** — semua konten bisnis halaman publik yang hardcode dipindah ke DB. Kelola tenda (room types, gambar, harga) pindah dari ADMIN_PENGINAPAN ke SUPER_ADMIN; Admin Penginapan & Owner hanya baca.

## Non-goal / anti-goal
- Teks UI (label tombol/form, aria, judul navigasi) TETAP di i18n (`frontend/lib/i18n/locales/*.json`).
- Tidak ada fallback konten hardcode di frontend (dua sumber kebenaran = gagal). API gagal → skeleton / section disembunyikan.
- Jangan jalankan `prisma db seed` standar (menghapus gambar galeri). Tidak ada git commit/push.

## Skema (opsi A — hibrida)
```prisma
enum ContentCollection {
  ATTRACTION
  INFO_CARD
  ROUTE
  FAQ
  TICKET_PACKAGE
  PARKING_FEE
  GALLERY
  FACILITY_ZONE
}

model SiteSection {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  content     Json
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedById Int?     @map("updated_by")
  updatedBy   User?    @relation("SiteSectionUpdatedBy", fields: [updatedById], references: [id])
  @@map("site_sections")
}

model ContentItem {
  id          Int               @id @default(autoincrement())
  collection  ContentCollection
  sortOrder   Int               @default(0) @map("sort_order")
  isActive    Boolean           @default(true) @map("is_active")
  imageUrl    String?           @map("image_url")
  content     Json
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")
  updatedById Int?              @map("updated_by")
  updatedBy   User?             @relation("ContentItemUpdatedBy", fields: [updatedById], references: [id])
  @@index([collection, sortOrder])
  @@map("content_items")
}
```
`L` = teks dwibahasa `{ id: string; en: string }` (`id` wajib tidak kosong; `en` boleh kosong → frontend fallback ke `id`).
`imageUrl` = path `/images/...` (aset publik Next.js) atau `/uploads/site/...` (upload backend). Frontend me-resolve `/uploads/*` dengan prefix `NEXT_PUBLIC_API_URL`.

### Section (key → bentuk `content`)
| key | content |
|---|---|
| `home_hero` | `{ title: L, subtitle: L, imageUrl: string }` |
| `home_attractions` | `{ title: L }` (kartu = ATTRACTION dengan `featured: true`) |
| `home_facilities_teaser` | `{ body: L }` |
| `home_lodging` | `{ title: L, subtitle: L }` |
| `home_info` | `{ title: L, imageUrl: string }` (foto lokasi) |
| `home_routes` | `{ title: L, lead: L, mapsUrl: string }` |
| `home_faq` | `{ title: L, lead: L }` |
| `home_cta` | `{ title: L, subtitle: L, imageUrl: string }` |
| `about_intro` | `{ title: L, lead: L, stats: { label: L, value: L }[] }` (0–4 stat) |
| `about_history` | `{ body: L, imageUrl: string }` (paragraf dipisah baris kosong) |
| `about_attractions` | `{ title: L }` |
| `about_gallery` | `{ title: L }` |
| `about_tickets` | `{ title: L, note: L }` |
| `about_parking` | `{ title: L }` |
| `facilities` | `{ title: L, note: L, disclaimer: L }` |
| `listing` | `{ title: L, lead: L, helpTitle: L, helpBody: L }` |
| `room_detail` | `{ childrenRule: L, universalFacilitiesNote: L, priceNote: L }` |
| `terms` | `{ title: L, subtitle: L, questionTitle: L, questionBody: L }` |
| `contact` | `{ address: L, mapsQuery: string, footerTagline: L, waMessages: { general: L, booking: L, room: L, terms: L } }` — `room` boleh memuat placeholder `{room}` |
| `site_meta` | `{ description: L }` (meta description/OG) |

### Koleksi (collection → bentuk `content`; `imageUrl` di kolom tabel)
| collection | content | pakai imageUrl |
|---|---|---|
| ATTRACTION | `{ name: L, desc: L, icon: IconName, featured: boolean }` | ya |
| INFO_CARD | `{ icon: IconName, title: L, line1: L, line2: L, linkLabel?: L, href?: string }` | – |
| ROUTE | `{ from: L, duration: L, distance: L, note: L }` | – |
| FAQ | `{ q: L, a: L }` | – |
| TICKET_PACKAGE | `{ name: L, note?: L, benefits: L[], priceDay: number, priceNight: number }` | – |
| PARKING_FEE | `{ vehicle: L, price: number }` | – |
| GALLERY | `{ label: L }` | ya |
| FACILITY_ZONE | `{ icon: IconName, name: L, note: L, items: L[] }` | – |

`IconName` = key dari `frontend/lib/icons.ts` (backend: validasi string non-kosong, maks 40 char).

## API
Publik (tanpa auth):
- `GET /site-content` → `{ sections: Record<key, content>, collections: Record<ContentCollection, PublicItem[]> }`, `PublicItem = { id, imageUrl, content }`, hanya `isActive`, urut `sortOrder, id`. Kedua bahasa dikirim; frontend memilih sesuai locale.

SUPER_ADMIN saja (`@Roles(RoleName.SUPER_ADMIN)`):
- `GET /admin/site-content/sections` → `{ key, content, updatedAt, updatedBy: {name}|null }[]`
- `PUT /admin/site-content/sections/:key` body `{ content }` → divalidasi sesuai tabel; key tak dikenal → 404; bentuk salah → 400 pesan Indonesia.
- `GET /admin/site-content/items?collection=FAQ` → semua item (termasuk nonaktif).
- `POST /admin/site-content/items` body `{ collection, content, imageUrl?, isActive? }` (sortOrder = max+1)
- `PATCH /admin/site-content/items/:id` body `{ content?, imageUrl?, isActive? }`
- `DELETE /admin/site-content/items/:id`
- `PUT /admin/site-content/items/reorder` body `{ collection, ids: number[] }`
- `POST /admin/site-content/upload` multipart `file` (image/*, maks 5 MB) → `{ url: "/uploads/site/<uuid>.<ext>" }`
- `GET /admin/settings` → `Record<string,string>`; `PUT /admin/settings` body `{ values: Record<string,string> }` — hanya key yang sudah ada.

RBAC tenda: `admin/room-types` GET (list, detail, availability) tetap SUPER_ADMIN/OWNER/ADMIN_PENGINAPAN; POST/PATCH/DELETE + upload gambar + `admin/room-images/*` hanya SUPER_ADMIN.

## Frontend
- Halaman publik membaca `GET /site-content` lewat hook ber-cache modul (pola `usePublicSettings`).
- Super Admin: menu "Konten situs" (Beranda, Tentang, Atraksi & fasilitas, Tiket & parkir, Galeri, Kontak & footer, Halaman penginapan & S&K), "Tenda & unit" (pindahan `KelolaPage`), "Pengaturan umum" (tabel settings). Form ID/EN berdampingan, peringatan bila EN kosong, daftar bisa diurutkan & disembunyikan.
- Sidebar Admin Penginapan: menu "Kelola" dihapus; `/admin/penginapan/kelola` redirect ke `/admin/penginapan`.

## Seed konten
`backend/prisma/seed-content.ts` (+ script `seed:content`), idempoten: section dibuat bila belum ada (tidak menimpa editan admin kecuali `--force`); item per koleksi diisi hanya bila koleksi kosong. Isi diambil dari data hardcode yang ada sekarang (`frontend/lib/data/*.ts`, `locales/*.json`, `Footer.tsx`, dll.). Teks yang menyebut jumlah tetap ("Enam tipe unit", "Empat kawah…") ditulis ulang tanpa angka agar tidak basi.
