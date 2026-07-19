# PROJECT.md — D'Glorious Crater Kamojang

Konteks proyek untuk Claude Code. Baca file ini sebelum mengerjakan task apa pun.

---

## 1. Ringkasan

Sistem informasi & reservasi untuk destinasi wisata **D'Glorious Crater Kamojang** (kawah geothermal, pemandian air panas, glamping) di perbatasan Kabupaten Bandung–Garut, Jawa Barat.

**Fase 1 (fokus saat ini):** company profile + modul penginapan (booking online & walk-in, dashboard admin penginapan, dashboard owner).

**Fase berikutnya (belum dikerjakan, tapi struktur data harus siap):** sistem tiket masuk (portal) dan sistem transaksi cafe.

**Konteks:** proyek Kerja Praktik, dikerjakan 2 orang (Dimas & Ihsan) selama 5 minggu (20 Juli – 23 Agustus 2026). Setelah KP, kemungkinan dirawat solo oleh Dimas.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + RBAC (guards & decorator NestJS) |
| Payment | Midtrans Snap (mode **sandbox** selama KP) |
| Email | Nodemailer (SMTP), dikirim lewat queue/async |
| i18n | 3 bahasa: Indonesia (ID), Inggris (EN), Mandarin (中文) |
| Deployment | 1 VPS (FE + BE + PostgreSQL), Nginx reverse proxy, SSL Let's Encrypt, docker-compose |

---

## 3. Struktur Repo (Monorepo)

```
dglorious/
├── frontend/            # Next.js — HANYA presentasi, fetch ke API NestJS
├── backend/             # NestJS — semua logika bisnis & satu-satunya sumber kebenaran
├── docker-compose.yml   # FE + BE + PostgreSQL + Nginx (dibuat menjelang deploy)
├── nginx/               # konfigurasi reverse proxy
├── PROJECT.md
├── TASK.md
└── README.md
```

---

## 4. Aturan Arsitektur (WAJIB dipatuhi)

1. **Backend adalah satu-satunya sumber kebenaran.** Jangan taruh logika bisnis di Next.js API routes. Frontend murni fetch ke API NestJS.
2. **Validasi role WAJIB di backend.** Menyembunyikan menu di frontend hanya untuk UX, bukan keamanan. Setiap endpoint terproteksi wajib pakai guard + decorator role.
3. **Satu sistem login untuk semua role** (bukan login terpisah per admin). Pembedaan akses lewat RBAC.
4. **Tamu TIDAK punya akun.** Booking pakai guest checkout + kode booking. Tidak ada halaman register/login untuk pengunjung.
5. **Status pembayaran hanya boleh diubah oleh webhook Midtrans yang signature-nya sudah diverifikasi.** Jangan percaya status sukses yang datang dari frontend.
6. **Generate tiket di-trigger oleh perubahan status ke `CONFIRMED`**, bukan ditanam di dalam tombol admin. Ini supaya booking online (webhook) dan walk-in (admin) sama-sama otomatis menghasilkan tiket.
7. **Harga di-snapshot ke tabel booking** (`price_snapshot`). Perubahan harga di master penginapan tidak boleh mengubah nilai booking lama.
8. **Semua data harus analytics-ready:** timestamp lengkap di setiap transisi status, enum konsisten, soft delete, `created_by` untuk jejak audit.
9. **Cek ketersediaan harus satu fungsi yang dipakai bersama** oleh booking online dan booking manual/walk-in, agar tidak ada celah double-booking.
10. **Environment variable untuk semua konfigurasi** (URL API, kredensial DB, key Midtrans, SMTP). Jangan hardcode.

---

## 5. Role & Hak Akses (RBAC)

| Role | Akses |
|---|---|
| `SUPER_ADMIN` | Semua dashboard, CRUD penuh, + kelola akun & setting sistem |
| `OWNER` | Dashboard owner (eksklusif) + semua dashboard admin, CRUD penuh |
| `ADMIN_PENGINAPAN` | Hanya dashboard penginapan, CRUD penuh di area tersebut |
| `ADMIN_PORTAL` | *(fase 2)* Hanya dashboard tiket masuk |
| `ADMIN_CAFFE` | *(fase 3)* Hanya dashboard cafe |

