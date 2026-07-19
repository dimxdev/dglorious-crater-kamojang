# TASK.md — Checklist Pengerjaan

Urutan task dari nol sampai siap deploy. Kerjakan **berurutan dari atas ke bawah** — banyak task bergantung pada task sebelumnya.

Baca `PROJECT.md` dulu sebelum mulai. Centang `[x]` setiap task yang selesai.

---

## FASE 0 — Setup Awal

- [x] Inisialisasi monorepo: folder `frontend/` dan `backend/`, `.gitignore`, `README.md`
- [x] Setup NestJS di `backend/` (TypeScript, struktur module)
- [x] Setup Next.js App Router + TypeScript + Tailwind di `frontend/`
- [x] Install & konfigurasi Prisma + koneksi PostgreSQL lokal
- [x] Buat file `.env.example` di FE & BE (jangan commit `.env` asli)
- [x] Setup ESLint + Prettier di kedua folder
- [x] Verifikasi: `npm run dev` jalan di FE & BE tanpa error

---

## FASE 1 — Database & Model

- [ ] Tulis `schema.prisma` lengkap sesuai bagian 10 di `PROJECT.md`
- [ ] Definisikan enum: `BookingStatus`, `BookingSource`, `PaymentMethod`, `PaymentStatus`, `Role`
- [ ] Jalankan migrasi pertama
- [ ] Buat seeder: roles (`SUPER_ADMIN`, `OWNER`, `ADMIN_PENGINAPAN`) + 1 user per role
- [ ] Buat seeder dummy: 3 tipe penginapan + terjemahan ID/EN + unit fisik + gambar
- [ ] Verifikasi data masuk dengan Prisma Studio

---

## FASE 2 — Autentikasi & RBAC (Backend)

- [ ] Module `auth`: login endpoint, hash password (bcrypt), generate JWT
- [ ] JWT strategy + `JwtAuthGuard`
- [ ] Buat `@Roles()` decorator + `RolesGuard`
- [ ] Terapkan guard ke endpoint contoh, uji: role salah → 403
- [ ] Endpoint `GET /auth/me` (profil user + role + permissions)
- [ ] Refresh token (opsional, jika waktu cukup)

**Kriteria selesai:** Admin penginapan yang login TIDAK bisa mengakses endpoint milik role lain, walau memaksa lewat Postman.

---

## FASE 3 — Import Desain & Design System (Frontend)

- [ ] Import desain via MCP `claude_design`:
  - Server: `https://api.anthropic.com/v1/design/mcp` (auth via `/design-login`)
  - Project: `https://claude.ai/design/p/a0d2c309-b4ef-491d-8b56-74fa0a0be3ef?file=DGlorious+Crater+Kamojang.dc.html`
  - File: `DGlorious Crater Kamojang.dc.html`
- [ ] Ekstrak design token ke `tailwind.config.js`: warna (hijau hutan `#1B4332`, krem `#F5F0E6`, terakota `#C1663F`), font (serif heading + sans body), spacing
- [ ] Setup font via `next/font`
- [ ] Bangun komponen dasar: `Button`, `Card`, `Input`, `Select`, `Badge`, `Modal`, `Table`, `DatePicker`
- [ ] Bangun layout: `PublicLayout` (navbar + footer) dan `DashboardLayout` (sidebar + header)
- [ ] Setup i18n: file `id.json`, `en.json`, `zh.json` + language switcher (fallback ke ID)

**Catatan:** kerjakan halaman satu per satu, jangan generate semua sekaligus.

---

## FASE 4 — Modul Penginapan (CMS)

### Backend
- [ ] CRUD `room_types` (+ relasi translations dalam satu transaksi)
- [ ] CRUD `room_units`
- [ ] Upload gambar + manajemen galeri (`is_cover`, `sort_order`)
- [ ] Endpoint publik: list & detail penginapan (dengan fallback bahasa)
- [ ] **Fungsi cek ketersediaan** — satu fungsi reusable, dipakai booking online & manual
- [ ] Soft delete + `created_by` di setiap perubahan

