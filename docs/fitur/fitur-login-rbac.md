# Login & RBAC

**Route:** `/login` (satu pintu semua role)
**Status:** ✅ Selesai
**File utama:** `frontend/components/public/LoginPage.tsx`, `backend/src/auth/`, `frontend/lib/auth/`

## Ringkasan
Satu halaman login untuk semua role (Super Admin, Owner, Admin Penginapan). Pembedaan hak akses murni lewat RBAC, bukan halaman login berbeda per role. Proteksi ditegakkan di dua lapis: frontend (untuk pengalaman pakai) dan backend (proteksi sungguhan).

## Cara Kerja
Admin mengisi email + password, form submit ke `POST /auth/login`. Backend membandingkan password dengan `bcrypt.compare` lalu menerbitkan JWT (`@nestjs/jwt`). Token disimpan frontend di `localStorage` (`dgc_auth_token`) dan dilampirkan sebagai Bearer header di tiap request berikutnya. Untuk memulihkan sesi setelah refresh, `AuthProvider` memanggil `GET /auth/me` saat app dibuka — dan strategi JWT backend (`JwtStrategy.validate()`) selalu mengambil ulang user dari database di tiap request, sehingga akun yang dihapus, dinonaktifkan (`users.is_active = false`), atau ganti role langsung kehilangan akses meski masih memegang token lama.

Setelah login sukses, user diarahkan ke dashboard sesuai role via `roleHomePath()`. Tiap layout dashboard memasang guard `useRequireRole([...])` yang mengecek role user: belum login → dilempar ke `/login`; role tidak termasuk yang diizinkan → dilempar ke home role-nya sendiri. **Guard frontend ini murni untuk UX** — pengaman sesungguhnya ada di backend, di mana tiap endpoint terproteksi memasang `RolesGuard` + dekorator `@Roles(...)` yang memeriksa role dari JWT yang sudah diverifikasi.

## Sub-fitur
- **Form login** — email + password. Backend membalas **401 yang sama persis** untuk email tak dikenal maupun password salah, supaya tidak bisa dipakai menebak akun mana yang terdaftar. Akun nonaktif baru ditolak (`401`, "Akun dinonaktifkan. Hubungi Super Admin.") setelah password cocok, sehingga status akun tidak bisa diintip orang yang tidak tahu kata sandinya.
- **Restore sesi** — token di localStorage + `GET /auth/me` saat app dibuka; validasi ulang user dari DB tiap request.
- **Redirect-jika-sudah-login** — membuka `/login` saat sesi masih valid otomatis melempar ke dashboard role-nya, form tidak sempat tampil.
- **Redirect sesuai role** — `SUPER_ADMIN` → `/super-admin`, `OWNER` → `/owner`, `ADMIN_PENGINAPAN` → `/admin/penginapan` (`roleHome.ts`).
- **Guard frontend** — `useRequireRole([...])` di tiap layout dashboard (UX-only).
- **Guard backend** — `RolesGuard` + `@Roles(...)`. Tanpa `@Roles` = cukup JWT valid; dengan `@Roles(...)` = role harus disebut eksplisit. `@Roles` di level method menimpa level class.
- **Ganti kata sandi sendiri** — `PATCH /auth/password` untuk semua role (lihat `fitur-ganti-kata-sandi.md`).

## Keputusan Desain Penting
Tidak ada bypass otomatis untuk role mana pun — di backend, tiap endpoint harus menyebut role yang diizinkan secara eksplisit di `@Roles(...)`, dan di frontend tiap layout wajib mendaftar role yang boleh. Konsekuensinya setiap dashboard eksklusif untuk role pemiliknya: dashboard **Admin Penginapan** hanya `ADMIN_PENGINAPAN` (`DashboardLayout`), dashboard **Owner** hanya `OWNER` (`OwnerLayout`), dan hub **Super Admin** hanya `SUPER_ADMIN` (`SuperAdminLayout`). Model "role di atas otomatis boleh semua" sengaja **tidak** dipakai: Dashboard Owner berisi data bisnis yang privat untuk pemilik, dan pencatatan reservasi adalah tugas Admin Penginapan.

Pembagian hak di API:
- **Reservasi** (`admin/reservations`): baca (`GET`) untuk `OWNER` + `ADMIN_PENGINAPAN`; tulis (`POST`, `PATCH`) hanya `ADMIN_PENGINAPAN`. Super Admin tidak punya akses.
- **Tipe unit** (`admin/room-types`): baca untuk ketiga role; tulis (tambah/ubah/hapus tipe, upload/hapus gambar) hanya `SUPER_ADMIN`.
- **CMS konten** (`admin/site-content`) dan **pengaturan** (`admin/settings`): hanya `SUPER_ADMIN`.
- **Akun** (`admin/users`): hanya `SUPER_ADMIN` (lihat `fitur-kelola-akun.md`).

## Terhubung ke
- `POST /auth/login`, `GET /auth/me`, `PATCH /auth/password` (`backend/src/auth/`)
- `RoleName` enum: `SUPER_ADMIN | OWNER | ADMIN_PENGINAPAN`
- `frontend/lib/auth/` (`AuthProvider.tsx`, `useRequireRole.ts`, `roleHome.ts`)
- Semua layout dashboard: `SuperAdminLayout`, `OwnerLayout`, `DashboardLayout` (Admin)
