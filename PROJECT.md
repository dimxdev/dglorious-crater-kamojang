# PROJECT.md — D'Glorious Crater Kamojang

Konteks proyek untuk Claude Code. Baca file ini sebelum mengerjakan task apa pun.

> **⚠️ Scope Fase 1 (hasil data gathering + form booking asli klien).**
> Fase 1 = **company profile / katalog publik + pencatatan booking internal oleh admin**.
> Admin **hanya menginput booking yang SUDAH FIX** (negosiasi harga & aturan DP/pelunasan
> terjadi di WhatsApp, **di luar sistem**). **Booking online mandiri (Midtrans, guest
> checkout, email, tiket PDF/QR, auto-expire) + bahasa Mandarin digeser ke fase berikutnya** —
> strukturnya tetap disiapkan, hanya belum diimplementasi.

---

## 1. Ringkasan

Sistem informasi & reservasi untuk destinasi wisata **D'Glorious Crater Kamojang** (kawah geothermal, pemandian air panas, glamping) di perbatasan Kabupaten Bandung–Garut, Jawa Barat.

**Fase 1 (fokus saat ini):**
- **Katalog/company profile publik** — brosur digital: etalase tiap unit (foto, kapasitas, harga) + info + Syarat & Ketentuan. **Tanpa booking online**; CTA cukup **"Hubungi Reservasi via WhatsApp"**.
- **Pencatatan booking internal oleh admin** — tamu menghubungi admin lewat WhatsApp, deal disepakati di sana, lalu **admin menginput booking yang sudah fix** di dashboard.
- **Dashboard admin penginapan** (data booking, tambah booking, check-in, CMS unit).
- **Dashboard owner** (statistik & rekap).

**Fase berikutnya (belum dikerjakan, tapi struktur data harus siap):**
- **Booking online mandiri** — Midtrans Snap, guest checkout, kode booking yang diakses tamu, email otomatis, tiket PDF+QR, **auto-expire 1×24 jam**, halaman `/cek-booking` & `/booking/[kode]`.
- **Bahasa Mandarin (中文)** — struktur i18n & tabel translations sudah multi-bahasa; tinggal menambah data.
- **Sistem tiket masuk (portal)** dan **sistem transaksi cafe**.

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
| i18n | **Fase 1: Indonesia (ID) + Inggris (EN).** Mandarin (中文) = fase berikutnya. Struktur tetap multi-bahasa sejak awal. |
| Payment | *(fase berikutnya)* Midtrans Snap (**sandbox** selama KP). Fase 1: pembayaran di luar sistem (transfer/tunai), admin hanya menandai lunas/belum. |
| Email | *(fase berikutnya)* Nodemailer (SMTP), queue/async |
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
4. **Tamu TIDAK punya akun.** Tidak ada register/login pengunjung. Di **fase 1 tamu tidak bertransaksi mandiri** — semua booking diinput admin. *(Guest checkout mandiri = fase berikutnya.)*
5. **Harga di-snapshot ke booking** (`price_snapshot`). Perubahan/variasi tarif di master tidak boleh mengubah booking lama. Makin penting karena tarif **beda weekday/weekend** dan bisa **di-override manual** admin (nego).
6. **Semua konfigurasi yang bisa berubah disimpan di tabel `settings`, JANGAN hardcode** (jam check-in/out, no. WhatsApp reservasi, rekening, teks S&K).
7. **Semua data harus analytics-ready:** timestamp lengkap di setiap transisi status, enum konsisten, soft delete, `created_by` untuk jejak audit.
8. **Cek ketersediaan harus satu fungsi yang dipakai bersama** oleh semua jalur pembuatan booking (sekarang: input admin; nanti: online), agar tidak ada celah double-booking.
9. **Environment variable untuk kredensial & endpoint** (URL API, DB — nanti key Midtrans, SMTP). *(Konfigurasi bisnis yang admin ubah → tabel `settings`, lihat poin 6.)*

> **Disiapkan untuk fase berikutnya (struktur, belum diimplementasi):**
> - Status pembayaran online hanya boleh diubah **webhook Midtrans yang signature-nya terverifikasi**.
> - **Generate tiket di-trigger perubahan status ke `CONFIRMED`** (bukan tombol), agar jalur online & manual sama-sama otomatis.

---