### Frontend — Admin
- [ ] Halaman `/admin/penginapan/kelola`: tabel + tombol tambah
- [ ] Form tambah/edit dengan **tab bahasa ID / EN / 中文**
  - Field multi-bahasa: nama, deskripsi, fasilitas, aturan
  - Field universal: harga, kapasitas, jumlah unit, jam check-in/out, status aktif
  - Catatan: "Tab ID wajib. Jika EN/中文 kosong, tampil versi Indonesia."
- [ ] Upload galeri (grid thumbnail + tandai cover)

### Frontend — Publik
- [ ] Halaman `/` (homepage)
- [ ] Halaman `/tentang`
- [ ] Halaman `/penginapan` (listing + filter tanggal)
- [ ] Halaman `/penginapan/[slug]` (detail + widget booking, tanggal penuh disabled)

---

## FASE 5 — Booking Online + Midtrans

### Backend
- [ ] Generator `booking_code` acak (format `DGC-XXXXXX`, cek unik)
- [ ] `POST /bookings` — guest checkout, simpan status `PENDING`, kunci tanggal
- [ ] Validasi ketersediaan (pakai fungsi FASE 4) + cegah race condition
- [ ] Snapshot harga ke `price_snapshot`
- [ ] Integrasi Midtrans Snap (**sandbox**): generate token transaksi
- [ ] **Webhook handler** `POST /payments/midtrans/notification`
  - Verifikasi signature key — WAJIB
  - Update status: `PAID` → `CONFIRMED`
  - Idempotent (webhook bisa masuk berkali-kali, jangan dobel proses)
- [ ] Cron job auto-expire: booking `PENDING` lewat batas waktu → `EXPIRED`, lepas kunci tanggal
- [ ] `GET /bookings/:code` — verifikasi kode + no. WA

### Frontend
- [ ] Halaman `/booking` — form guest checkout (nama, WA, email wajib, tanggal, jumlah tamu)
- [ ] Integrasi Midtrans Snap popup
- [ ] Halaman `/cek-booking` — form kode + no. WA
- [ ] Halaman `/booking/[kode]` — **adaptif per status**:
  - Belum bayar → tombol lanjut bayar + countdown
  - `CONFIRMED` → tiket digital + unduh PDF
  - `EXPIRED` → pesan kadaluarsa + booking ulang
  - `COMPLETED` → terima kasih + pesan lagi
- [ ] Link "Cek Booking" di navbar (global)
- [ ] Banner localStorage di homepage jika ada booking belum dibayar (opsional)

---

## FASE 6 — Email & Notifikasi

- [ ] Setup Nodemailer + SMTP (Gmail App Password untuk fase KP)
- [ ] Kirim email lewat **queue/async** — jangan blokir request booking
- [ ] Template email #1: booking dibuat (kode + instruksi + link ke `/booking/[kode]`)
- [ ] Template email #2: pembayaran sukses (tiket PDF terlampir + link)
- [ ] Template email #3: pengingat sebelum expired (opsional)
- [ ] Notifikasi Telegram bot ke admin saat ada booking baru (opsional)
- [ ] Retry jika pengiriman gagal

---

## FASE 7 — Tiket & Check-in

- [ ] Fungsi generate tiket — **di-trigger oleh perubahan status ke `CONFIRMED`**, bukan dari tombol admin
- [ ] Generate PDF (kode besar, QR berisi `booking_code`, detail penginapan, nama tamu, tanggal)
- [ ] Simpan `qr_url` & `pdf_url` ke tabel `tickets`
- [ ] Endpoint unduh PDF (verifikasi kode + no. WA)
- [ ] Backend: `POST /bookings/:code/checkin` — validasi status, tolak jika sudah `CHECKED_IN`/`COMPLETED`
- [ ] Frontend `/admin/penginapan/checkin`: input kode → tampil detail → tombol check-in
- [ ] Tampilkan error jelas: "Tiket sudah digunakan pada [waktu]"

---

## FASE 8 — Booking Manual (Walk-in)

