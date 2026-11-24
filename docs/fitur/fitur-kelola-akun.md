# Kelola Akun

**Route:** `/super-admin/akun`
**Status:** ✅ Selesai
**File utama:** `frontend/components/super-admin/akun/KelolaAkunPage.tsx`, `frontend/lib/api/users.ts`, `backend/src/users/` (`UsersService`, `UsersAdminController`)

## Ringkasan
Halaman Super Admin untuk mengelola akun pengguna sistem (Super Admin, Owner, Admin Penginapan): membuat akun, mengubah nama/email/peran, menonaktifkan, mereset kata sandi, dan menghapus. Hanya role `SUPER_ADMIN` yang boleh mengakses (layout `useRequireRole(['SUPER_ADMIN'])`, backend `@Roles(RoleName.SUPER_ADMIN)` di `admin/users`).

## Cara Kerja
Halaman fetch `GET /admin/users` (loading/error + retry) lalu menampilkan tabel akun dengan kolom akun (nama, email, terakhir diubah), peran, status (Aktif/Nonaktif), dan aksi. Daftar diurutkan menurut peran (Super Admin, Owner, Admin Penginapan) lalu nama. Tombol "Tambah akun" dan tiap aksi per baris (Ubah, Reset kata sandi, Hapus) membuka modal; setelah sukses daftar di-refresh dan muncul pesan konfirmasi. Kata sandi tidak pernah dikembalikan API.

Aturan keamanan ditegakkan di backend (`UsersService`), bukan hanya disembunyikan di UI: Super Admin tidak bisa menonaktifkan, menghapus, atau mengubah peran akunnya sendiri; harus selalu tersisa minimal satu Super Admin aktif; email harus unik (tanpa membedakan huruf besar/kecil); dan akun yang sudah punya riwayat aktivitas tidak boleh dihapus.

## Sub-fitur
- **Tambah akun** — `POST /admin/users`: nama, email, peran, kata sandi awal (8–72 karakter, di-hash bcrypt). Email dinormalisasi ke huruf kecil; duplikat → `409`.
- **Ubah akun** — `PATCH /admin/users/:id`: nama, email, peran, status aktif. Untuk akun sendiri, peran dan status aktif dikunci (`400`). Menurunkan/menonaktifkan Super Admin aktif terakhir ditolak (`400`, "Harus ada minimal satu Super Admin aktif").
- **Nonaktifkan** — mengeset `users.is_active = false`. Akun nonaktif ditolak saat login (`401`, "Akun dinonaktifkan. Hubungi Super Admin.", dicek setelah password cocok) dan pada **setiap request** berikutnya lewat `JwtStrategy.validate()`, jadi token yang masih berlaku langsung tidak berguna. Akun bisa diaktifkan kembali.
- **Reset kata sandi** — `PATCH /admin/users/:id/password`: Super Admin menetapkan kata sandi baru (8–72 karakter) untuk akun mana pun.
- **Hapus akun** — `DELETE /admin/users/:id`: hanya bila akun tidak punya riwayat (reservasi yang dibuat, pembayaran yang dicatat, edit reservasi, tipe unit yang dibuat, section/item konten yang diubah). Kalau punya riwayat → `409` dengan saran menonaktifkan saja. Tombol hapus akun sendiri disabled.
- **Indikator "Anda"** — baris akun yang sedang login ditandai dan diberi catatan bahwa peran/status/hapus tidak bisa diubah sendiri.

## Keputusan Desain Penting
Hapus hanya untuk akun tanpa riwayat karena `Reservation.createdBy`, `Payment.recordedBy`, dan relasi audit lain merujuk ke `users`; menghapus pengguna yang sudah beraktivitas akan merusak jejak audit. Untuk kasus itu disediakan nonaktifkan, yang menutup akses tanpa menghilangkan jejak.

Status aktif dicek di dua tempat (login dan tiap request) karena JWT berlaku sampai kedaluwarsa; tanpa cek per-request, akun yang baru dinonaktifkan masih bisa memakai token lama.

## Terhubung ke
- `GET/POST /admin/users`, `PATCH /admin/users/:id`, `PATCH /admin/users/:id/password`, `DELETE /admin/users/:id`
- Tabel `users` (kolom `is_active`, `updated_at`)
- `backend/src/auth/auth.service.ts` & `jwt.strategy.ts` (cek `isActive`)
- Navigasi: grup "Sistem" di `SuperAdminLayout`; lihat juga `fitur-login-rbac.md`
