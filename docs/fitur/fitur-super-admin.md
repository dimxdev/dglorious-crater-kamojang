# Hub Super Admin

**Route:** `/super-admin`
**Status:** ✅ Selesai
**File utama:** `frontend/app/super-admin/page.tsx` → `SuperAdminDashboardPage.tsx`, `SuperAdminLayout.tsx`

## Ringkasan
Beranda role Super Admin — sebuah **hub navigasi**, bukan dashboard analitik. Fungsinya jadi pintu masuk ke pengelolaan sistem: konten situs publik (CMS), tipe unit (tenda & unit), pengaturan, dan akun. Super Admin tidak melihat ringkasan grafik seperti Owner dan tidak masuk ke dashboard Admin Penginapan.

## Cara Kerja
Halaman dibungkus `SuperAdminLayout` (shell sidebar desktop + header + bottom nav mobile, pola sama dengan layout dashboard lain) dan dijaga `useRequireRole(['SUPER_ADMIN'])`. Isinya `SuperAdminDashboardPage` — daftar baris link (`Link` sungguhan dengan efek hover) ke tiap halaman konten (`/super-admin/konten/*`: beranda, tentang, atraksi, tiket, galeri, kontak, halaman), serta kartu ke Kelola Tenda (`/super-admin/penginapan`), Pengaturan (`/super-admin/pengaturan`), dan Kelola Akun (`/super-admin/akun`).

## Sub-fitur
- **Layout & Nav** (`SuperAdminLayout`) — nav Beranda, grup Konten, Penginapan (tipe unit), dan Sistem (Pengaturan, Akun), plus tautan Ganti Kata Sandi (`/akun/kata-sandi`).
- **Daftar Konten & kartu** — pintasan ke halaman CMS, Kelola Tenda, Pengaturan, dan Kelola Akun (lihat `fitur-kelola-cms.md`, `fitur-settings.md`, `fitur-kelola-akun.md`).
- **Tema warna khas** — slate/navy gelap (`bg-[#0f172a]`, aksen `sky-400`), berbeda dari Owner (coklat/emas) dan Admin (hijau/terracotta).

## Keputusan Desain Penting
Tema warna sengaja dibedakan (slate gelap) dari dashboard lain supaya secara visual langsung jelas dashboard mana yang sedang dibuka — menghindari kebingungan antara area Super Admin dan Owner.

Hub ini **tidak** memberi jalan ke Dashboard Owner maupun dashboard Admin Penginapan. Super Admin pengelola sistem, bukan pencatat reservasi atau pembaca data bisnis; masing-masing dashboard hanya untuk role pemiliknya (lihat `fitur-login-rbac.md`).

## Terhubung ke
- Guard: `useRequireRole(['SUPER_ADMIN'])`
- Link ke `/super-admin/konten/*`, `/super-admin/penginapan`, `/super-admin/pengaturan`, `/super-admin/akun`