**Aturan arah akses:** Owner & Super Admin bisa masuk "ke bawah" (dashboard admin). Admin **tidak bisa** naik ke dashboard owner. Dashboard owner hanya untuk `OWNER` dan `SUPER_ADMIN`.

---

## 6. Alur Booking

### 6.1 Booking Online (via Midtrans)

```
Tamu isi form (nama, WA, email wajib, tanggal, jumlah tamu)
  → sistem SIMPAN booking dulu (status PENDING, generate booking_code acak, kunci tanggal)
  → email #1 terkirim (kode + link ke /booking/[kode])
  → Midtrans Snap popup muncul di halaman yang sama
  → tamu bayar (QRIS / VA / e-wallet)
  → webhook Midtrans masuk ke backend → verifikasi signature → status jadi PAID → CONFIRMED
  → tiket (PDF + QR) ter-generate otomatis → email #2 terkirim
  → tamu datang → admin input kode di menu Check-in → status CHECKED_IN
  → setelah selesai menginap → status COMPLETED
```

Jika tamu tidak menyelesaikan pembayaran sampai batas waktu → status `EXPIRED`, tanggal yang dikunci dilepas kembali.

### 6.2 Booking Offline / Walk-in

```
Tamu datang langsung
  → admin input booking manual (nama + no. WA wajib, email opsional)
  → sistem cek ketersediaan (fungsi yang sama dengan booking online)
  → tamu bayar di tempat (cash / QRIS / transfer), admin catat metode & nominal
  → status langsung CONFIRMED → tiket ter-generate otomatis
  → check-in → COMPLETED
```

### 6.3 Status Booking (enum)