## 5. Role & Hak Akses (RBAC) — *tetap berlaku penuh di fase 1*

| Role | Akses |
|---|---|
| `SUPER_ADMIN` | Semua dashboard, CRUD penuh, + kelola akun & setting sistem |
| `OWNER` | Dashboard owner (eksklusif) + semua dashboard admin, CRUD penuh |
| `ADMIN_PENGINAPAN` | Hanya dashboard penginapan, CRUD penuh di area tersebut |
| `ADMIN_PORTAL` | *(fase berikutnya)* Hanya dashboard tiket masuk |
| `ADMIN_CAFFE` | *(fase berikutnya)* Hanya dashboard cafe |

**Aturan arah akses:** Owner & Super Admin bisa masuk "ke bawah" (dashboard admin). Admin **tidak bisa** naik ke dashboard owner. Dashboard owner hanya untuk `OWNER` dan `SUPER_ADMIN`.

---

## 6. Alur Booking

### 6.1 Fase 1 — Pencatatan Internal oleh Admin

**Update 2026-07-26 (dari form reservasi WhatsApp resmi klien):** ada **dua jalur** pencatatan berbeda, dipisah jadi **dua menu sendiri** karena kondisi tamunya beda (belum tiba vs. sudah di lokasi):

**A. Menu "Booking WhatsApp"** (`/admin/penginapan/booking-whatsapp`) — tamu nego & isi form di WhatsApp dulu, belum tiba di lokasi:

```
Tamu menghubungi admin via WhatsApp (dari CTA di katalog publik)
  → staff kirim form reservasi (Nama, No. Telepon, Tipe & Jumlah Tenda,
     tanggal check-in/out, Dewasa, Anak-anak, Note/Request) + brosur & S&K
  → nego, DP 50% maks 1×24 jam setelah dealing → DISEPAKATI DI WHATSAPP (di luar sistem)
     (lewat 1×24 jam tanpa DP = booking rilis otomatis ke tamu lain — ini terjadi
     di WHATSAPP/kepala admin, BUKAN di sistem; sistem belum tahu apa-apa di fase ini)
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
- Karena admin hanya menginput booking yang sudah fix, **sistem tidak pernah memegang booking menggantung** → **tidak ada auto-expire di fase 1** (masa tunggu DP 1×24 jam sepenuhnya terjadi di WhatsApp, sebelum data masuk sistem).
- **Reschedule (fase 1 sederhana):** admin boleh mengubah tanggal booking manual. Per S&K, reschedule paling lambat **H-7** sebelum check-in — validasi "maks H-7" dicatat sebagai peningkatan opsional, belum wajib.

### 6.2 Status Booking (Fase 1)

**Revisi 2026-07-26** — status pembayaran & status booking **digabung jadi satu progres tunggal**, bukan 2 field terpisah seperti draf sebelumnya (lebih cocok sama cara admin mikirin & mengedit statusnya langsung dari menu Data Booking):

```
DP → LUNAS → CHECKED_IN → COMPLETED
```

**Revisi lanjutan (sama hari)** — status `CANCELLED` terpisah **dihapus**, digabung jadi satu konsep dengan `HANGUS`: dari sisi bisnis, dibatalkan manual & tidak pernah datang **sama-sama berarti "uang hangus, booking tidak jadi"** (S&K poin 5) — jadi cukup satu status, bukan dua. **Ditambah 1 status turunan baru: `NO_SHOW`** ("Tidak Datang") — dipisah dari `HANGUS` karena beda kondisi bisnisnya (lihat rincian di bawah).

**Revisi lanjutan lagi (sama hari)** — satu tenggat yang **sama** dipakai untuk ketiga status turunan: **tanggal check-out**, bukan check-in. Baik `DP` maupun `LUNAS` dikasih toleransi penuh selama rentang menginapnya (siapa tahu tamu masih datang kapan pun sebelum checkout) — cuma beda label akhirnya tergantung sudah lunas atau belum saat checkout lewat.

Cabang & status turunan (dihitung ulang tiap kali data booking dibuka, **bukan cron job** — Fase 1 tidak butuh proses background — bandingkan tanggal hari ini vs `check_out`):
- `HANGUS` — **bisa disimpan manual** (admin batalkan booking kapan saja sebelum check-in) **ATAU dihitung otomatis**: booking masih `DP` (belum lunas) dan tanggal **check-out** sudah lewat tanpa pernah check-in — dianggap batal, uang hangus.
- `NO_SHOW` — **status turunan murni, tidak pernah disimpan manual**: booking sudah `LUNAS` (bayar penuh) tapi tanggal **check-out** sudah lewat tanpa pernah check-in — uangnya aman, cuma tamunya yang tidak muncul.
- `COMPLETED` — **status turunan**: booking `CHECKED_IN` dan tanggal `check_out` **sudah lewat** — dihitung dengan cara yang sama, bukan diset manual admin.

Jadi hanya **4 status yang benar-benar diubah admin secara manual**: `DP`, `LUNAS`, `CHECKED_IN`, `HANGUS` — 2 lainnya (`COMPLETED`, `NO_SHOW`) murni tampilan yang dihitung dari tanggal. **Walk-in mulai langsung dari `CHECKED_IN`** (skip `DP`/`LUNAS` — sudah bayar penuh & sudah di lokasi saat dicatat, lihat §6.1 jalur B).

**Semua perubahan status dilakukan langsung dari menu Data Booking** (klik baris → detail → tombol "Tandai Lunas" / "Tandai Check-in" / "Tandai Hangus" / "Edit Tanggal") — **bukan menu Check-in terpisah**. Menu Check-in (ketik kode → verifikasi) **dihapus**: fungsinya jadi duplikat begitu status bisa diubah langsung dari baris booking yang sudah kelihatan di tabel — Fase 1 tidak ada tamu yang mengakses sistem sendiri, jadi tidak ada yang perlu "diverifikasi" pakai kode.

**⚠️ Dampak ke skema database (§10) — BELUM diterapkan ke Prisma:** rencana lama punya `status` (enum booking) + `payment_status` (enum bayar) sebagai 2 kolom terpisah. Revisi ini menyatukannya jadi **satu enum** `DP | LUNAS | CHECKED_IN | HANGUS` (4 nilai yang disimpan) — `COMPLETED`/`NO_SHOW` dihitung di layer API saat baca data, bukan kolom tersendiri. Nilai enum lama terkait alur online — `WAITING_PAYMENT`, `PAID`, `EXPIRED` — **tetap ada di enum** tetapi ditandai *"fase berikutnya"*. **Auto-expire beneran (cron) TIDAK dipakai di fase 1** — `NO_SHOW`/`HANGUS` turunan cuma dihitung on-read, bukan proses yang benar-benar mengubah data booking secara otomatis.

### 6.3 Fase berikutnya — Booking Online (via Midtrans) *(disiapkan, belum dikerjakan)*

```
Guest checkout → SIMPAN (PENDING, generate booking_code, kunci tanggal) → email #1
  → Midtrans Snap → bayar → webhook (verifikasi signature) → PAID → CONFIRMED
  → tiket PDF+QR auto-generate → email #2
  → AUTO-EXPIRE: belum lunas dalam 1×24 jam sejak created_at → EXPIRED, lepas kunci tanggal