- [ ] Backend: endpoint booking manual (`booking_source = WALK_IN`, `created_by = admin`)
- [ ] Status langsung `CONFIRMED`, catat metode bayar & nominal
- [ ] Email opsional (walk-in boleh tanpa email)
- [ ] Pakai fungsi cek ketersediaan yang sama — cegah bentrok dengan booking online
- [ ] Frontend `/admin/penginapan/booking-manual`: form + indikator ketersediaan real-time
- [ ] Verifikasi: tiket tetap ter-generate otomatis untuk walk-in

---

## FASE 9 — Dashboard Admin Penginapan

- [ ] Halaman login (`/login`) — satu untuk semua role, redirect sesuai role
- [ ] `/admin/penginapan` — 4 stat card (booking hari ini, menunggu konfirmasi, okupansi, pendapatan bulan ini)
- [ ] Tabel booking terbaru + kalender okupansi bulanan
- [ ] `/admin/penginapan/booking` — tabel lengkap:
  - Kolom: kode, nama, WA, tipe, check-in/out, sumber (badge Online/Walk-in), total, status, aksi
  - Badge status berwarna sesuai enum
  - Filter: rentang tanggal, status, sumber; search kode/nama
  - Modal detail saat baris diklik
- [ ] Proteksi semua route dashboard sesuai role

---

## FASE 10 — Dashboard Owner

- [ ] `/owner` — akses eksklusif `OWNER` + `SUPER_ADMIN`
- [ ] Filter rentang tanggal (hari ini / minggu ini / bulan ini / custom)
- [ ] 4 stat card + indikator naik/turun vs periode sebelumnya
- [ ] Grafik garis: tren pendapatan 6 bulan
- [ ] Grafik batang: pendapatan per unit bisnis (Tiket & Cafe → label "Belum aktif")
- [ ] Donut: proporsi booking per tipe penginapan
- [ ] Donut: perbandingan Online vs Walk-in
- [ ] Tabel 10 transaksi terbaru
- [ ] Export laporan (PDF/Excel)
- [ ] Menu sidebar "Tiket Masuk" & "Cafe" dengan badge **Coming Soon**

---

## FASE 11 — QA & Polish

- [ ] Uji alur booking online end-to-end (sandbox Midtrans sampai tiket terkirim)
- [ ] Uji alur walk-in end-to-end
- [ ] Uji anti double-booking: dua booking bersamaan untuk tanggal & unit sama
- [ ] Uji tiket dipakai dua kali → harus ditolak
- [ ] Uji auto-expire (percepat timer untuk testing)
- [ ] Uji RBAC seluruh role (termasuk paksa akses lewat Postman)
- [ ] Uji fallback bahasa (kosongkan EN/中文, pastikan tampil ID)
- [ ] Uji responsif: mobile & desktop, semua halaman
- [ ] Perbaiki bug yang ditemukan
- [ ] Loading state & error handling di semua form
- [ ] SEO dasar halaman publik: meta tag, Open Graph, sitemap

---

## FASE 12 — Deployment

- [ ] Buat `Dockerfile` untuk backend & frontend
- [ ] Buat `docker-compose.yml` (FE + BE + PostgreSQL + Nginx)
- [ ] Konfigurasi Nginx: `dglorious.com` → FE, `api.dglorious.com` → BE
- [ ] Setup VPS: user non-root, firewall, update sistem
- [ ] Deploy: clone repo → set `.env` production → `docker compose up`
- [ ] Pasang SSL Let's Encrypt (auto-renew)
- [ ] Setup CORS: backend hanya izinkan domain frontend
- [ ] **Backup database otomatis** (cron harian + simpan di luar server)
- [ ] Uji seluruh alur di server production
- [ ] Tulis dokumentasi penggunaan untuk klien (panduan + video)
- [ ] Serah terima: akses domain, VPS, dan akun ke pihak D'Glorious

---

## Yang TIDAK Dikerjakan di Fase Ini

Struktur data sudah disiapkan, tapi implementasinya fase berikutnya:

- Sistem tiket masuk / portal pengunjung (`ADMIN_PORTAL`)
- Sistem transaksi & stok cafe (`ADMIN_CAFFE`)
- Scanner QR untuk check-in (fase 1 pakai input kode manual)
- Midtrans **production** (butuh dokumen usaha klien)
- WhatsApp API otomatis (fase 1 pakai link `wa.me` manual)
- Akun/membership untuk tamu
