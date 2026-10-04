# PROJECT.md — D'Glorious Crater Kamojang

Konteks proyek untuk Claude Code. Baca file ini sebelum mengerjakan task apa pun.

> **⚠️ Penamaan.** "FASE" (FASE 0, 1, 2, ... di TASK.md) = urutan kerja pengembangan.

> **⚠️ Ruang lingkup sistem (hasil data gathering + form booking asli klien).**
> Sistem = **company profile / katalog publik + pencatatan booking internal oleh admin**.
> Admin **hanya menginput booking yang SUDAH FIX** (negosiasi harga & aturan DP/pelunasan
> terjadi di WhatsApp, **di luar sistem**). Sistem **tidak** menyediakan booking online
> mandiri, payment gateway, email otomatis, tiket PDF/QR, sistem tiket masuk, maupun
> sistem cafe.

---

## 1. Ringkasan

Sistem informasi & reservasi untuk destinasi wisata **D'Glorious Crater Kamojang** (kawah geothermal, pemandian air panas, glamping) di perbatasan Kabupaten Bandung–Garut, Jawa Barat.

**Cakupan:**
- **Katalog/company profile publik** — brosur digital: etalase tiap unit (foto, kapasitas, harga) + info + Syarat & Ketentuan. **Tanpa booking online**; CTA cukup **"Hubungi Reservasi via WhatsApp"**.
- **Pencatatan booking internal oleh admin** — tamu menghubungi admin lewat WhatsApp, deal disepakati di sana, lalu **admin menginput booking yang sudah fix** di dashboard.
- **Dashboard admin penginapan** (data booking, tambah booking, edit booking, check-in, CMS unit).
- **Dashboard owner** (statistik & rekap) dan **hub Super Admin**.

**Konteks:** proyek Kerja Praktik, 2 orang (Dimas & Ihsan), 5 minggu (20 Juli – 23 Agustus 2026).

**Tema visual:** **hijau** (alam/hutan), **biru** (air/kolam air panas), **oranye** (geothermal/hangat). *(Palet earthy/terakota lama tidak dipakai.)*

**Istilah:** klien menyebut unit sebagai **"Tenda"** dan **"Villa"** (bukan "kamar/penginapan"). Pakai istilah klien di UI admin & publik. Nama entitas database tetap netral (`room_types`), tapi **label tampilan pakai "Tenda"/"Villa"**.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + RBAC (guards & decorator NestJS) |
| i18n | Indonesia (ID) + Inggris (EN). Struktur multi-bahasa sejak awal (UI via file JSON, konten tenda via tabel translations). |
| Pembayaran | Di luar sistem (transfer/tunai/QRIS); admin hanya mencatat DP/lunas. |
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

1. **Backend adalah satu-satunya sumber kebenaran.** Frontend murni fetch ke API NestJS; jangan taruh logika bisnis di Next.js API routes.
2. **Validasi role WAJIB di backend.** Menyembunyikan menu di frontend hanya untuk UX. Setiap endpoint terproteksi wajib guard + decorator role.
3. **Satu sistem login untuk semua role.** Pembedaan akses lewat RBAC.
4. **Tamu TIDAK punya akun.** Tidak ada register/login pengunjung. Tamu tidak bertransaksi mandiri — semua booking diinput admin.
5. **Harga di-snapshot ke booking** (`price_snapshot`). Perubahan/variasi tarif di master tidak boleh mengubah booking lama. Makin penting karena tarif **beda weekday/weekend** dan bisa **di-override manual** admin (nego).
6. **Semua konfigurasi yang bisa berubah disimpan di tabel `settings`, JANGAN hardcode** (jam check-in/out, no. WhatsApp reservasi, kontak & sosial media, teks S&K).
7. **Semua data harus analytics-ready:** timestamp lengkap di setiap transisi status, enum konsisten, soft delete, `created_by` untuk jejak audit.
8. **Cek ketersediaan harus satu fungsi yang dipakai bersama** oleh semua jalur pembuatan booking (Booking WhatsApp, Walk-in, dan Edit Booking), agar tidak ada celah double-booking.
9. **Environment variable untuk kredensial & endpoint** (URL API, DB, JWT secret). *(Konfigurasi bisnis yang admin ubah → tabel `settings`, lihat poin 6.)*

---

## 5. Role & Hak Akses (RBAC)

> **Revisi 2026-08-21:** Sebelumnya `SUPER_ADMIN` juga diizinkan masuk ke dashboard Owner (dan guard-nya lolos semua `@Roles` tanpa syarat). Diperketat: `SUPER_ADMIN` sekarang punya hub navigasi sendiri (`/super-admin`, lihat `SuperAdminLayout.tsx`) ke dashboard **ADMIN**, tapi dashboard **Owner** jadi eksklusif `OWNER` — bukan lagi "yang di atas otomatis boleh". Ditegakkan di 2 lapis: frontend `useRequireRole()` (gak ada bypass blanket lagi, tiap layout wajib sebut role yang diizinkan eksplisit) dan backend `RolesGuard` (gak ada bypass `SUPER_ADMIN` implisit — harus disebut eksplisit di tiap `@Roles(...)`, walau di semua endpoint yang sudah ada saat ini memang selalu disertakan).

