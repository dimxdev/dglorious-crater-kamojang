# Login & RBAC

**Route:** `/login` (satu pintu semua role)
**Status:** ✅ Selesai
**File utama:** `frontend/components/public/LoginPage.tsx`, `backend/src/auth/`, `frontend/lib/auth/`

## Ringkasan
Satu halaman login untuk semua role (Super Admin, Owner, Admin Penginapan). Pembedaan hak akses murni lewat RBAC, bukan halaman login berbeda per role. Proteksi ditegakkan di dua lapis: frontend (untuk pengalaman pakai) dan backend (proteksi sungguhan).

## Cara Kerja
Admin mengisi email + password, form submit ke `POST /auth/login`. Backend membandingkan password dengan `bcrypt.compare` lalu menerbitkan JWT (`@nestjs/jwt`). Token disimpan frontend di `localStorage` (`dgc_auth_token`) dan dilampirkan sebagai Bearer header di tiap request berikutnya. Untuk memulihkan sesi setelah refresh, `AuthProvider` memanggil `GET /auth/me` saat app dibuka — dan strategi JWT backend (`JwtStrategy.validate()`) selalu mengambil ulang user dari database di tiap request, sehingga akun yang dihapus atau ganti role langsung kehilangan akses meski masih memegang token lama.

Setelah login sukses, user diarahkan ke dashboard sesuai role via `roleHomePath()`. Tiap layout dashboard memasang guard `useRequireRole([...])` yang mengecek role user: belum login → dilempar ke `/login`; role tidak termasuk yang diizinkan → dilempar ke home role-nya sendiri. **Guard frontend ini murni untuk UX** — pengaman sesungguhnya ada di backend, di mana tiap endpoint terproteksi memasang `RolesGuard` + dekorator `@Roles(...)` yang memeriksa role dari JWT yang sudah diverifikasi.

## Sub-fitur
- **Form login** — email + password. Backend membalas **401 yang sama persis** untuk email tak dikenal maupun password salah, supaya tidak bisa dipakai menebak akun mana yang terdaftar.
- **Restore sesi** — token di localStorage + `GET /auth/me` saat app dibuka; validasi ulang user dari DB tiap request.
- **Redirect-jika-sudah-login** — membuka `/login` saat sesi masih valid otomatis melempar ke dashboard role-nya, form tidak sempat tampil.
- **Redirect sesuai role** — `SUPER_ADMIN` → `/super-admin`, `OWNER` → `/owner`, `ADMIN_PENGINAPAN` → `/admin/penginapan` (`roleHome.ts`).
- **Guard frontend** — `useRequireRole([...])` di tiap layout dashboard (UX-only).
- **Guard backend** — `RolesGuard` + `@Roles(...)`. Tanpa `@Roles` = cukup JWT valid; dengan `@Roles(...)` = role harus disebut eksplisit.

## Keputusan Desain Penting
Tidak ada bypass otomatis untuk `SUPER_ADMIN` — di backend, tiap endpoint harus menyebut role yang diizinkan secara eksplisit di `@Roles(...)`, dan di frontend tiap layout wajib mendaftar role yang boleh. Konsekuensi aturannya: Dashboard **Owner eksklusif untuk role `OWNER`** — Super Admin sekalipun tidak bisa masuk (ia punya hub sendiri di `/super-admin`). Arah akses yang berlaku: Owner boleh turun ke semua dashboard admin; Super Admin boleh ke semua dashboard admin tapi **tidak** ke Owner; Admin tidak bisa naik ke dashboard mana pun di atasnya. Model "role di atas otomatis boleh semua" sengaja **tidak** dipakai, karena Dashboard Owner berisi data bisnis yang privat untuk pemilik.

## Terhubung ke
- `POST /auth/login`, `GET /auth/me` (`backend/src/auth/`)
- `RoleName` enum: `SUPER_ADMIN | OWNER | ADMIN_PENGINAPAN`
- `frontend/lib/auth/` (`AuthProvider.tsx`, `useRequireRole.ts`, `roleHome.ts`)
- Semua layout dashboard: `SuperAdminLayout`, `OwnerLayout`, `DashboardLayout` (Admin)
