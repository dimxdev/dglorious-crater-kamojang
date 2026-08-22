# Hub Super Admin

**Route:** `/super-admin`
**Status:** ✅ Selesai (Versi 1)
**File utama:** `frontend/app/super-admin/page.tsx` → `SuperAdminDashboardPage.tsx`, `SuperAdminLayout.tsx`

## Ringkasan
Beranda role Super Admin — sebuah **hub navigasi**, bukan dashboard analitik. Fungsinya cuma jadi pintu masuk ke semua dashboard admin (Penginapan/Tiket/Cafe); Super Admin tidak melihat ringkasan grafik seperti Owner.

## Cara Kerja
Halaman dibungkus `SuperAdminLayout` (shell sidebar desktop + header + bottom nav mobile, pola sama dengan layout dashboard lain) dan dijaga `useRequireRole(['SUPER_ADMIN'])`. Isinya `SuperAdminDashboardPage` — sekumpulan kartu link besar ke tiap dashboard unit bisnis. Kartu unit yang sudah aktif adalah `Link` sungguhan dengan efek hover; kartu unit yang belum ada (Tiket, Cafe) di-render sebagai elemen disabled dengan badge "SOON", bukan link, jadi tidak bisa diklik.

## Sub-fitur
- **Layout & Nav** (`SuperAdminLayout`) — nav "Hub" (`/super-admin`) + "Akun" (`/super-admin/akun`, badge SOON — belum jadi halaman).
- **3 Kartu Section** — Penginapan (link aktif ke `/admin/penginapan`), Tiket Masuk (SOON), Cafe/Restoran (SOON).
- **Tema warna khas** — slate/navy gelap (`bg-[#0f172a]`, aksen `sky-400`), berbeda dari Owner (coklat/emas) dan Admin (hijau/terracotta).

## Keputusan Desain Penting
Tema warna sengaja dibedakan (slate gelap) dari dashboard lain supaya secara visual langsung jelas dashboard mana yang sedang dibuka — menghindari kebingungan antara area Super Admin dan Owner.

Hub ini **tidak** memberi jalan ke Dashboard Owner. Super Admin bukan "atasan" Owner dalam hal data bisnis; ia pengelola sistem yang boleh masuk ke semua dashboard **admin**, sementara Dashboard Owner privat untuk pemilik (lihat aturan arah akses di `fitur-login-rbac.md`).

## Terhubung ke
- Guard: `useRequireRole(['SUPER_ADMIN'])`
- Link ke `/admin/penginapan` (dashboard admin yang sama dipakai `ADMIN_PENGINAPAN`)