| Role | Akses |
|---|---|
| `SUPER_ADMIN` | Hub navigasi (`/super-admin`) + dashboard **admin** Penginapan, CRUD penuh. **Bukan** dashboard Owner. |
| `OWNER` | Dashboard owner (eksklusif — satu-satunya role yang boleh masuk) + dashboard admin, CRUD penuh |
| `ADMIN_PENGINAPAN` | Hanya dashboard penginapan, CRUD penuh di area tersebut |

**Aturan arah akses:** Owner bisa masuk "ke bawah" (dashboard admin). Super Admin juga bisa masuk ke dashboard admin, tapi **tidak** ke dashboard Owner — itu privat buat Owner sendiri. Admin **tidak bisa** naik ke dashboard manapun di atasnya (Owner maupun Super Admin).

---

## 6. Alur Booking

### 6.1 Pencatatan Internal oleh Admin

**Update 2026-07-26 (dari form reservasi WhatsApp resmi klien):** ada **dua jalur** pencatatan berbeda, dipisah jadi **dua menu sendiri** karena kondisi tamunya beda (belum tiba vs. sudah di lokasi):

**A. Menu "Booking WhatsApp"** (`/admin/penginapan/booking-whatsapp`) — tamu nego & isi form di WhatsApp dulu, belum tiba di lokasi:

```
Tamu menghubungi admin via WhatsApp (dari CTA di katalog publik)
  → staff kirim form reservasi (Nama, No. Telepon, Tipe & Jumlah Tenda,
     tanggal check-in/out, Dewasa, Anak-anak, Note/Request) + brosur & S&K
  → nego, DP 50% maks 1×24 jam setelah dealing → DISEPAKATI DI WHATSAPP (di luar sistem)
     (lewat 1×24 jam tanpa DP = booking rilis otomatis ke tamu lain — ini terjadi
     di WHATSAPP/kepala admin, BUKAN di sistem; sistem belum tahu apa-apa pada tahap ini)
  → admin buka menu "Booking WhatsApp", input booking yang SUDAH FIX
     (data tamu, tanggal, satu/lebih tenda, dewasa/anak, extra bed, catatan)
  → sistem cek ketersediaan (fungsi reusable) + auto-hitung total
     (tarif weekday/weekend per tenda × malam + extra bed); admin boleh OVERRIDE manual
  → booking tersimpan berstatus DP (DP sudah masuk, ini prasyarat sebelum dicatat)
  → dari menu Data Booking, admin tandai "Tandai Lunas" begitu pelunasan masuk → LUNAS
  → tamu datang → dari menu Data Booking juga, admin klik "Tandai Check-in" → CHECKED_IN
  → tanggal check-out lewat → status turunan otomatis jadi COMPLETED (bukan disimpan manual)
```

**B. Menu "Tamu Langsung / Walk-in"** (`/admin/penginapan/walk-in`) — tamu datang & pesan langsung di lokasi, bayar saat itu juga:

```
Tamu datang ke lokasi tanpa reservasi WhatsApp sebelumnya
  → admin buka menu "Tamu Langsung", input data (sama seperti di atas)
  → bayar di tempat (tunai/QRIS/transfer) → booking tersimpan langsung CHECKED_IN
     (skip DP/LUNAS — tamunya sudah di lokasi & sudah bayar penuh saat dicatat)
```

- `booking_source = MANUAL` untuk kedua jalur, `created_by = admin yang input`.
- Karena admin hanya menginput booking yang sudah fix, **sistem tidak pernah memegang booking menggantung** → **tidak ada auto-expire** (masa tunggu DP 1×24 jam sepenuhnya terjadi di WhatsApp, sebelum data masuk sistem).
- **Reschedule:** admin boleh mengubah tanggal booking lewat menu Edit Booking (setiap perubahan tercatat di riwayat edit beserta alasannya). Per S&K, reschedule paling lambat **H-7** sebelum check-in — aturan H-7 ini ditegakkan secara prosedural oleh admin, bukan validasi di sistem.

### 6.2 Status Booking

**Revisi 2026-07-26** — status pembayaran & status booking **digabung jadi satu progres tunggal**, bukan 2 field terpisah seperti draf sebelumnya (lebih cocok sama cara admin mikirin & mengedit statusnya langsung dari menu Data Booking):

```
DP → LUNAS → CHECKED_IN → COMPLETED
```

