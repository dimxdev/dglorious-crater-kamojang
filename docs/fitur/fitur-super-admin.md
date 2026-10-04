# Hub Super Admin

**Route:** `/super-admin`
**Status:** ✅ Selesai
**File utama:** `frontend/app/super-admin/page.tsx` → `SuperAdminDashboardPage.tsx`, `SuperAdminLayout.tsx`

## Ringkasan
Beranda role Super Admin — sebuah **hub navigasi**, bukan dashboard analitik. Fungsinya jadi pintu masuk ke dashboard admin Penginapan; Super Admin tidak melihat ringkasan grafik seperti Owner.

## Cara Kerja
Halaman dibungkus `SuperAdminLayout` (shell sidebar desktop + header + bottom nav mobile, pola sama dengan layout dashboard lain) dan dijaga `useRequireRole(['SUPER_ADMIN'])`. Isinya `SuperAdminDashboardPage` — kartu link besar ke dashboard admin, berupa `Link` sungguhan dengan efek hover.

## Sub-fitur
- **Layout & Nav** (`SuperAdminLayout`) — nav "Beranda" (`/super-admin`).
- **Kartu Section** — Penginapan (link ke `/admin/penginapan`).
- **Tema warna khas** — slate/navy gelap (`bg-[#0f172a]`, aksen `sky-400`), berbeda dari Owner (coklat/emas) dan Admin (hijau/terracotta).

## Keputusan Desain Penting
Tema warna sengaja dibedakan (slate gelap) dari dashboard lain supaya secara visual langsung jelas dashboard mana yang sedang dibuka — menghindari kebingungan antara area Super Admin dan Owner.

Hub ini **tidak** memberi jalan ke Dashboard Owner. Super Admin bukan "atasan" Owner dalam hal data bisnis; ia pengelola sistem yang boleh masuk ke semua dashboard **admin**, sementara Dashboard Owner privat untuk pemilik (lihat aturan arah akses di `fitur-login-rbac.md`).

## Terhubung ke
- Guard: `useRequireRole(['SUPER_ADMIN'])`
- Link ke `/admin/penginapan` (dashboard admin yang sama dipakai `ADMIN_PENGINAPAN`)