```

---

## 7. Aturan Kode Booking & Check-in

- **Satu kode per booking** (`booking_code`), acak & sulit ditebak (contoh: `DGC-A7F3K2`). Jangan nomor urut.
- **Kode tidak pernah kadaluarsa** — yang berubah adalah *status* booking.
- Fase 1: `booking_code` = **referensi internal saja** (identifikasi baris di Data Booking, dicantumkan di WA konfirmasi). **Bukan tiket yang diverifikasi tamu sendiri** — tidak ada menu "ketik kode" terpisah (dihapus 2026-07-26, lihat §6.2): admin sudah melihat & mengklik langsung baris booking yang bersangkutan di menu Data Booking untuk ubah status ke `CHECKED_IN`.
- **Pencegahan status berubah dua kali cukup lewat guard tombol di UI** (tombol "Tandai Check-in" cuma tampil kalau status masih `LUNAS`; begitu jadi `CHECKED_IN` tombolnya hilang) — bukan lewat pencarian kode seperti rencana lama.

> **Fase berikutnya:** akses halaman booking oleh tamu = **kode + no. WhatsApp**, halaman `/cek-booking` & `/booking/[kode]` adaptif, tiket **PDF + QR**. Kolom `qr_url`/`pdf_url` sudah disiapkan di tabel `tickets`.

---

## 8. Halaman yang Dibutuhkan (Fase 1)

### Publik — Katalog / Company Profile (etalase, TANPA booking online)
- `/` — Homepage (hero, daya tarik, preview tenda, info praktis)
- `/tentang` — Company profile (sejarah, galeri, fasilitas)
- `/penginapan` — Katalog/brosur digital tenda & villa (foto, kapasitas, harga weekday/weekend)
- `/penginapan/[slug]` — Detail unit. **CTA = "Hubungi Reservasi via WhatsApp"** (bukan booking online)
- `/syarat-ketentuan` — Halaman Syarat & Ketentuan (12 poin, teks dari `settings`)

### Admin & Owner
- `/login` — **satu halaman login** untuk semua role
- `/admin/penginapan` — Ringkasan (stat, booking terbaru, kalender okupansi)
- `/admin/penginapan/booking` — Tabel data booking (filter status, sumber; search nama/kode/WA) — **juga tempat ubah status** (Tandai Lunas/Check-in/Batalkan/Edit Tanggal langsung dari detail baris, lihat §6.2). Menu Check-in terpisah **dihapus 2026-07-26**, fungsinya dilebur ke sini.
- `/admin/penginapan/booking-whatsapp` — **Menu inti fase 1, jalur A** (lihat §8.1) — booking sudah dealing di WhatsApp, tamu belum tiba, mulai dari status `DP`
- `/admin/penginapan/walk-in` — **Menu inti fase 1, jalur B** (lihat §8.1) — tamu datang & pesan langsung di lokasi, bayar saat itu juga (langsung `CHECKED_IN`, skip `DP`/`LUNAS`)
- `/admin/penginapan/kelola` — CMS tenda (CRUD + tab bahasa + galeri)
- `/admin/settings` — *digeser ke Fase 2 (2026-07-26) — dianggap belum cukup penting utk MVP KP, lihat TASK.md FASE 4*
- `/owner` — Dashboard owner (stat + grafik + rekap + export)

> **Fase berikutnya (halaman publik tamu):** `/booking` (guest checkout + Midtrans), `/cek-booking`, `/booking/[kode]` adaptif.

### 8.1 Form "Booking WhatsApp" & "Tamu Langsung" (fitur inti fase 1)

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
- Fase 1 cukup sediakan field **"Anak-anak"** + tampilkan **catatan aturan ini di UI**. **Jangan over-engineer** penghitungan umur otomatis kecuali mudah (klien tidak memisahkan usia 5 vs 6 secara rinci di form).

### 8.3 Setting Global (tabel `settings`, bisa diubah admin — JANGAN hardcode)

- **Jam check-in `14.00` & check-out `12.00`** — tampil di detail tenda, form, & konfirmasi
- **Nomor WhatsApp reservasi** — dipakai CTA publik & tombol mengambang
- **Rekening pembayaran** — `BSI 7262292465 a/n KOPERASI ALAM LESTARI`
- **Teks Syarat & Ketentuan (12 poin)** — tampil di halaman publik

---

## 9. Multi-bahasa (i18n)

**Dua lapis:**
1. **Teks UI** → file JSON per bahasa (`id.json`, `en.json`; `zh.json` disiapkan fase berikutnya).
2. **Konten dinamis** (nama & deskripsi tenda) → tabel `room_type_translations`, diisi admin lewat **tab bahasa** di CMS.

**Aturan:**
- **Fase 1 mengisi 2 bahasa: ID + EN.** Mandarin (中文) menyusul — **cukup menambah data**.
- Tab **ID wajib**. EN opsional (中文 nanti). **Fallback ke Indonesia** jika terjemahan kosong.
- **JANGAN** kolom `name_id/name_en/name_zh`, **jangan hardcode**, **jangan jadi 2 kolom** — tetap pakai tabel translations.

---

## 10. Skema Database (Fase 1)

- **`roles`** — id, name, permissions (JSON)
- **`users`** — id, role_id, name, email, password, created_at
- **`settings`** — id, key, value (teks/JSON), updated_at, updated_by *(konfigurasi global §8.3)*
- **`room_types`** — id, slug, **`price_weekday`**, **`price_weekend`**, capacity, total_units, facilities (JSON), is_active, created_by, created_at, deleted_at
  - Harga **TIDAK flat**: minimal 2 tarif (weekday & weekend); sistem memilih tarif per tanggal menginap. Jam check-in/out **bukan** di sini — ambil dari `settings`. *(Tarif high-season = perlu konfirmasi klien, §11.)*
- **`room_type_translations`** — id, room_type_id, language_code, name, description, facilities_text, rules
- **`room_images`** — id, room_type_id, image_url, is_cover, sort_order
- **`room_units`** — id, room_type_id, unit_code, status
- **`bookings`** — id, booking_code (unik, acak), guest_name, guest_phone, guest_email (nullable), check_in, check_out, **`price_snapshot`** (total dibekukan — **WAJIB**), **`is_price_override`** (bool), **`status`** (enum — `DP`/`LUNAS`/`CHECKED_IN`/`HANGUS` disimpan; `COMPLETED`/`NO_SHOW` dihitung di API dari tanggal, **bukan kolom**, lihat §6.2), booking_source (**`MANUAL`** fase 1 / `ONLINE` fase berikutnya), booking_channel (`WHATSAPP`/`WALK_IN`), notes (nullable), created_by, created_at, lunas_at, checked_in_at, hangus_at, *(disiapkan fase berikutnya: expired_at)*
- **`booking_items`** — id, booking_id, room_type_id, room_unit_id (nullable), qty, subtotal_snapshot, **`adults`**, **`children`**, **`extra_bed_qty`** (default 0), **`extra_bed_type`** (nullable), **`extra_bed_price`** *(satu booking bisa mencakup beberapa tenda — dewasa/anak/extra-bed disimpan PER TENDA di sini, bukan di `bookings`, karena tiap tenda dalam satu booking bisa beda komposisi tamu. Keputusan 2026-08-04, FASE 7 — sebelumnya field-field ini ada di level `bookings`.)* — `ktp_photo_url` **dihapus total** dari skema (2026-08-04, bukan lagi disimpan sistem, lihat §8.1)
- **`payments`** — id, booking_id, method (cash/transfer/QRIS), amount, proof_url (nullable), status, paid_at, verified_by (nullable), *(disiapkan: midtrans_order_id nullable)*
- **`tickets`** — id, booking_id, qr_url, pdf_url, issued_at *(struktur disiapkan; generate PDF/QR = fase berikutnya)*

**Catatan:** `booking_code` yang dipakai sebagai referensi **wajib acak**. Enum status menyertakan nilai fase-berikutnya (`WAITING_PAYMENT`, `PAID`, `EXPIRED`) yang **belum dipakai** di fase 1.

---

## 11. Hal yang Masih Perlu Dikonfirmasi ke Klien

- [x] **Nama & jumlah tipe tenda/villa + harga weekday/weekend-nya** — **SUDAH didapat** dari "Pricelist Penginapan DGCK" (PDF resmi). Diinput ke `lib/data/rooms.ts` (6 unit real: Eagle Hill, Royal Kahuripan, Camp Jamuju, Camp Rasamala, Camp Cakrawala, Glorious Campervan — lengkap harga weekday/weekend, kapasitas, bed/bathroom info, tarif tambah orang dgn/tanpa ekstra bed). Lihat detail lengkap di bawah.
- [x] **Form reservasi WhatsApp resmi & 12 poin S&K — SUDAH didapat** (2026-07-26) dari klien, **menggantikan draft internal** sebelumnya. Field form: Nama Lengkap, Nomor Telepon, Tipe & Jumlah Tenda, Tanggal Check-in, Tanggal Check-out, Dewasa, Anak-anak, Note/Request — dipakai jadi field menu "Booking WhatsApp" (§8.1). 12 poin S&K resmi diinput ke `lib/data/settings.ts` (`termsAndConditions`), tampil di `/syarat-ketentuan`. **Temuan penting:** poin 1–2 mengungkap alur DP 50% maks 1×24 jam + auto-release ke tamu lain kalau lewat — tapi ini terjadi **sepenuhnya di WhatsApp/kepala admin**, sebelum booking dicatat ke sistem (lihat §6.1), jadi **tidak mengubah** keputusan "tidak ada auto-expire di fase 1".
- [ ] **Definisi weekend** — Sabtu–Minggu saja, atau termasuk Jumat? *(Price list cuma bilang "Weekday"/"Weekend", belum eksplisit definisinya. Dipakai di `lib/pricing.ts` — asumsi sementara Sabtu–Minggu.)*
- [ ] **Tarif extra bed: per malam atau sekali bayar?** — price list cuma kasih satu angka per opsi (dgn/tanpa kasur), tidak jelas berlaku sekali untuk seluruh masa inap atau dikali jumlah malam. `lib/pricing.ts` (`extraBedRate`) **asumsi sementara: per malam**, disamakan dengan tarif sewa dasar yang jelas per malam.
- [ ] **Tarif high-season / libur nasional** (tarif ketiga) — price list cuma bilang *"Harga dapat berubah saat di High Season"*, belum ada angka pastinya.
- [ ] **Jumlah unit per tipe** — price list tidak mencantumkan jumlah unit fisik tiap tipe. Angka di `totalUnits` (`rooms.ts`) masih **ESTIMASI**, perlu dikonfirmasi.
- [ ] **Foto asli tiap unit** — price list ada fotonya (interior, kolam, dll) tapi belum bisa diekstrak jadi file gambar dari PDF; semua unit masih **pinjam foto generik** sementara.
- [ ] Jam operasional layanan reservasi (WhatsApp)
- [ ] **⚠️ Jam operasional wisata — DUA sumber klien saling beda, perlu klarifikasi final:**
  - Sumber A (screenshot info singkat): Senin–Jumat 08.00–22.00 WIB, Sabtu–Minggu 07.00–22.00 WIB.
  - Sumber B (grafis "Operational Hour"): Weekday 07.00–22.00 WIB, **Weekend 24 Jam**, **Libur Nasional 24 Jam**.
  - **Keputusan interim yang dipakai di situs sekarang** (arahan user, belum final dari klien): Senin–Jumat 08.00–22.00 WIB, **Sabtu–Minggu 24 Jam** — kombinasi jam dari Sumber A + status 24-jam dari Sumber B. Cek `lib/data/content.ts` (`infoSources` → "Jam Buka").

*(Sudah terjawab: **DP 50% maks 1×24 jam / pelunasan manual di luar sistem** (bukan lunas di muka — lihat poin form WA di atas); **jam check-in 14.00 & check-out 12.00**; **rekening BSI 7262292465 a/n KOPERASI ALAM LESTARI**; **harga beda weekday/weekend**. Foto KTP sempat direncanakan opsional, tapi **dihapus total dari sistem 2026-08-04** — lihat §8.1.)*

**Data tiket masuk & atraksi — SUDAH didapat** dari price list resmi (Koperasi Alam Lestari), diinput ke `lib/data/content.ts` (`getTicketPackages`, `getParkingFees`) dan ditampilkan di halaman Tentang (§"Harga Tiket Masuk" & "Tarif Parkir"):
- Paket Basic (Diamond) Rp40.000/Rp25.000 (siang/malam) — asuransi, akses wisata, akses kolam berendam (Kawah Hujan).
- Paket Eksklusif (Platinum) Rp55.000 — + welcome drink, pilih Nirwana Pool / jacuzzi private / fotografer.
- Paket Wisman (khusus WNA) Rp210.000 — welcome drink + Nirwana Pool/jacuzzi eksklusif.
- Anak 5–10 tahun (Silver) Rp30.000/Rp20.000.
- Parkir: Bus Rp60.000, Mobil Rp15.000, Motor Rp5.000, Sepeda Rp2.000.
- **Nirwana Pool** & **Kolam Berendam (Kawah Hujan)** dikonfirmasi sebagai nama fasilitas asli (sudah dipakai di §Daya Tarik Wisata). "Sky Bridge" & "Jalur Trekking" masih dugaan nama, belum dikonfirmasi.
- Catatan: harga tiket masuk ini murni **konten informasi** di halaman publik (brosur), BUKAN sistem booking tiket — sistem tiket masuk sungguhan (`ADMIN_PORTAL`) tetap fase berikutnya sesuai §1.

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

**Dampak ke skema database (§10) — BELUM diterapkan ke Prisma, baru di data mock frontend:** kolom `bookings.extra_bed_price` (skema lama, satu harga) perlu direvisi jadi menampung 2 opsi (dgn/tanpa kasur) atau referensi ke tarif per `room_types`. Ini perlu dikerjakan saat FASE 6/7 (implementasi booking backend), bukan sekarang.

**Fasilitas umum yang SAMA di semua unit** (dari price list, bukan asumsi): Tiket DGCK, Keamanan 24 Jam, Resepsionis, Playground, **Cratera Resto**, **Nirwana Pool & Resto**, Room Service. Sudah dipakai di halaman Tentang §"Fasilitas Umum".

---

## 12. Catatan Deployment

- Semua di **1 VPS**: Next.js + NestJS + PostgreSQL, diatur **Nginx** (`dglorious.com` → FE, `api.dglorious.com` → BE).
- SSL gratis via **Let's Encrypt**.
- **Docker/docker-compose menjelang deploy**, bukan saat mengembangkan fitur.
- Domain & VPS **atas nama pihak D'Glorious**.
- **Wajib sebelum go-live:** backup database otomatis + hardening dasar server (firewall, non-root user, update rutin).
- *(Fase berikutnya)* Akun Midtrans **production** butuh dokumen usaha klien — selama KP **sandbox**.

---

## 13. Konvensi Kode

- Bahasa kode & komentar: **Inggris**. Teks UI: **Indonesia** (via i18n).
- Penamaan: `camelCase` (variabel/fungsi), `PascalCase` (komponen & class), `snake_case` (kolom database).
- Setiap endpoint terproteksi wajib: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`.
- DTO + `class-validator` untuk semua input di NestJS.
- Commit message: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- **Struktur folder `backend/src/` — per UNIT BISNIS, bukan per role (keputusan 2026-08-01).** Modul dikelompokkan berdasarkan area dashboard admin (cocok dengan RBAC §5 & route frontend `/admin/*`), bukan folder per role:
  - `penginapan/` — semua modul milik dashboard Penginapan (`room-types/`, nanti `bookings/`, dll). Endpoint publik (katalog tanpa login) **tetap di dalam** folder ini sebagai controller terpisah tanpa guard (mis. `room-types-public.controller.ts`) — datanya tetap milik domain Penginapan, cuma beda syarat akses.
  - `portal/`, `cafe/` — *(fase berikutnya)* pola yang sama untuk `ADMIN_PORTAL`/`ADMIN_CAFFE`.
  - Lintas-unit-bisnis dapat folder sendiri di root `src/`, bukan masuk ke salah satu unit: `auth/`, `settings/` (dipakai semua unit), dan nanti `owner/` khusus endpoint agregat (mis. total pendapatan gabungan 3 unit bisnis) yang tidak dimiliki satu unit saja.
  - **Alasan bukan folder-per-role:** satu resource (mis. `room-types`) di-CRUD banyak role sekaligus (`SUPER_ADMIN`, `OWNER`, `ADMIN_PENGINAPAN` — lihat tabel §5). Folder per role akan memaksa duplikasi service atau balik lagi butuh satu sumber logic bersama. Role tetap ditegakkan lewat `@Roles(...)` di tiap controller (§4.2) — bukan lewat lokasi file.