**Revisi lanjutan (sama hari)** — status `CANCELLED` terpisah **dihapus**, digabung jadi satu konsep dengan `HANGUS`: dari sisi bisnis, dibatalkan manual & tidak pernah datang **sama-sama berarti "uang hangus, booking tidak jadi"** (S&K poin 5) — jadi cukup satu status, bukan dua. **Ditambah 1 status turunan baru: `NO_SHOW`** ("Tidak Datang") — dipisah dari `HANGUS` karena beda kondisi bisnisnya (lihat rincian di bawah).

**Revisi lanjutan lagi (sama hari)** — satu tenggat yang **sama** dipakai untuk ketiga status turunan: **tanggal check-out**, bukan check-in. Baik `DP` maupun `LUNAS` dikasih toleransi penuh selama rentang menginapnya (siapa tahu tamu masih datang kapan pun sebelum checkout) — cuma beda label akhirnya tergantung sudah lunas atau belum saat checkout lewat.

Cabang & status turunan (dihitung ulang tiap kali data booking dibuka, **bukan cron job** — sistem tidak butuh proses background — bandingkan tanggal hari ini vs `check_out`):
- `HANGUS` — **bisa disimpan manual** (admin batalkan booking kapan saja sebelum check-in) **ATAU dihitung otomatis**: booking masih `DP` (belum lunas) dan tanggal **check-out** sudah lewat tanpa pernah check-in — dianggap batal, uang hangus.
- `NO_SHOW` — **status turunan murni, tidak pernah disimpan manual**: booking sudah `LUNAS` (bayar penuh) tapi tanggal **check-out** sudah lewat tanpa pernah check-in — uangnya aman, cuma tamunya yang tidak muncul.
- `COMPLETED` — **status turunan**: booking `CHECKED_IN` dan tanggal `check_out` **sudah lewat** — dihitung dengan cara yang sama, bukan diset manual admin.

Alur utama yang diubah admin: `DP` → `LUNAS` → `CHECKED_IN`, dengan cabang `HANGUS`. `COMPLETED` dan `NO_SHOW` umumnya muncul otomatis dari tanggal check-out, tapi admin juga boleh menandainya langsung dari detail booking. **Walk-in mulai langsung dari `CHECKED_IN`** (skip `DP`/`LUNAS` — sudah bayar penuh & sudah di lokasi saat dicatat, lihat §6.1 jalur B).

**Semua perubahan status dilakukan langsung dari menu Data Booking** (klik baris → detail → tombol "Tandai Lunas" / "Tandai Check-in" / "Tandai Hangus" / "Edit Tanggal") — **bukan menu Check-in terpisah**. Menu Check-in (ketik kode → verifikasi) **dihapus**: fungsinya jadi duplikat begitu status bisa diubah langsung dari baris booking yang sudah kelihatan di tabel — tidak ada tamu yang mengakses sistem sendiri, jadi tidak ada yang perlu "diverifikasi" pakai kode.

**Dampak ke skema database (§10):** status pembayaran & status booking disatukan jadi **satu enum** `BookingStatus` = `DP | LUNAS | CHECKED_IN | HANGUS | COMPLETED | NO_SHOW` (tanpa kolom `payment_status` terpisah). Tidak ada proses yang mengubah data secara otomatis di latar belakang — status turunan hanya dihitung saat data dibaca.

---

## 7. Aturan Kode Booking & Check-in

- **Satu kode per booking** (`booking_code`), acak & sulit ditebak (contoh: `DGC-A7F3K2`). Jangan nomor urut.
- **Kode tidak pernah kadaluarsa** — yang berubah adalah *status* booking.
- `booking_code` = **referensi internal saja** (identifikasi baris di Data Booking, dicantumkan di WA konfirmasi). **Bukan tiket yang diverifikasi tamu sendiri** — tidak ada menu "ketik kode" terpisah (dihapus 2026-07-26, lihat §6.2): admin sudah melihat & mengklik langsung baris booking yang bersangkutan di menu Data Booking untuk ubah status ke `CHECKED_IN`.
- **Pencegahan status berubah dua kali cukup lewat guard tombol di UI** (tombol "Tandai Check-in" cuma tampil kalau status masih `LUNAS`; begitu jadi `CHECKED_IN` tombolnya hilang) — bukan lewat pencarian kode seperti rencana lama.

---

## 8. Halaman yang Dibutuhkan

### Publik — Katalog / Company Profile (etalase, TANPA booking online)
- `/` — Homepage (hero, daya tarik, preview tenda, info praktis)
- `/tentang` — Company profile (sejarah, galeri, fasilitas)
- `/penginapan` — Katalog/brosur digital tenda & villa (foto, kapasitas, harga weekday/weekend)
- `/penginapan/[slug]` — Detail unit. **CTA = "Hubungi Reservasi via WhatsApp"** (bukan booking online)
- `/syarat-ketentuan` — Halaman Syarat & Ketentuan (12 poin, teks dari `settings`)