`PENDING` → `WAITING_PAYMENT` → `PAID` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED`

Cabang gagal: `EXPIRED` (tidak dibayar), `CANCELLED` / `REJECTED` (dibatalkan/ditolak).

---

## 7. Aturan Kode Booking & Tiket

- **Hanya ADA SATU kode per booking** (`booking_code`), dipakai untuk cek status maupun check-in. Bukan dua kode terpisah.
- Kode harus **acak dan sulit ditebak** (contoh format: `DGC-A7F3K2`). Jangan nomor urut.
- **Kode tidak pernah kadaluarsa.** Yang berubah adalah *status* booking. Tamu yang mengecek kode lama tetap melihat halaman yang sama, isinya menyesuaikan status.
- Akses halaman booking = **kode + no. WhatsApp** (verifikasi kedua agar orang tidak bisa mengintip booking orang lain hanya dengan menebak kode).
- **Pencegahan tiket dipakai dua kali dilakukan lewat status, bukan lewat kode.** Saat check-in, sistem cek status; jika sudah `CHECKED_IN`/`COMPLETED` → tolak dengan pesan "Tiket sudah digunakan pada [waktu]".
- Fase 1 check-in = **admin ketik kode manual** di dashboard (belum ada scanner QR). QR tetap dicetak di PDF untuk kesiapan fase berikutnya.

---

## 8. Halaman yang Dibutuhkan (Fase 1)

### Publik
- `/` — Homepage (hero, daya tarik, preview penginapan, info praktis)
- `/tentang` — Company profile (sejarah, galeri, fasilitas)
- `/penginapan` — Listing tipe penginapan + filter tanggal
- `/penginapan/[slug]` — Detail + widget booking (date picker, tanggal penuh ditandai)
- `/booking` — Form guest checkout → Midtrans Snap popup
- `/cek-booking` — Form input kode + no. WA
- `/booking/[kode]` — **Halaman adaptif** sesuai status:
  - Belum bayar → tombol "Lanjutkan Pembayaran" + countdown
  - `CONFIRMED` → tiket digital (kode besar + QR) + unduh PDF
  - `EXPIRED` → pesan kadaluarsa + tombol booking ulang
  - `COMPLETED` → ucapan terima kasih + tombol pesan lagi

### Admin & Owner
- `/login` — **satu halaman login** untuk semua role
- `/admin/penginapan` — Ringkasan (stat card, booking terbaru, kalender okupansi)
- `/admin/penginapan/booking` — Tabel data booking (filter status, sumber, tanggal; search)
- `/admin/penginapan/booking-manual` — Form booking walk-in
- `/admin/penginapan/checkin` — Input kode → detail → tombol check-in
- `/admin/penginapan/kelola` — CMS tipe penginapan (CRUD + tab bahasa + galeri)
- `/owner` — Dashboard owner (stat + grafik + rekap + export laporan)

---

## 9. Multi-bahasa (i18n)

**Dua lapis terpisah:**

1. **Teks UI** (label, tombol, menu) → file JSON per bahasa (`id.json`, `en.json`, `zh.json`).
2. **Konten dinamis** (nama & deskripsi penginapan) → tabel `room_type_translations` di database, diisi admin lewat **tab bahasa** di form CMS.

**Aturan:**
- Tab **ID wajib** diisi. EN & 中文 opsional.
- **Fallback:** jika terjemahan kosong, tampilkan versi Indonesia. Jangan pernah tampilkan field kosong.
- Jangan bikin kolom `name_id`, `name_en`, `name_zh` di satu tabel — gunakan tabel translations agar mudah menambah bahasa baru.

---

## 10. Skema Database (Fase 1)

Tabel inti:

- **`roles`** — id, name, permissions (JSON)
- **`users`** — id, role_id, name, email, password, created_at
- **`room_types`** — id, slug, price_per_night, capacity, total_units, facilities (JSON), is_active, created_by, created_at, deleted_at
- **`room_type_translations`** — id, room_type_id, language_code, name, description, facilities_text, rules
- **`room_images`** — id, room_type_id, image_url, is_cover, sort_order
- **`room_units`** — id, room_type_id, unit_code, status
- **`bookings`** — id, booking_code (unik, acak), room_type_id, room_unit_id, guest_name, guest_phone, guest_email (nullable untuk walk-in), check_in, check_out, total_guests, price_snapshot, status (enum), booking_source (enum: `ONLINE` / `WALK_IN`), created_by (nullable), created_at, expired_at, paid_at, confirmed_at, checked_in_at, completed_at
- **`payments`** — id, booking_id, method, amount, proof_url (nullable), midtrans_order_id (nullable), status, paid_at, verified_by (nullable)
- **`tickets`** — id, booking_id, qr_url, pdf_url, issued_at

**Catatan:** `id` internal boleh auto-increment, tapi `booking_code` yang dilihat publik **wajib acak**.

---

## 11. Hal yang Masih Perlu Dikonfirmasi ke Klien

Jangan diasumsikan — tanyakan ke pihak D'Glorious:

- [ ] Nama & harga asli 3 tipe penginapan
- [ ] Harga flat atau beda weekday/weekend/high-season?
- [ ] DP atau harus lunas?
- [ ] Batas waktu pembayaran (default sementara: 1×24 jam)
- [ ] Jam check-in / check-out
- [ ] Apakah perlu mencatat no. identitas/KTP tamu?
- [ ] Jam operasional layanan konfirmasi

---

## 12. Catatan Deployment

- Semua di **1 VPS**: Next.js + NestJS + PostgreSQL, diatur **Nginx** (`dglorious.com` → FE, `api.dglorious.com` → BE).
- SSL gratis via **Let's Encrypt**.
- **Docker/docker-compose dikerjakan menjelang deploy**, bukan saat masih mengembangkan fitur.
- Domain & VPS **atas nama pihak D'Glorious**, bukan akun pribadi developer.
- Akun Midtrans **production** butuh dokumen usaha klien — selama KP gunakan **sandbox**.
- **Wajib disiapkan sebelum go-live:** backup database otomatis + hardening dasar server (firewall, non-root user, update rutin).

---

## 13. Konvensi Kode

- Bahasa kode & komentar: **Inggris**. Teks UI: **Indonesia** (via i18n).
- Penamaan: `camelCase` (variabel/fungsi), `PascalCase` (komponen & class), `snake_case` (kolom database).
- Setiap endpoint terproteksi wajib: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`.
- DTO + `class-validator` untuk semua input di NestJS.
- Commit message: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