- **Struktur folder `frontend/components/admin/` — ikut pola yang sama (keputusan 2026-08-02).** `components/admin/penginapan/` menampung semua komponen dashboard Penginapan (`KelolaPage`, `BookingsPage`, dst), mirror `app/admin/penginapan/*` & konvensi backend di atas. `portal/`/`cafe/` **belum dibuat** — nunggu ada kode sungguhan buat diisi (folder kosong gak ada gunanya, git juga gak nge-track direktori kosong), bukan scaffolding di depan. `components/ui/`, `components/layout/`, `components/public/`, `components/owner/` **tidak** ikut pola ini — masing-masing sudah punya pengelompokan sendiri yang jelas (generik lintas-halaman / shell layout / katalog publik / dashboard Owner), bukan area yang bakal pecah jadi banyak unit bisnis.
- **`frontend/lib/api/` sengaja TETAP flat, satu file per resource backend** (`roomTypes.ts`, nanti `bookings.ts`, `settings.ts`) — beda dari alasan controller backend dipecah (ada pemaksa teknis: guard/`@Roles` beda per controller), di frontend gak ada pemaksa serupa, cuma kumpulan fungsi fetch biasa. Ini juga konsisten sama pola `lib/data/` yang sudah lebih dulu ada (`rooms.ts`, `admin.ts`, `owner.ts`, `settings.ts` — flat, gak ada subfolder).