### Admin, Owner & Super Admin
- `/login` — **satu halaman login** untuk semua role
- `/admin/penginapan` — Ringkasan (stat, booking terbaru, kalender okupansi)
- `/admin/penginapan/booking` — Tabel data booking (filter status, sumber; search nama/kode/WA) — **juga tempat ubah status** (Tandai Lunas/Check-in/Batalkan/Edit Tanggal langsung dari detail baris, lihat §6.2). Menu Check-in terpisah **dihapus 2026-07-26**, fungsinya dilebur ke sini.
- `/admin/penginapan/booking-whatsapp` — **Menu inti, jalur A** (lihat §8.1) — booking sudah dealing di WhatsApp, tamu belum tiba, mulai dari status `DP`
- `/admin/penginapan/walk-in` — **Menu inti, jalur B** (lihat §8.1) — tamu datang & pesan langsung di lokasi, bayar saat itu juga (langsung `CHECKED_IN`, skip `DP`/`LUNAS`)
- `/admin/penginapan/kelola` — CMS tenda (CRUD + tab bahasa + galeri)
- `/owner` — Dashboard owner (stat + grafik + rekap + export) — **eksklusif `OWNER`** (§5, revisi 2026-08-21), data dari API booking & tipe unit
- `/owner/penginapan` — Analitik khusus penginapan (performa per tipe, sebaran sumber booking)
- `/super-admin` — Hub navigasi Super Admin ke dashboard admin

### 8.1 Form "Booking WhatsApp" & "Tamu Langsung" (fitur inti)

Field sama untuk kedua menu (mengikuti form reservasi WhatsApp resmi klien), bedanya cuma default status pembayaran & status check-in saat disimpan (lihat §6.1):

- **Nama lengkap** — wajib
- **No. telepon/WhatsApp** — wajib
- **Tipe & jumlah tenda** — wajib; **bisa pilih lebih dari satu tenda** (satu booking bisa mencakup beberapa unit)
- **Tanggal check-in** — wajib
- **Tanggal check-out** — wajib
- **Jumlah Dewasa** — angka
- **Jumlah Anak-anak** — angka
- **Extra bed** — jumlah + tarif (ikut ke total)
- **Note / Request** — opsional
- **Status saat disimpan** — `DP` atau `LUNAS` (Booking WhatsApp, admin pilih sesuai kondisi saat itu) *(status gabungan, lihat §6.2 — bukan lagi field `payment_status` terpisah)*
- **Harga total** — auto-hitung (tarif tenda sesuai tanggal × malam + extra bed) dengan **opsi override manual** (nego)
- Otomatis: `created_by = admin`, `booking_source = MANUAL`

> **Update 2026-08-04:** field **Foto KTP** (upload opsional, kolom `ktp_photo_url`) **dihapus total** — bukan cuma dari form, kolomnya juga dihapus dari skema (`Booking`) lewat migrasi FASE 7. Keputusan: admin sudah menerima foto KTP secara manual lewat chat WhatsApp saat nego (S&K poin 10 tetap berlaku, prosesnya di luar sistem), jadi tidak perlu disimpan lagi di sistem — mengurangi kerumitan form tanpa mengorbankan kebutuhan bisnis.

**Beda default antar menu (§6.2):**
- **Booking WhatsApp** — status default `DP` (DP sudah masuk, itu prasyarat sebelum dicatat), lanjut ke `LUNAS` → `CHECKED_IN` lewat menu Data Booking saat tamu tiba.
- **Tamu Langsung** — status langsung `CHECKED_IN` (dibayar penuh tunai/QRIS/transfer di tempat, tamunya sudah di lokasi saat dicatat) — skip `DP`/`LUNAS` sepenuhnya.

### 8.2 Logika Kapasitas & Anak (aturan bisnis klien — validasi form)

Menegakkan S&K poin 7 & 8:

- Anak umur **≥ 6 tahun** dihitung sebagai **1 dewasa**.
- Anak umur **< 5 tahun** **tidak dihitung**.
- **Orang efektif** = jumlah dewasa + jumlah anak ≥ 6; bandingkan dengan kapasitas tenda.
- Jika **melebihi kapasitas** → tampilkan peringatan: perlu **extra bed / charge person / ganti tipe tenda lebih besar**.
- Sistem cukup menyediakan field **"Anak-anak"** + tampilkan **catatan aturan ini di UI**. **Jangan over-engineer** penghitungan umur otomatis kecuali mudah (klien tidak memisahkan usia 5 vs 6 secara rinci di form).

### 8.3 Setting Global (tabel `settings`, JANGAN hardcode)

- **Jam check-in `14.00` & check-out `12.00`** — tampil di detail tenda
- **Nomor WhatsApp reservasi (2 nomor)** — dipakai CTA publik, tombol mengambang, dan footer
- **Email kontak & tautan sosial media** (Instagram, TikTok, Facebook) — tampil di footer
- **Teks Syarat & Ketentuan (12 poin, ID & EN)** — tampil di halaman publik

Nilai ini dibaca lewat `GET /settings`; perubahan dilakukan langsung di database (tidak ada UI edit).

---

## 9. Multi-bahasa (i18n)

