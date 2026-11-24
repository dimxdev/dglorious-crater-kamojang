# Ganti Kata Sandi

**Route:** `/akun/kata-sandi`
**Status:** ✅ Selesai
**File utama:** `frontend/components/account/GantiKataSandiPage.tsx`, `frontend/lib/api/users.ts` (`changeOwnPassword`), `backend/src/auth/auth.service.ts` (`changePassword`), `backend/src/auth/dto/change-password.dto.ts`

## Ringkasan
Halaman bagi pengguna yang sudah masuk untuk mengganti kata sandi akunnya sendiri. Terbuka untuk semua role (`SUPER_ADMIN`, `OWNER`, `ADMIN_PENGINAPAN`), dan tautannya ada di sidebar tiap dashboard (Admin Penginapan, Owner, Super Admin).

## Cara Kerja
Form meminta tiga isian: kata sandi saat ini, kata sandi baru, dan konfirmasi. Frontend memvalidasi dulu (kata sandi saat ini wajib, baru minimal 8 karakter dan tidak boleh sama dengan yang lama, konfirmasi harus cocok), lalu memanggil `PATCH /auth/password` dengan `currentPassword` dan `newPassword`. Backend mengambil user dari JWT, membandingkan `currentPassword` dengan hash tersimpan memakai `bcrypt.compare`, lalu menyimpan hash baru. Sukses menampilkan pesan berhasil dan mengosongkan form; kegagalan menampilkan pesan dari API.

## Sub-fitur
- **Guard role** — `useRequireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN'])`; belum login diarahkan ke `/login`. Tombol kembali menuju beranda sesuai role (`roleHomePath`).
- **Validasi backend** (`ChangePasswordDto` + `AuthService.changePassword`) — `currentPassword` wajib; `newPassword` 8–72 karakter; kata sandi saat ini salah → `400` ("Kata sandi saat ini salah."); kata sandi baru sama dengan yang lama → `400`.
- **Atribut `autocomplete`** — `current-password` dan `new-password` supaya pengelola kata sandi browser bekerja benar.

## Keputusan Desain Penting
Endpoint ada di `auth` (bukan `admin/users`) dan hanya mengubah akun milik pemegang token, jadi tidak perlu `@Roles` khusus — cukup JWT valid. Ini dibedakan dari reset kata sandi oleh Super Admin (`PATCH /admin/users/:id/password`, lihat `fitur-kelola-akun.md`) yang tidak meminta kata sandi lama.

Batas 72 karakter mengikuti batas input bcrypt.

## Terhubung ke
- `PATCH /auth/password` (`AuthController`)
- Tabel `users` (kolom `password`)
- `fitur-login-rbac.md`, `fitur-kelola-akun.md`