**Dua lapis:**
1. **Teks UI** → file JSON per bahasa (`id.json`, `en.json`).
2. **Konten dinamis** (nama & deskripsi tenda) → tabel `room_type_translations`, diisi admin lewat **tab bahasa** di CMS.

**Aturan:**
- Sistem mendukung **2 bahasa: ID + EN**.
- Tab **ID wajib**. EN opsional. **Fallback ke Indonesia** jika terjemahan kosong.
- **JANGAN** kolom `name_id/name_en`, **jangan hardcode**, **jangan jadi 2 kolom** — tetap pakai tabel translations.

---

## 10. Skema Database

- **`roles`** — id, name, created_at
- **`users`** — id, role_id, name, email, password, created_at
- **`settings`** — id, key, value (teks), updated_at *(konfigurasi global §8.3)*
- **`room_types`** — id, slug, **`price_weekday`**, **`price_weekend`**, capacity, total_units, facilities (JSON), is_active, created_by, created_at, deleted_at
  - Harga **TIDAK flat**: minimal 2 tarif (weekday & weekend); sistem memilih tarif per tanggal menginap. Jam check-in/out **bukan** di sini — ambil dari `settings`. *(Tarif high-season = perlu konfirmasi klien, §11.)*
- **`room_type_translations`** — id, room_type_id, language_code (`ID`/`EN`), name, category, tagline, description, bed_info, bathroom_info, rules
- **`room_images`** — id, room_type_id, image_url, is_cover, sort_order
- **`bookings`** — id, booking_code (unik, acak), guest_name, guest_phone, check_in, check_out, **`price_snapshot`** (total dibekukan — **WAJIB**), **`is_price_override`** (bool), **`status`** (enum — `DP`/`LUNAS`/`CHECKED_IN`/`HANGUS`/`COMPLETED`/`NO_SHOW`; `COMPLETED`/`NO_SHOW`/`HANGUS` juga bisa dihitung otomatis dari tanggal saat data dibaca, lihat §6.2), booking_source (`MANUAL`), booking_channel (`WHATSAPP`/`WALK_IN`), notes (nullable), created_by, created_at, lunas_at, checked_in_at, hangus_at
- **`booking_items`** — id, booking_id, room_type_id, qty, subtotal_snapshot, **`adults`**, **`children`**, **`extra_bed_qty`** (default 0), **`extra_bed_type`** (nullable), **`extra_bed_price`** *(satu booking bisa mencakup beberapa tenda — dewasa/anak/extra-bed disimpan PER TENDA di sini, bukan di `bookings`, karena tiap tenda dalam satu booking bisa beda komposisi tamu. Keputusan 2026-08-04, FASE 7 — sebelumnya field-field ini ada di level `bookings`.)* — `ktp_photo_url` **dihapus total** dari skema (2026-08-04, bukan lagi disimpan sistem, lihat §8.1)
- **`payments`** — id, booking_id, method (`CASH`/`QRIS`/`BANK_TRANSFER`), amount, status (`PENDING`/`PAID`), paid_at, verified_by (nullable)

**Catatan:** `booking_code` yang dipakai sebagai referensi **wajib acak**.

---

## 11. Hal yang Masih Perlu Dikonfirmasi ke Klien

- [x] **Nama & jumlah tipe tenda/villa + harga weekday/weekend-nya** — **SUDAH didapat** dari "Pricelist Penginapan DGCK" (PDF resmi). Diinput ke seed database `backend/prisma/seed.ts` (6 unit real: Eagle Hill, Royal Kahuripan, Camp Jamuju, Camp Rasamala, Camp Cakrawala, Glorious Campervan — lengkap harga weekday/weekend, kapasitas, bed/bathroom info, tarif tambah orang dgn/tanpa ekstra bed). Lihat detail lengkap di bawah.
- [x] **Form reservasi WhatsApp resmi & 12 poin S&K — SUDAH didapat** (2026-07-26) dari klien, **menggantikan draft internal** sebelumnya. Field form: Nama Lengkap, Nomor Telepon, Tipe & Jumlah Tenda, Tanggal Check-in, Tanggal Check-out, Dewasa, Anak-anak, Note/Request — dipakai jadi field menu "Booking WhatsApp" (§8.1). 12 poin S&K resmi disimpan di tabel `settings` (key `terms_conditions_id`/`terms_conditions_en`, di-seed lewat `backend/prisma/seed.ts`), tampil di `/syarat-ketentuan`. **Temuan penting:** poin 1–2 mengungkap alur DP 50% maks 1×24 jam + auto-release ke tamu lain kalau lewat — tapi ini terjadi **sepenuhnya di WhatsApp/kepala admin**, sebelum booking dicatat ke sistem (lihat §6.1), jadi **tidak mengubah** keputusan "tidak ada auto-expire".
- [ ] **Definisi weekend** — Sabtu–Minggu saja, atau termasuk Jumat? *(Price list cuma bilang "Weekday"/"Weekend", belum eksplisit definisinya. Dipakai di `lib/pricing.ts` — asumsi sementara Sabtu–Minggu.)*
- [ ] **Tarif extra bed: per malam atau sekali bayar?** — price list cuma kasih satu angka per opsi (dgn/tanpa kasur), tidak jelas berlaku sekali untuk seluruh masa inap atau dikali jumlah malam. `lib/pricing.ts` (`extraBedRate`) **asumsi sementara: per malam**, disamakan dengan tarif sewa dasar yang jelas per malam.
- [ ] **Tarif high-season / libur nasional** (tarif ketiga) — price list cuma bilang *"Harga dapat berubah saat di High Season"*, belum ada angka pastinya.
- [ ] **Jumlah unit per tipe** — price list tidak mencantumkan jumlah unit fisik tiap tipe. Angka di `totalUnits` (seed) masih **ESTIMASI**, perlu dikonfirmasi.
- [ ] **Foto asli tiap unit** — price list ada fotonya (interior, kolam, dll) tapi belum bisa diekstrak jadi file gambar dari PDF; foto tiap unit saat ini berupa **ilustrasi buatan AI** (Google Gemini) sebagai pengganti sementara.
- [ ] Jam operasional layanan reservasi (WhatsApp)
- [ ] **⚠️ Jam operasional wisata — DUA sumber klien saling beda, perlu klarifikasi final:**
  - Sumber A (screenshot info singkat): Senin–Jumat 08.00–22.00 WIB, Sabtu–Minggu 07.00–22.00 WIB.
  - Sumber B (grafis "Operational Hour"): Weekday 07.00–22.00 WIB, **Weekend 24 Jam**, **Libur Nasional 24 Jam**.
  - **Keputusan interim yang dipakai di situs sekarang** (arahan user, belum final dari klien): Senin–Jumat 08.00–22.00 WIB, **Sabtu–Minggu 24 Jam** — kombinasi jam dari Sumber A + status 24-jam dari Sumber B. Cek `lib/data/content.ts` (`infoSources` → "Jam Buka").

*(Sudah terjawab: **DP 50% maks 1×24 jam / pelunasan manual di luar sistem** (bukan lunas di muka — lihat poin form WA di atas); **jam check-in 14.00 & check-out 12.00**; **harga beda weekday/weekend**. Foto KTP sempat direncanakan opsional, tapi **dihapus total dari sistem 2026-08-04** — lihat §8.1.)*

**Data tiket masuk & atraksi — SUDAH didapat** dari price list resmi (Koperasi Alam Lestari), diinput ke `lib/data/content.ts` (`getTicketPackages`, `getParkingFees`) dan ditampilkan di halaman Tentang (§"Harga Tiket Masuk" & "Tarif Parkir"):
- Paket Basic (Diamond) Rp40.000/Rp25.000 (siang/malam) — asuransi, akses wisata, akses kolam berendam (Kawah Hujan).
- Paket Eksklusif (Platinum) Rp55.000 — + welcome drink, pilih Nirwana Pool / jacuzzi private / fotografer.
- Paket Wisman (khusus WNA) Rp210.000 — welcome drink + Nirwana Pool/jacuzzi eksklusif.
- Anak 5–10 tahun (Silver) Rp30.000/Rp20.000.
- Parkir: Bus Rp60.000, Mobil Rp15.000, Motor Rp5.000, Sepeda Rp2.000.
- **Nirwana Pool** & **Kolam Berendam (Kawah Hujan)** dikonfirmasi sebagai nama fasilitas asli (sudah dipakai di §Daya Tarik Wisata). "Sky Bridge" & "Jalur Trekking" masih dugaan nama, belum dikonfirmasi.
- Catatan: harga tiket masuk ini murni **konten informasi** di halaman publik (brosur), BUKAN sistem booking tiket — sistem tiket masuk sungguhan tidak ada (lihat ruang lingkup di atas).

**Data penginapan (lodging) — SUDAH didapat** dari "Pricelist Penginapan DGCK" (PDF resmi). 6 tipe unit real:

| Unit | Kategori | Weekday | Weekend | Kapasitas | Kasur | Kamar Mandi |
|---|---|---|---|---|---|---|
| Eagle Hill | Cottage | Rp1.999.000 | Rp2.499.000 | 2 | 1 Queen | Private + hot spring |
| Royal Kahuripan | Glamping | Rp1.000.000 | Rp1.200.000 | 2 | 1 Queen | Private |
| Camp Jamuju | Tenda | Rp1.200.000 | Rp1.500.000 | 4 | 4 Single | Bersama |
| Camp Rasamala | Tenda | Rp800.000 | Rp950.000 | 4 | 4 Single | Bersama (bonfire private) |
| Camp Cakrawala | Tenda | Rp600.000 | Rp725.000 | 3 | 2 Single | Bersama |
| Glorious Campervan | Area Camping | Rp350.000 | Rp400.000 | 4 | Kavling 5×7m | Bersama |

**⚠️ Temuan penting — struktur tarif tambah orang beda dari yang diasumsikan sebelumnya.** Bukan satu `extra_bed_price` tunggal, tapi **2 opsi per unit** ("KETENTUAN PENAMBAHAN ORANG" di price list):
- **Dengan Ekstra Bed** (dikasih kasur tambahan) — mis. Eagle Hill Rp300.000, Camp Jamuju Rp250.000
- **Tanpa Ekstra Bed** (nambah kapasitas tanpa kasur tambahan) — mis. Eagle Hill Rp200.000, Camp Jamuju Rp175.000
- **Glorious Campervan beda lagi:** flat Rp55.000/orang tambahan (tanpa opsi dgn/tanpa kasur, karena bukan unit berkasur).

Struktur tarif tambah orang ini disimpan di `room_types` (`extra_bed_price`, `extra_no_bed_price`, `extra_flat_price`) dan dibekukan per tenda ke `booking_items.extra_bed_price` saat booking dibuat.

**Fasilitas umum yang SAMA di semua unit** (dari price list, bukan asumsi): Tiket DGCK, Keamanan 24 Jam, Resepsionis, Playground, **Cratera Resto**, **Nirwana Pool & Resto**, Room Service. Sudah dipakai di halaman Tentang (bagian Fasilitas Kawasan).

---

## 12. Catatan Deployment

- Semua di **1 VPS**: Next.js + NestJS + PostgreSQL, diatur **Nginx** (`dglorious.com` → FE, `api.dglorious.com` → BE).
- SSL gratis via **Let's Encrypt**.
- **Docker/docker-compose menjelang deploy**, bukan saat mengembangkan fitur.
- Domain & VPS **atas nama pihak D'Glorious**.
- **Wajib sebelum go-live:** backup database otomatis + hardening dasar server (firewall, non-root user, update rutin).

---

## 13. Konvensi Kode

- Bahasa kode & komentar: **Inggris**. Teks UI: **Indonesia** (via i18n).
- Penamaan: `camelCase` (variabel/fungsi), `PascalCase` (komponen & class), `snake_case` (kolom database).
- Setiap endpoint terproteksi wajib: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`.
- DTO + `class-validator` untuk semua input di NestJS.
- Commit message: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- **Struktur folder `backend/src/` — per UNIT BISNIS, bukan per role (keputusan 2026-08-01).** Modul dikelompokkan berdasarkan area dashboard admin (cocok dengan RBAC §5 & route frontend `/admin/*`), bukan folder per role:
  - `penginapan/` — semua modul milik dashboard Penginapan (`room-types/`, `bookings/`). Endpoint publik (katalog tanpa login) **tetap di dalam** folder ini sebagai controller terpisah tanpa guard (mis. `room-types-public.controller.ts`) — datanya tetap milik domain Penginapan, cuma beda syarat akses.
  - Lintas-unit-bisnis dapat folder sendiri di root `src/`, bukan masuk ke salah satu unit: `auth/`, `settings/` (dipakai semua unit). Agregasi untuk dashboard Owner dihitung di frontend dari data booking, bukan endpoint khusus.
  - **Alasan bukan folder-per-role:** satu resource (mis. `room-types`) di-CRUD banyak role sekaligus (`SUPER_ADMIN`, `OWNER`, `ADMIN_PENGINAPAN` — lihat tabel §5). Folder per role akan memaksa duplikasi service atau balik lagi butuh satu sumber logic bersama. Role tetap ditegakkan lewat `@Roles(...)` di tiap controller (§4.2) — bukan lewat lokasi file.
- **Struktur folder `frontend/components/admin/` — ikut pola yang sama (keputusan 2026-08-02).** `components/admin/penginapan/` menampung semua komponen dashboard Penginapan (`KelolaPage`, `BookingsPage`, dst), mirror `app/admin/penginapan/*` & konvensi backend di atas. `components/ui/`, `components/layout/`, `components/public/`, `components/owner/` **tidak** ikut pola ini — masing-masing sudah punya pengelompokan sendiri yang jelas (generik lintas-halaman / shell layout / katalog publik / dashboard Owner), bukan area yang bakal pecah jadi banyak unit bisnis.
- **`frontend/lib/api/` sengaja TETAP flat, satu file per resource backend** (`roomTypes.ts`, `bookings.ts`, `settings.ts`) — beda dari alasan controller backend dipecah (ada pemaksa teknis: guard/`@Roles` beda per controller), di frontend gak ada pemaksa serupa, cuma kumpulan fungsi fetch biasa. Ini juga konsisten sama pola `lib/data/` yang sudah lebih dulu ada (`admin.ts`, `owner.ts`, `content.ts` — flat, gak ada subfolder).

---

## 14. Dokumentasi per Fitur (`docs/fitur/`)

**Wajib dijaga mulai 2026-08-21.** Selain TASK.md (log kronologis "apa berubah tanggal berapa") dan PROJECT.md (konteks proyek), tiap fitur di granularitas **halaman/modul** (lihat daftar 19 fitur di bawah) punya file sendiri di `docs/fitur/fitur-<nama>.md`.

**Beda tujuan dari TASK.md — JANGAN dicampur:**
- **TASK.md** = histori revisi kronologis (tanggal, apa yang berubah, kenapa) — tetap begini, jangan diringkas jadi kondisi akhir.
- **`docs/fitur/*.md`** = **snapshot kondisi fitur SAAT INI** (bukan revisinya) — orang baca sekali langsung paham fitur itu utuh, tanpa perlu telusuri histori tanggal.

**⚠️ Aturan gaya penulisan (revisi 2026-08-21, penting):**
1. **Tulis dalam bentuk KONDISI SEKARANG, bukan rantai perubahan.** DILARANG framing "dulu X → sekarang Y", "sebelumnya mock, sekarang API", "sempat ditunda, ternyata sudah dibangun", atau tanggal revisi. Itu semua histori → tempatnya TASK.md. Di sini tulis seolah fitur ini memang dari awal begini. **Kecuali** kalau kondisi lama itu masih relevan sebagai jebakan/gotcha yang bisa menyesatkan pembaca kode sekarang — itupun ditulis sebagai peringatan ("Perhatikan: X terlihat seperti Y padahal Z"), bukan sebagai jurnal tanggal.
2. **Fitur kompleks (banyak alur/state) tulis dengan NARASI, bukan cuma bullet padat.** Tambah 1-2 paragraf yang menceritakan alur kerjanya utuh, supaya orang yang belum pernah baca kodenya bisa paham tanpa harus menyambungkan bullet sendiri. Fitur simpel cukup ringkas.
3. **"Keputusan Desain Penting" isinya ALASAN arsitektur saat ini** — kenapa dibangun begini, bukan bagaimana sampai di sini. "Ketersediaan dihitung per-qty bukan per-unit fisik, karena unit spesifik baru ditentukan saat check-in" ✅ (alasan). "Awalnya per-unit lalu diubah jadi per-qty tanggal 4 Agustus" ❌ (histori → TASK.md).

**Kapan file dibuat/diupdate:** setiap kali selesai membangun fitur baru, atau selesai mengedit signifikan fitur yang sudah ada (bukan tiap commit kecil/fix typo) — buat/update file `docs/fitur/fitur-<nama-fitur>.md` yang bersangkutan sebagai bagian dari pekerjaan itu, tanpa perlu diminta ulang tiap kali.

**Format tiap file:**
```markdown
# <Nama Fitur>

**Route:** `/path/terkait` (kalau ada)
**Status:** ✅ Selesai / 🚧 Sebagian / dll
**File utama:** path file kode paling relevan

## Ringkasan
1-2 kalimat: fungsinya apa, siapa yang pakai.

## Cara Kerja
Narasi alur fitur — untuk fitur kompleks 1-3 paragraf yang menceritakan bagaimana fitur ini bekerja end-to-end (dari input user sampai efeknya). Fitur simpel boleh dilebur ke Ringkasan/Sub-fitur saja.

## Sub-fitur
- **Nama sub-fitur** — deskripsi kondisi sekarang, cukup detail buat dipahami tanpa buka kode.
- ...

## Keputusan Desain Penting
Alasan arsitektur saat ini (kenapa begini), bukan histori perubahan. Cuma yang non-obvious / butuh penjelasan.

## Terhubung ke
Endpoint API yang dipakai, tabel DB terkait, halaman/komponen lain yang terhubung.
```

**19 fitur (granularitas halaman/modul, disepakati 2026-08-21):**

*Publik:* Homepage, Tentang, Katalog Penginapan, Detail Unit, Syarat & Ketentuan
*Auth & RBAC:* Login + proteksi akses
*Admin Penginapan:* Ringkasan, Booking WhatsApp, Tamu Langsung/Walk-in, Data Booking (+ubah status), Kelola/CMS Penginapan (+galeri)
*Owner:* Dashboard Ringkasan, Dashboard Penginapan
*Super Admin:* Hub navigasi
*Cross-cutting:* Modul Settings, Export PDF, Export Excel, Cek ketersediaan (anti double-booking), Mesin hitung harga

**Semua 19 file sudah dibuat (2026-08-21)** — snapshot kondisi kode saat itu, ditulis lewat audit langsung ke source code (bukan cuma disalin dari TASK.md). Mulai sekarang, tiap fitur baru/edit signifikan → update file yang bersangkutan di `docs/fitur/`, jangan biarkan basi seperti yang sempat terjadi (lihat TASK.md FASE 7/8, audit 2026-08-21 — fitur Edit Booking & indikator ketersediaan real-time ternyata sudah dibangun tapi TASK.md tidak pernah di-update, baru ketahuan saat audit ini).
