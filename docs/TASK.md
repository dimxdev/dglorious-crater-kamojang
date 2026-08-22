# TASK.md — Checklist Pengerjaan

Urutan task dari nol sampai siap deploy. Kerjakan **berurutan dari atas ke bawah** — banyak task bergantung pada task sebelumnya.

Baca `PROJECT.md` dulu sebelum mulai. Centang `[x]` setiap task yang selesai.

> **⚠️ Dokumentasi per fitur (`docs/fitur/`) — lihat PROJECT.md §14.** Selesai membangun/mengedit signifikan sebuah fitur → buat/update juga `docs/fitur/fitur-<nama>.md`-nya (snapshot kondisi fitur SEKARANG, bukan histori revisi — histori tetap di sini).

> **⚠️ Penamaan versi.** "FASE" = urutan kerja di dalam satu versi (FASE 0, 1, 2, ... tetap dipakai
> apa adanya). "VERSI" = pembungkus scope rilis di atasnya — **VERSI 1** (dikerjakan sekarang, FASE
> 0–12 di bawah) vs **VERSI 2** (rencana selanjutnya, belum dikerjakan). Dua istilah beda level,
> jangan disamakan.

> **⚠️ Scope Versi 1.** Company profile/katalog publik + **pencatatan booking internal oleh admin**
> (admin hanya input booking yang **sudah fix**; nego & pembayaran terjadi di WhatsApp/luar sistem).
> **Booking online (Midtrans, guest checkout, email, tiket PDF/QR, auto-expire) + Mandarin
> digeser ke VERSI 2** (lihat bagian paling bawah file ini) — struktur tetap disiapkan.
> Istilah unit di UI: **"Tenda" / "Villa"** (entity DB tetap `room_types`).

---

# VERSI 1 — Sekarang (s.d. Deploy)

## Peta Halaman

### FASE 1 (sekarang)

#### Publik — katalog / brosur digital (TANPA booking online)
- [x] `/` — **Homepage**: hero, daya tarik, preview tenda, info praktis, CTA
- [x] `/tentang` — sejarah, galeri, fasilitas
- [x] `/penginapan` — katalog tenda & villa
- [x] `/penginapan/[slug]` — detail unit
- [x] `/syarat-ketentuan` — halaman S&K (12 poin, teks dari `settings`) *(mock frontend, 12 poin sekarang teks resmi klien — update 2026-07-26)*
- [x] ⏳ **Revisi scope:** buang widget booking online dari detail → CTA **"Hubungi Reservasi via WhatsApp"**; tampilkan harga **weekday/weekend**; label **"Tenda"/"Villa"** — selesai lewat FASE 6 (`/penginapan/[slug]` sudah CTA WA + harga weekday/weekend + label kategori dari API)
- [x] Elemen global: navbar, footer, floating WhatsApp

#### Admin
- [x] `/login` — satu pintu semua role
- [x] `/admin/penginapan` — Ringkasan
- [x] `/admin/penginapan/booking-whatsapp` — Booking WhatsApp *(2026-07-26: rename dari `tambah-booking`; field mengikuti form reservasi WA resmi klien — lihat PROJECT.md §8.1)*
- [x] `/admin/penginapan/walk-in` — Tamu Langsung *(2026-07-26: menu baru, dipisah dari Booking WhatsApp karena tamu sudah di lokasi saat dicatat — langsung CHECKED_IN, skip DP/Lunas)*
- [x] `/admin/penginapan/booking` — Data Booking (tabel + filter + modal + **ubah status & edit tanggal langsung dari sini**, lihat FASE 8)
- [x] ~~`/admin/penginapan/checkin`~~ — **dihapus 2026-07-26**, fungsinya dilebur ke Data Booking (lihat PROJECT.md §6.2 & §7)
- [x] `/admin/penginapan/kelola` — Kelola/CMS (drawer tab bahasa + galeri)

#### Owner
- [x] `/owner` — Ringkasan, `/owner/penginapan` — Performa per tipe tenda (real, lihat FASE 10), `/owner/laporan` — placeholder. **Update 2026-07-26:** dipecah jadi route asli per menu (`OwnerLayout.tsx` + `page.tsx` masing-masing), bukan tab-switch di satu komponen `OwnerDashboard.tsx` (dihapus) — biar bisa di-bookmark/share & konsisten sama pola Admin.

> Semua halaman = **UI, data masih mock**. Penyambungan ke API + proteksi route (RBAC) di fase backend masing-masing.

---

## FASE 0 — Setup Awal ✅

- [x] Monorepo, `.gitignore`, `README.md`
- [x] NestJS di `backend/`
- [x] Next.js App Router + TS + Tailwind di `frontend/`
- [x] Prisma + koneksi PostgreSQL
- [x] `.env.example` FE & BE
- [x] ESLint + Prettier
- [x] `npm run dev` jalan di FE & BE

---

## FASE 1 — Database & Model

- [x] `schema.prisma` awal (semua tabel)
- [x] Enum `BookingStatus`, `BookingSource`, `PaymentMethod`, `PaymentStatus`, `RoleName`
- [x] Migrasi pertama
- [x] Seeder roles + user + dummy penginapan
- [x] Verifikasi data masuk

### Revisi skema (perubahan scope) ✅
- [x] `room_types`: ganti `price_per_night` → **`price_weekday` + `price_weekend`**; hapus jam check-in/out per-unit (pindah ke `settings`)
- [x] `bookings`: tambah **`adults`, `children`, `extra_bed_qty`, `extra_bed_price`, `ktp_photo_url` (nullable), `payment_status`, `is_price_override`, `notes`, `cancelled_at`**; `price_snapshot` tetap ada. Default status **`CONFIRMED`** (langsung aktif saat admin input — bukan booking menggantung)
  - [x] ⏳ **Revisi lanjutan (temuan dari price list resmi, PROJECT.md §11) — SELESAI 2026-08-01:** `extra_bed_price` tunggal **tidak cukup** — real data punya **2 tarif tambah orang** per tipe tenda ("Dengan Ekstra Bed" vs "Tanpa Ekstra Bed"), dan Glorious Campervan malah flat per-orang. Diselesaikan lewat sinkronisasi skema di bawah.

### Sinkronisasi skema ↔ frontend (2026-08-01)

> Skema ditulis di FASE 1 (25 Jul) **sebelum** banyak keputusan desain yang diambil belakangan, jadi sempat drift jauh dari `frontend/lib/data/admin.ts` & `rooms.ts`. Diaudit & disamakan:

- [x] **`BookingStatus` dirombak** — dulu `CONFIRMED / CHECKED_IN / COMPLETED / CANCELLED`, sekarang cuma 4 nilai yang benar-benar DISIMPAN: **`DP / LUNAS / CHECKED_IN / HANGUS`**. `CONFIRMED` dihapus (digantikan pemisahan DP/LUNAS), `CANCELLED` dihapus (digabung ke `HANGUS`, lihat §6.2). `COMPLETED` & `NO_SHOW` **sengaja tidak jadi nilai enum** — status turunan, dihitung di endpoint GET dari tanggal checkout (konsisten dgn `effectiveStatus()` di frontend & rencana FASE 8).
- [x] **`BookingPaymentStatus` (UNPAID/PAID) + kolom `payment_status` DIHAPUS** — redundan & rawan drift: pemisahan DP vs LUNAS di `BookingStatus` sudah jadi status pembayarannya. (`PaymentStatus` di tabel `payments` beda urusan, tetap ada.)
- [x] **Enum baru `BookingChannel` (WHATSAPP / WALK_IN) + kolom `booking_channel`** — sebelumnya sama sekali gak ada di DB padahal di frontend dipakai buat badge, filter, breakdown laporan, & export. Beda dari `BookingSource` yang tetap `MANUAL` untuk dua-duanya (§6.1).
- [x] **Enum baru `ExtraBedType` (WITH_BED / WITHOUT_BED) + kolom `extra_bed_type`**, dan `room_types` dapat **3 kolom tarif nullable**: `extra_bed_price`, `extra_no_bed_price`, `extra_flat_price` (campervan flat per orang) — cocok dgn `extraBedRate()` di `frontend/lib/pricing.ts`.
- [x] **Timestamp transisi disesuaikan** — `confirmed_at`/`cancelled_at`/`completed_at`/`paid_at` dihapus, diganti `lunas_at` + `hangus_at` (+ `checked_in_at` tetap). Yang turunan gak perlu kolom.
- [x] **`bookings.created_at` ditegaskan sebagai "Tgl. Booking"** (beda dari `check_in`) + index baru `created_at` & `booking_channel`.
- [x] **`room_type_translations` nambah `category`, `tagline`, `bed_info`, `bathroom_info`** — semuanya udah tampil di UI tapi belum punya tempat di DB.
- [x] **Seeder diganti 6 unit ASLI** dari price list klien (eagle-hill, royal-kahuripan, camp-jamuju, camp-rasamala, camp-cakrawala, glorious-campervan) — sebelumnya masih placeholder `glamping-deluxe`/`cottage-family`. Contoh booking jadi 2 baris: jalur WhatsApp (multi-tenda, DP) & Walk-in (lunas + check-in seketika).
- [x] 🐛 Bug lama: anotasi `permissions: Record<string, unknown>` di seeder bikin `tsc` gagal (`unknown` gak masuk ke `InputJsonValue` Prisma) — belum pernah ketahuan karena seeder emang gak pernah di-typecheck. Dipersempit ke `Record<string, boolean | string[]>`.
- [x] ⏳ **Migrasi diterapkan (2026-08-01)** — `npx prisma migrate dev --name sync_schema_with_frontend_decisions`, database di-reset & seed berhasil: 6 room type asli, 2 contoh booking (WhatsApp DP + Walk-in Checked-in), translations lengkap. Diverifikasi langsung lewat query, bukan cuma baca log migrasi.
- [x] Tabel baru **`booking_items`** (booking ↔ beberapa tenda: room_type_id, room_unit_id nullable, qty, subtotal_snapshot)
- [x] Tabel baru **`settings`** (key-value konfigurasi global)
- [x] `BookingSource`: **`MANUAL`** (fase 1) + `ONLINE` (fase berikutnya)
- [x] Tandai `WAITING_PAYMENT`/`PAID`/`EXPIRED`/`REJECTED` + `expired_at` sebagai **fase berikutnya** (tetap ada di enum/skema, belum dipakai). **Tidak ada auto-expire di fase 1.**
- [x] Migrasi baru (squash jadi satu `init` bersih — data lama cuma dummy) + update seeder (harga weekday/weekend dummy, source `MANUAL`, status `CONFIRMED`, seed `settings`: jam 14.00/12.00, no. WA, rekening BSI, teks S&K 12 poin, + 1 contoh booking multi-tenda)
- [x] `zh.json` & translations 中文 dikosongkan dulu — struktur tetap multi-bahasa (translations sudah ID+EN sejak awal)

---

## FASE 2 — Autentikasi & RBAC (Backend)

- [x] Module `auth`: login, hash password (bcrypt), generate JWT *(2026-08-01: `POST /auth/login` — bcrypt.compare, JWT via `@nestjs/jwt`, error 401 sama untuk email tak dikenal & password salah biar gak bisa probe akun)*
- [x] JWT strategy + `JwtAuthGuard` *(passport-jwt, Bearer header; `validate()` re-fetch user dari DB tiap request biar akun terhapus/ganti-role gak bisa pakai token lama)*
- [x] `@Roles()` decorator + `RolesGuard` *(SUPER_ADMIN lolos semua cek per §5; route tanpa `@Roles` = cukup JWT). Tambahan: `@CurrentUser()` param decorator*
- [x] Uji: role salah → 403 *(unit test `roles.guard.spec.ts` — 5 kasus lolos; endpoint resource ber-`@Roles` beneran baru ada di FASE 5+, guard-nya sudah siap dipakai)*
- [x] `GET /auth/me` *(protected JwtAuthGuard, balikin user dari token — buat restore session di FE)*
- [x] Frontend: sambungkan `/login` ke API, simpan token (localStorage + Bearer), redirect sesuai role, proteksi route dashboard *(2026-08-01)*
  - `lib/api/client.ts` — fetch wrapper tipis (base URL `NEXT_PUBLIC_API_URL`, attach Bearer, `ApiError` dgn status code)
  - `lib/auth/AuthProvider.tsx` — context sesi (pola sama `I18nProvider`): `login()`/`logout()`, restore sesi dari token tersimpan lewat `GET /auth/me` saat app dibuka, token di localStorage (`dgc_auth_token`)
  - `lib/auth/useRequireRole.ts` — guard client-side dipakai di `DashboardLayout`/`OwnerLayout`: belum login → `/login`; role gak sesuai → dilempar ke home role-nya sendiri (`roleHome.ts`); `SUPER_ADMIN` lolos semua (§5). **UX only** — proteksi asli tetap `RolesGuard` di backend (§4.2)
  - `LoginPage.tsx` ditulis ulang jadi form terkontrol asli (bukan simulasi 2 tombol pilih role) — submit ke `POST /auth/login`, redirect otomatis sesuai role dari respons backend, pesan error 401 vs error lain dibedakan
  - `DashboardLayout`/`OwnerLayout`/`Sidebar`: nama & badge role di header sekarang data user asli (bukan hardcode "Reza Anggara"), tombol Keluar beneran clear token (sebelumnya `<Link href="/login">` doang, gak pernah logout beneran)
  - Diverifikasi end-to-end via browser (bukan cuma baca kode): login ADMIN_PENGINAPAN → `/admin/penginapan`; login OWNER → `/owner`; ADMIN_PENGINAPAN coba akses `/owner` → dipental balik; OWNER akses `/admin/penginapan` → **diizinkan** (§5); refresh halaman → sesi pulih dari token; logout → token kehapus + redirect `/login`; akses dashboard tanpa token → `/login`

**Kriteria selesai:** Admin penginapan TIDAK bisa mengakses endpoint role lain walau memaksa lewat Postman.

---

## FASE 3 — Design System (Frontend) ✅

- [x] Import desain via MCP `claude_design` (tool `DesignSync`, server di `.mcp.json`)
- [x] Design token di `app/globals.css` `@theme`. **Palet: hijau (alam), biru (air), oranye (geothermal).**
- [x] Font via `next/font`
- [x] Komponen dasar: Button, Card, Input, Select, Badge, Modal, Table, DatePicker
- [x] Layout: PublicLayout, DashboardLayout
- [x] i18n: `id.json`, `en.json` + switcher (fallback ID). `zh.json` disiapkan (fase berikutnya)

---

## FASE 4 — Modul Settings (Global)

- [x] Tabel `settings` + seeder nilai awal (§8.3 PROJECT.md) — selesai lewat FASE 1 (tabel + seed jam/WA/rekening/S&K) & FASE 6 (`GET /settings` read-only publik, `backend/src/settings/`)
- [x] Konsumsi setting: no. WA di CTA publik & teks S&K di `/syarat-ketentuan` sudah pakai `GET /settings` — kontennya untuk sekarang cuma bisa diubah lewat edit database, bukan lewat UI admin (lihat Versi 2)

---

## FASE 5 — Modul Penginapan / CMS (Tenda)

### Backend ✅ (2026-08-01)
- [x] CRUD `room_types` (+ translations satu transaksi) — `price_weekday`, `price_weekend` — modul `backend/src/penginapan/room-types/` (`RoomTypesService` + `RoomTypesAdminController` di `admin/room-types`, guard `SUPER_ADMIN`/`OWNER`/`ADMIN_PENGINAPAN`). Slug immutable setelah dibuat (`UpdateRoomTypeDto` meng-omit `slug`, bukan cuma optional). ⏳ **Update 2026-08-01 (sama hari):** dipindah dari `backend/src/room-types/` (flat) ke `backend/src/penginapan/room-types/` — keputusan struktur folder backend per **unit bisnis** (Penginapan/Portal/Cafe), bukan per role; lihat PROJECT.md §13
- [x] CRUD `room_units` — `RoomUnitsAdminController` (`admin/room-units/:id`), tapi **bukan sumber angka ketersediaan** (lihat catatan di bawah) — murni bookkeeping fisik opsional (mis. tandai unit tertentu maintenance), karena form CMS admin cuma edit satu angka `totalUnits`, bukan daftar kode unit
- [x] Upload gambar + galeri (`is_cover`, `sort_order`) — `RoomImagesAdminController`, disk lokal (`multer`, `backend/uploads/room-types/`, di-serve statis via `app.useStaticAssets` di `main.ts`, cocok skema 1-VPS §12). Upload pertama otomatis jadi cover; hapus cover → cover pindah otomatis ke gambar berikutnya
- [x] Endpoint publik: list & detail (fallback bahasa ID) — `GET /room-types`, `GET /room-types/:slug` (`?lang=ID|EN`), cuma munculkan `isActive && !deletedAt`
- [x] **Fungsi cek ketersediaan** — `RoomTypesService.checkAvailability()`, reusable & sudah di-`export` dari module buat dipakai `BookingsModule` (FASE 7). **Keputusan desain:** dihitung dari `totalUnits - Σqty booking_items yang tanggalnya overlap & status ≠ HANGUS` — BUKAN dari hitung baris `room_units`, karena `roomUnitId` di `booking_items` baru diisi saat check-in (§7 PROJECT.md), jadi saat booking pertama dibuat belum ada unit spesifik untuk dicek; levelnya per-tipe (qty), bukan per-unit-fisik
- [x] **Fungsi pilih tarif** weekday/weekend per tanggal — `pricing.util.ts` (`calcStayPrice`, `extraBedRate`), **mirror 1:1** dari `frontend/lib/pricing.ts` (weekend = Sabtu–Minggu, extra bed per malam — asumsi interim §11) supaya dua sisi gak drift
- [x] Soft delete + `created_by` — `deletedAt` + `isActive=false` bareng saat delete; `createdById` dari user login (`@CurrentUser()`)
- 🐛 **2 bug ketemu & dibenerin saat uji manual (bukan cuma baca kode):** (1) `RoomType.facilities` di seeder masih format lama `string[]` key (`'breakfast'`, dst) sedangkan service baca format baru `{icon, label:{id,en}}[]` yang dipakai admin CMS (`FacilityListEditor.tsx`) — bikin 500 di endpoint detail. Diperbaiki dengan menulis ulang seeder pakai data yang sudah dikurasi di `frontend/lib/data/rooms.ts` (icon + label ID/EN asli per unit), bukan bikin data baru asal-asalan. (2) `translations`/`translations.id` yang wajib cuma dipasangi `@ValidateNested()` tanpa `@IsDefined()` — kalau field itu di-omit/kosong, class-validator **diam-diam skip validasi** (gotcha yang sudah dikenal), lolos ke service dan meledak jadi 500 alih-alih 400. Ditambah `@IsDefined()` di kedua level, diverifikasi ulang lewat curl sampai keluar 400 yang benar.
- **Keputusan desain (facilities JSON):** `RoomType.facilities` disimpan sebagai `{icon: string, label: {id: string, en?: string}}[]` — label per-bahasa inline di tiap item, BUKAN kunci saja + lookup terpisah — karena itu yang sudah dibangun form CMS (`FacilityListEditor.tsx`) dan mock (`rooms.ts`). Kolom `RoomTypeTranslation.facilitiesText` (satu blob teks per bahasa) jadi otomatis tidak terpakai jalur ini — dibiarkan ada di skema (tidak dihapus, belum tentu tidak kepake nanti), bukan migrasi baru
- Diverifikasi end-to-end via curl (bukan cuma baca kode): create/update/soft-delete, slug conflict → 409, validasi wajib → 400, upload gambar asli + tolak non-gambar → 400, set-cover & delete-image (reassign cover otomatis), unit duplikat → 409, availability dihitung benar terhadap booking seed (`DGC-SEED01`), semua endpoint admin 401 tanpa token, katalog publik menyembunyikan unit yang di-soft-delete

### Frontend — Admin (`/admin/penginapan/kelola`) ✅ (2026-08-02)
- [x] Tabel + tombol tambah — sekarang fetch dari `GET /admin/room-types`, bukan mock `cmsRooms` lagi
- [x] Form tambah/edit dengan **tab bahasa ID / EN** — 中文 tab **dihapus dari form ini** (bukan cuma disembunyikan): backend (`RoomTypeTranslationsDto`) memang cuma punya `id`/`en`, jadi tab 中文 di mockup lama cuma bakal jadi input yang datanya kebuang diam-diam kalau disimpan — dipotong daripada dibiarkan nipu
  - Multi-bahasa: nama, **kategori** (dipindah dari "Universal" ke sini — di backend `category` itu teks per-bahasa di `RoomTypeTranslation`, bukan dropdown tetap 4 pilihan seperti mockup lama), tagline, deskripsi, info kasur, info kamar mandi, fasilitas (`FacilityListEditor` dipakai apa adanya, cuma dikonversi `{ID,EN}` ↔ `{id,en}` di lapisan API), aturan
  - Universal: slug (cuma muncul & bisa diisi pas mode Tambah; pas Edit ditampilkan disabled — dikunci backend juga), harga weekday/weekend, kapasitas, jumlah unit, **3 tarif tambah orang** (dgn/tanpa ekstra bed + flat), status aktif
  - **Field "Jam Check-in/Check-out" dihapus dari form** (ada di mockup lama) — bukan bagian `room_types` di skema final (§4.6/FASE4: itu setting GLOBAL, belum ada endpoint-nya sampai FASE 4 selesai), jadi jangan dibikin UI yang gak kesambung kemana-mana
  - Catatan: "Tab ID wajib. Jika EN kosong, tampil versi Indonesia."
- [x] Upload galeri (grid thumbnail + tandai cover) — upload asli ke `POST /admin/room-types/:id/images` (multipart), cover badge, tombol ★ jadikan cover & × hapus per gambar. **Constraint yang diikuti dari backend:** upload perlu `roomTypeId` yang sudah ada → pas mode Tambah, galeri disembunyikan diganti pesan "simpan dulu"; begitu Simpan sukses, drawer **otomatis pindah ke mode Edit** buat ID yang baru dibuat, tanpa admin perlu tutup-buka lagi
- 🐛 **Bug ketemu & dibenerin saat uji manual (browser sungguhan, bukan cuma baca kode):** upload gambar / ganti cover / hapus gambar cuma update state drawer lokal, gak nge-refresh tabel di baliknya — thumbnail di tabel utama keliatan basi (placeholder 🏕️ padahal gambar udah kesimpan di server) sampai halaman di-reload manual. Diperbaiki: ketiga handler (`handleUploadImage` kalau gambar pertama jadi cover, `handleSetCover`, `handleDeleteImage` kalau yang kehapus adalah cover) sekarang ikut manggil `refreshList()`.
- Diverifikasi end-to-end di browser sungguhan (login → drawer → simpan → cek balik lewat API): list nampilin 6 unit asli, Edit prefill semua field (termasuk tab EN yang teksnya beda dari ID) sesuai data di database, PATCH nyimpen & persist, Create dgn slug+translations+facilities lengkap → sukses → slug otomatis terkunci, upload gambar asli → 201 tersimpan, hapus (modal konfirmasi `Modal` bukan `window.confirm` biar konsisten visual) → soft-delete, hilang dari tabel

> CMS harus bisa dibangun & diuji dengan **data dummy** — nama/harga asli belum didapat. *(Update: data asli sudah ada sejak FASE 1 revisi, CMS langsung diuji pakai 6 unit real.)*

---

## FASE 6 — Company Profile / Katalog Publik ✅ (2026-08-02)

> **Temuan awal (audit sebelum eksekusi):** beberapa item di sini ternyata butuh modul Settings backend yang belum ada sama sekali (FASE 4 ditunda). Solusinya: bangun versi **minimal read-only publik** (`GET /settings`, `backend/src/settings/` — lintas-unit-bisnis, sejajar `auth/`) sekarang, BUKAN full FASE 4 (form admin CRUD `/admin/settings` tetap ditunda). Detail keputusan & audit lengkap ada di riwayat percakapan sesi ini (Plan Mode, 2026-08-02).

- [x] `/` (homepage) — sambungkan ke data tenda dari API (`GET /room-types`), ganti `localizeRooms(locale)` mock jadi `useEffect` + `fetchPublicRoomTypes(locale)`
- [x] `/tentang` — **sengaja TIDAK disentuh**: audit konfirmasi `AboutPage.tsx`/`lib/data/content.ts` 100% self-contained (atraksi, tiket masuk, parkir, fasilitas — konten informasi statis, gak dimodelkan di Prisma sama sekali), gak ada yang bisa/perlu disambungkan ke backend saat ini
- [x] `/penginapan` (katalog/brosur) — label **"Tenda"/"Villa"** sudah lewat `category` per-bahasa dari API, bukan dropdown tetap
- [x] `/penginapan/[slug]` (detail): galeri (upload asli dari CMS FASE 5), kapasitas, fasilitas, aturan (**direvisi**: satu paragraf, bukan list — `RoomTypeTranslation.rules` di skema memang cuma satu string, bukan array), **harga weekday/weekend**, jam check-in/out (dari `GET /settings`, bukan per-room lagi — sesuai skema, checkIn/Out memang bukan bagian `room_types`)
  - `generateStaticParams` **dihapus** dari `app/penginapan/[slug]/page.tsx` — katalog sekarang dinamis dari API, gak bisa dienumerasi saat build lagi; halaman jadi render-on-demand (`ƒ Dynamic` bukan `● SSG` di output build)
  - Halaman detail sekarang fetch client-side per `[slug, locale]` (bukan lagi data dari server component) — 404 slug ditangani inline (state "tidak ditemukan" + link balik), bukan `notFound()` Next (itu API server-only)
- [x] **CTA "Hubungi Reservasi via WhatsApp"** (link `wa.me` dari settings + pesan template) — nomor WA sekarang dari `GET /settings` (`whatsapp_number`), bukan mock. Template pesan yang sudah ada sebelumnya (generik di `FloatingWhatsApp`, per-unit di `DetailPage`) tidak berubah
- [x] `/syarat-ketentuan` — tampilkan 12 poin S&K dari settings. **Temuan:** `Setting.value` cuma satu string per key (bukan per-bahasa), sedangkan teks S&K butuh ID+EN → disimpan sebagai **2 key terpisah** `terms_conditions_id`/`terms_conditions_en` (pragmatis untuk key-value flat, beda kasus dari `room_type_translations` yang memang tabel relasional). 🐛 **Bug data ketemu sekalian:** seeder lama punya draft S&K generik yang **kontradiktif** ("tidak ada sistem DP" — padahal model bisnis fase 1 pakai DP 50%) — diganti dengan 12 poin resmi klien yang sudah lebih dulu ada di `frontend/lib/data/settings.ts` (dikonfirmasi 2026-07-26), bukan menerjemahkan draft lama
- [x] Pastikan **tidak ada** form checkout / cek-booking / login tamu di sisi publik — diverifikasi lewat grep, sudah bersih sejak dihapus 2026-07-26
- **Keputusan UX (dikonfirmasi user):** ganti bahasa ID/EN di halaman yang datanya dari API sekarang **refetch ke backend** (bukan instan seperti mock yang nyimpan 2 bahasa sekaligus) — cuma bagian konten tenda & S&K yang kena, navbar/footer/label UI tetap instan (dari dictionary `id.json`/`en.json` lokal, gak berubah)
- `next.config.ts` — ditambah `images.remotePatterns` (localhost:3001/uploads + picsum.photos) — wajib, tanpa ini `next/image` error total begitu ada `src` ke host eksternal
- `RoomCard.tsx` — diadaptasi terima `coverImageUrl: string | null` langsung (bukan `HomeImageKey` + `getImage()` lookup), fallback `ImagePlaceholder`
- `lib/data/settings.ts` (mock) — **dihapus** setelah dikonfirmasi zero-import (3 pemakainya sudah pindah ke API)
- `lib/data/rooms.ts` — **sengaja TIDAK dihapus**, masih dipakai 3 komponen admin booking form (`WalkinBookingPage`, `BookingWhatsappPage`, `BookingsPage`) buat dropdown pilih tenda — itu scope FASE 7 yang belum dikerjakan
- Diverifikasi end-to-end di browser sungguhan: home/katalog/detail render data asli + gambar (lewat `remotePatterns`), ganti bahasa ID↔EN memicu refetch & konten berubah (termasuk S&K), slug tidak ada → state "tidak ditemukan" tanpa crash, CTA WhatsApp pakai nomor asli

---

## FASE 7 — Menu Booking WhatsApp & Tamu Langsung (Pencatatan Internal) — *fitur inti fase 1*

> **Update 2026-07-26:** dipecah jadi 2 menu (§6.1 & §8.1 PROJECT.md) — **Booking WhatsApp** (booking sudah dealing di WA, tamu belum tiba, mulai status `DP`) dan **Tamu Langsung** (tamu sudah di lokasi, bayar di tempat, langsung `CHECKED_IN`, skip `DP`/`LUNAS`). Field form sama persis (ikut form reservasi WA resmi klien); yang beda cuma status awal saat disimpan. **Update lanjutan (sama hari):** status booking & status pembayaran digabung jadi satu progres `DP → LUNAS → CHECKED_IN → COMPLETED` (+ cabang `HANGUS`). **Update lanjutan lagi (sama hari):** `CANCELLED` dihapus (digabung ke `HANGUS` — batal manual & tidak pernah datang sama-sama berarti uang hangus), ditambah `NO_SHOW` ("Tidak Datang") khusus untuk booking yang sudah `LUNAS` tapi tidak pernah check-in sampai tanggal checkout — lihat §6.2 PROJECT.md.
>
> **Audit sebelum eksekusi backend (2026-08-04):** ditemukan `RoomGroupEditor.tsx` (form) menyimpan dewasa/anak/extra-bed **per tenda** (tiap grup/unit beda-beda — keputusan desain 2026-07-26: "2 tenda beda tipe bisa beda jumlah orang"), tapi skema `bookings` masih taruh field itu di level **booking** (satu angka buat semua tenda). **Migrasi Prisma dijalankan**: `adults`/`children`/`extraBedQty`/`extraBedType`/`extraBedPrice` dipindah dari `Booking` ke `BookingItem` — sama alasan revisi `extra_bed_price` room_types dulu (skema ditulis sebelum keputusan UX final). Sekalian **foto KTP dihapus total** (kolom `ktpPhotoUrl` di `Booking` ikut dihapus) — lihat PROJECT.md §8.1 untuk alasannya. Detail lengkap di `PROJECT.md` §10.

### Backend ✅ (2026-08-04)
- [x] Generator `booking_code` acak (`DGC-XXXXXX`, unik) — alfabet tanpa 0/O/1/I (hindari salah baca), retry kalau collision
- [x] `POST /admin/bookings`: `booking_source = MANUAL`, `created_by = admin`, status awal **`DP`/`LUNAS`** (Booking WhatsApp, admin pilih) atau **`CHECKED_IN`** (Tamu Langsung, dipaksa server-side apapun yang dikirim client)
- [x] Dukung **multi-tenda** (buat `booking_items`) — diuji sampai 2 tenda beda tipe + extra bed dalam satu booking
- [x] Validasi ketersediaan (`RoomTypesService.checkAvailability`, reuse FASE 5) — cegah double-booking, diuji sampai bener-bener kena `409` pas kapasitas penuh
- [x] Hitung total: Σ(tarif weekday/weekend per tenda × malam) + (extra_bed_qty × extra_bed_price per malam), reuse `calcStayPrice`/`extraBedRate` dari `pricing.util.ts` (FASE 5) — **opsi override** → `is_price_override` + `manualTotal`
- [x] Snapshot total ke `price_snapshot` (per item ke `subtotal_snapshot`) — diverifikasi manual lewat curl, angkanya cocok persis
- ⏳ **Update 2026-08-04 — gap nominal DP dibenerin:** `CreateBookingDto` dapat field baru `paidAmount` (wajib kalau `bookingChannel=WHATSAPP` & `initialStatus=DP` — nominal beneran yang sudah masuk, BUKAN diasumsikan tetap 50% dari S&K, karena nego bisa beda). `BookingsService.create()` sekarang bikin baris `Payment` untuk jalur WhatsApp juga (sebelumnya cuma Walk-in) — `method: BANK_TRANSFER` (di-hardcode, sesuai S&K), `amount` = `paidAmount` (DP) atau total penuh (langsung LUNAS). `updateStatus()` pas transisi ke LUNAS otomatis bikin 1 baris `Payment` lagi buat sisanya (`total − Σpayments PAID`), jadi begitu LUNAS, jumlah `payments` selalu pas sama `price_snapshot`. Response GET (`toAdminBooking()`) dapat field baru `paidTotal` (Σ `payments` yang `PAID`) — dipakai FASE 8/9 nampilin "Sudah dibayar: RpX dari RpY".
- ⏳ **Migrasi skema (audit sebelum eksekusi, lihat catatan di atas):** `adults`/`children`/`extraBedQty`/`extraBedType`/`extraBedPrice` pindah dari `Booking` ke `BookingItem` (per tenda, bukan per booking) + `ktpPhotoUrl` dihapus total. Modul di `backend/src/penginapan/bookings/` (`BookingsService`, `BookingsAdminController` — pola sama `room-types/`).
- ⏳ Walk-in yang baru dibuat sekaligus bikin 1 baris `Payment` (`status: PAID`, `paidAt: now()`) dari field `payMethod` — pemakaian tabel `payments` yang sudah ada, bukan kolom baru di `Booking`.
- ⏳ **`computeEffectiveStatus()`** (COMPLETED/NO_SHOW dari tanggal checkout, §6.2) sudah diimplementasi di `BookingsService` sekalian — dipakai tiap response GET, lihat FASE 8.

### Frontend (`/admin/penginapan/booking-whatsapp` & `/admin/penginapan/walk-in`)
- [x] UI kedua form (mock, belum wired ke API): nama, No. telepon, **pilih tenda**, tanggal check-in/out, **dewasa**, **anak**, **extra bed (jumlah + tarif)**, catatan
- [x] ⏳ **Update 2026-08-04 — foto KTP dihapus total** (bukan cuma dari form, kolom `ktp_photo_url` ikut dihapus dari skema `Booking` lewat migrasi FASE 7): admin sudah menerima foto KTP manual lewat chat WhatsApp saat nego (S&K poin 10 tetap berlaku di luar sistem), jadi gak perlu disimpan lagi. Field upload KTP yang tadinya di form Booking WhatsApp (dulu dekoratif, belum fungsional) dihapus dari UI. Booking WhatsApp: pilih status awal DP/Lunas tetap ada.
- [x] Tamu Langsung: field metode bayar (Tunai/QRIS/Transfer) + catatan otomatis "langsung Check-in"
- [x] ~~`RoomItemsEditor.tsx` (tipe + jumlah tenda saja)~~ — **update 2026-07-26: diganti `RoomGroupEditor.tsx`** (dipakai kedua form Booking WhatsApp & Walk-in — `RoomItemsEditor.tsx` tetap dipakai di modal edit Data Booking). Sekarang tiap grup tenda (tombol "+" nambah grup baru) punya tipe + **dewasa/anak/extra bed sendiri-sendiri** (bukan satu angka gabungan buat seluruh booking) — perlu karena kalau pesan 2 tipe tenda beda, jumlah orang di tiap tenda bisa beda.
  - [x] ⏳ **Revisi lanjutan (sama hari):** field "Jumlah" (qty per tipe) **dihapus** — tiap unit fisik jadi barisnya sendiri (klik + berkali-kali kalau perlu beberapa unit tipe sama), karena kebutuhan tiap unit (dewasa/anak/extra bed) bisa beda-beda, jadi gak bisa digabung pakai satu angka qty.
  - [x] ⏳ **Revisi lanjutan lagi (sama hari, koreksi salah paham sebelumnya):** "Jumlah Extra Bed" **tetap ada seperti semula** (bukan direname) — yang dihapus cuma field **"Jenis Extra Bed"** (with/without) dari `RoomGroupEditor`, defaultnya di-hardcode `'with'` di kode (tidak dipilih admin lagi). `RoomItemsEditor`/modal edit Data Booking **tidak berubah**, masih ada pilihan jenisnya. Sebagai gantinya ditambah info **"X malam weekday, Y malam weekend"** (`calcNightsBreakdown` di `lib/pricing.ts`) di bawah tanggal check-in/out, biar admin lihat kenapa subtotalnya segitu.
- [x] **Auto-hitung total** (`lib/pricing.ts`: `calcStayPrice`, `extraBedRate`, `calcGroupsTotal`) — subtotal per grup tenda (real-time, weekday/weekend per tanggal + extra bed per malam × qty) tampil di tiap kartu, **Total Keseluruhan** di bawahnya, plus **opsi override manual** (toggle "Ubah nominal manual"). Asumsi yang dipakai (belum dikonfirmasi klien, lihat PROJECT.md §11): definisi weekend = Sabtu–Minggu, tarif extra bed dihitung **per malam** (bukan sekali bayar).
- [x] ⏳ **Kedua form beneran ke-wire ke API (2026-08-04):** tombol Simpan sekarang manggil `POST /admin/bookings` sungguhan (`frontend/lib/api/bookings.ts`) — sebelumnya no-op sama sekali. Field `name`/`phone`/`notes`/`paymentStatus`(WA)/`payMethod`(Walk-in) yang tadinya uncontrolled (tanpa `value`/`onChange`) dijadikan controlled state. Karena `RoomGroupEditor` masih pakai data mock `rooms.ts` (slug) buat dropdown sedangkan backend butuh `roomTypeId` numerik, form fetch `GET /admin/room-types` sekali di awal buat bikin pemetaan slug→id (slug-nya sudah sama persis dengan data API asli, jadi aman). Sukses → tampilkan kode booking yang baru dibuat + reset form; gagal (mis. `409` ketersediaan penuh) → pesan error inline, gak crash.
- [x] ⏳ **KETEMU KETINGGALAN DICATAT (audit 2026-08-21):** indikator ketersediaan real-time ternyata **sudah dibangun juga** di sesi terpisah (baru ketahuan pas audit nulis `docs/fitur/`) — `RoomGroupEditor` sekarang query `checkRoomTypeAvailability` per slug (debounced 500ms) dan tampilkan status full/rendah/oke inline per grup tenda, memperhitungkan slug yang sama dipakai di grup lain dalam form yang sama biar gak overselling dalam satu form. Submit tetap diblok kalau ada grup yang resolve ke tidak tersedia. Validasi kapasitas/anak otomatis (di luar ketersediaan unit) tetap belum ada — itu masih benar tertunda.
---

## FASE 8 — Perubahan Status Booking

> **Update 2026-07-26:** menu Check-in terpisah **dihapus** — perubahan status (termasuk check-in) sekarang dilakukan langsung dari menu Data Booking (klik baris → detail → tombol aksi). Lihat PROJECT.md §6.2 & §7.

- [x] ⏳ **Backend `PATCH /admin/bookings/:code/status` — selesai duluan di FASE 7 (2026-08-04)**, karena satu resource `BookingsService` yang sama: transisi `DP → LUNAS → CHECKED_IN` forward-only, `→ HANGUS` kapan saja sebelum check-in (ditolak `409` kalau sudah `CHECKED_IN`). Validasi mundur/loncat diuji manual sampai bener-bener kena `409` (DP→CHECKED_IN loncat, CHECKED_IN→LUNAS mundur, HANGUS dari CHECKED_IN).
- [x] ⏳ **Backend: `computeEffectiveStatus()` — selesai duluan di FASE 7.** `COMPLETED` (dari `CHECKED_IN` + checkout lewat) & `NO_SHOW` (dari `LUNAS` + checkout lewat, belum checked-in) dihitung di `BookingsService`, port persis logika `effectiveStatus()` frontend (`lib/data/admin.ts`) — bukan kolom, bukan cron.
- [x] ⏳ **Update 2026-08-04 — beneran wired:** tombol "Tandai Lunas" / "Tandai Check-in" di `BookingsPage.tsx` sekarang manggil `PATCH /admin/bookings/:code/status` sungguhan (refresh list on success, error inline kalau ditolak mis. `409`). **"Batalkan Booking" (HANGUS manual) tetap sengaja tidak dipasang** (keputusan lama, dikonfirmasi ulang — HANGUS murni status turunan otomatis). **"Edit Tanggal"/"Edit Booking" dihapus sementara dari modal** (bukan cuma disembunyikan-tanpa-alasan): editor lama (`RoomItemsEditor.tsx`, shape `{slug,qty}`) sudah gak cocok sama model per-tenda (`adults`/`children`/`extraBedQty` sekarang di `BookingItem`, bukan level `Booking`), dan endpoint `PATCH /admin/bookings/:code` buat edit-penuh belum dibangun — daripada nampilin tombol yang keliatan ada tapi gak nyimpen beneran, ditunda ke sesi terpisah. File `RoomItemsEditor.tsx` ikut dihapus (zero-import setelah ini, konsisten sama kebiasaan `lib/data/settings.ts` di FASE 6).

---

## FASE 9 — Dashboard Admin Penginapan

- [x] ⏳ **Update 2026-08-04 — `OverviewPage.tsx` (Ringkasan) sekarang beneran API**, bukan mock lagi: fetch `GET /admin/bookings` + `GET /admin/room-types` sekaligus (`Promise.all`, pola sama `KelolaPage.tsx`/`BookingsPage.tsx`) — loading/error state + retry. Data dipetakan lewat adapter `toOverviewBooking()` ke shape mock `AdminBooking` persis, biar fungsi yang sudah ada (`occupiedQtyOnDate`, `bookingsOnDate`, `getRecentBookings`, `effectiveStatus`) tetap kepakai apa adanya **tanpa mengubah `lib/data/admin.ts` sama sekali** (file itu masih dipakai Dashboard Owner & dropdown 2 form Tambah, di luar scope sesi ini). 4 stat card (booking hari ini, belum lunas, okupansi, pendapatan bulan ini) + tabel booking terbaru + kalender okupansi bulanan sekarang semuanya dari data booking asli.
  - **Total kapasitas** dihitung dari `Σ totalUnits` tipe tenda yang `isActive === true` saja (`GET /admin/room-types`, ganti `cmsRooms.reduce(...)`) — tipe yang dinonaktifkan gak dihitung sebagai kapasitas operasional.
  - **Status booking dihitung ulang di client** lewat `effectiveStatus()` yang sudah ada (bukan field `effectiveStatus` API) — beda dari `BookingsPage.tsx` yang pakai field API langsung. Alasannya: `occupiedQtyOnDate`/`bookingsOnDate` manggil `effectiveStatus()` secara internal (hardcode, bukan parameter), jadi adapter cukup isi status MENTAH (DP/LUNAS/CHECKED_IN/HANGUS) dan biarkan fungsi lokal menghitung ulang COMPLETED/NO_SHOW dari `checkOut` — algoritmanya PERSIS sama dengan `computeEffectiveStatus()` backend (memang aslinya di-port dari fungsi ini di FASE 7), jadi duplikasi ini sudah by-design, bukan risiko drift baru.
  - ⏳ **Update 2026-08-05 — kalender & pendapatan diperhalus:** (1) klik tanggal di kalender okupansi sekarang sekalian nampilin **sisa unit per tipe tenda** (bukan cuma total gabungan), pakai `occupiedQtyOnDate(bookings, tanggal, roomSlug)` yang parameter `roomSlug`-nya memang sudah ada dari awal — tinggal di-loop per tipe aktif. (2) Tanggal **hari ini** di kalender dikasih outline (awalnya hijau, direvisi ke warna terracotta karena kemiripan sama ring "tanggal dipilih" bikin bingung), dan panel detail tanggal sekarang **default kebuka di hari ini** saat halaman dibuka (gak perlu klik dulu). (3) **Stat card baru "Pendapatan Hari Ini"** + **"Pendapatan Bulan Ini" dirombak total** — dua-duanya sekarang dihitung dari tanggal **transaksi (`Payment.paidAt`) tercatat**, BUKAN dari `priceSnapshot` (nilai kontrak penuh) atau tanggal check-in booking-nya. "Hari ini" = transaksi yang `paidAt`-nya hari ini, "Bulan ini" = transaksi yang `paidAt`-nya bulan berjalan (Agustus sendiri, September nanti sendiri, dst) — persis logika buku kas, bukan "kapan tamu menginap". Butuh field baru `payments[]` (daftar transaksi mentah PAID per booking, bukan cuma agregat `paidTotal`) ditambahkan ke response `toAdminBooking()` (backend) dan tipe `AdminBookingDetail` (frontend). (4) **"Booking Terbaru" diganti jadi "Transaksi Hari Ini"** — sebelumnya nampilin 5 booking dengan `checkIn` paling akhir (`getRecentBookings`), sekarang nampilin SEMUA booking yang **`createdAt`-nya hari ini** (bukan check-in hari ini), diurutkan dari paling baru dibuat, plus kolom **Jam** (`createdAt` di-format jam:menit) biar admin tahu transaksi masuk jam berapa. Baris **bisa diklik → modal detail** yang sama persis dengan menu Data Booking (tombol Tandai Lunas/Tandai Check-in/Hubungi WA beneran manggil API & refresh). Modal + adapter (`toDisplay`/`displayStatus`/`DisplayBooking`) yang tadinya cuma ada di `BookingsPage.tsx` **diekstrak jadi komponen bersama** `BookingDetailModal.tsx` biar dipakai 2 halaman tanpa duplikasi ~200 baris kode. (5) **Tabel baru "Check-in Hari Ini"** ditambahkan (booking yang `checkIn`-nya hari ini) — buat admin reservasi tahu & nyiapin unit sebelum tamunya datang, baris juga bisa diklik ke modal detail yang sama. Sebagai gantinya, **daftar booking per-tanggal di panel detail kalender okupansi dihapus** (dulu muncul pas klik satu tanggal, isinya kode+nama+tipe) — sudah jadi redundant sama tabel baru ini untuk tanggal hari ini; panel kalender tetap nampilin ringkasan unit terisi + breakdown per tipe tenda, cuma daftar booking mentahnya yang dibuang. Diurutkan **LUNAS → DP → CHECKED_IN** (bukan cuma nama tamu) — yang belum check-in (masih perlu disiapin unitnya) tampil duluan, yang statusnya udah CHECKED_IN (kamar sudah ditempati, tinggal riwayat) ditaruh paling bawah; dalam grup status yang sama diurutkan nama.
- [x] ⏳ **Update 2026-08-04 — `BookingsPage.tsx` (Data Booking) sekarang beneran API**, bukan mock lagi: state `bookings` diisi dari `GET /admin/bookings` (loading/error state, pola sama `KelolaPage.tsx`), lengkap dengan retry kalau gagal. Filter/search/`RangeFilter`/pagination/Export PDF & Excel — **logic-nya tidak berubah sama sekali**, cuma sumber array & nama field yang disesuaikan lewat adapter `toDisplay()` (map `AdminBookingDetail` API ke shape lama `kode`/`guest`/`wa`/`rooms`/dst biar fungsi lama `roomsSummary`/`roomItemLabel`/`bookingsInRange` tetap kepakai apa adanya). Status tampilan sekarang pakai `effectiveStatus` langsung dari API (`computeEffectiveStatus()` FASE 7), bukan panggil ulang fungsi lokal — hindari drift 2 implementasi. **Catatan:** `lib/data/admin.ts` (`adminBookings` mock) TIDAK disentuh — masih dipakai Dashboard Owner & dropdown tenda 2 form Tambah; Dashboard Owner jadi **belum** mencerminkan booking asli yang baru dibuat (scope FASE 10 terpisah). 4 stat card Ringkasan (`/admin/penginapan`) juga di luar scope ini.
- [x] `/admin/penginapan/booking` — tabel (dulu mock, sekarang API — lihat update di atas):
  - Kolom: kode, nama, WA, tenda, check-in/out, sumber, total, **status gabungan**, aksi
  - Badge status (revisi 2026-07-26: DP / Lunas / Check-in / Selesai / Hangus / Tidak Datang — lihat §6.2 PROJECT.md)
  - Filter: status (5 nilai), sumber (WhatsApp/Walk-in), **tanggal check-in spesifik** (opsional, bisa dihapus), **bulan+tahun** (default bulan berjalan, **wajib terisi — tidak bisa dikosongkan**, biar data yang numpuk berbulan-bulan gak ditampilin semua sekaligus); search kode/nama/**no. WA**; **pagination 15/20 per halaman**
  - Modal detail (klik baris) — **update 2026-07-26**: dibikin lebih detail & dikelompokkan per section (Data Tamu / Detail Menginap / Pembayaran) — Dewasa, Anak-anak, Extra Bed, Catatan sekarang ikut ditampilkan biar admin gampang nyiapin unitnya. ⏳ **Update 2026-08-04 (data API asli):** baris "status Foto KTP" **dihapus** (kolom `ktp_photo_url` sudah gak ada di skema, FASE 7). Dewasa/Anak/Extra Bed sekarang ditampilkan **per-tenda** (dari `booking.items[]`, lebih akurat dari mock lama yang cuma satu angka gabungan). Section Pembayaran tampilkan **"Sudah dibayar: RpX dari RpY"** pakai field `paidTotal` baru (lihat FASE 7 Bagian 0). Tombol "Hubungi via WA" (dulu dekoratif tanpa `onClick`) di-wire ke link `wa.me` beneran.
  - [x] Tombol "Tandai Hangus" manual **dihapus** — Hangus sekarang murni status turunan otomatis (§6.2), tidak ada aksi manual buat itu lagi
  - [x] ⏳ **Keputusan direvisi 2026-08-04:** rencana lama "Edit Booking diperluas jadi edit seluruh isi" **dibatalkan (sementara)** — begitu halaman ini benar-benar di-wire ke API asli, editor lama (`RoomItemsEditor.tsx`, shape `{slug,qty}`) ketahuan sudah gak cocok sama model per-tenda yang baru, dan endpoint `PATCH /admin/bookings/:code` buat edit-penuh belum dibangun. **Tombol & mode Edit Booking dihapus sementara dari modal** (bukan disembunyikan doang) — ditunda ke sesi terpisah yang butuh endpoint baru + editor baru (kemungkinan mirip `RoomGroupEditor.tsx` per-tenda, bukan `RoomItemsEditor.tsx` per-qty). File `RoomItemsEditor.tsx` dihapus (zero-import).
  - [x] ⏳ **KETEMU KETINGGALAN DICATAT (audit 2026-08-21):** fitur Edit Booking ternyata **sudah dibangun** di sesi terpisah setelah entry di atas ditulis, tapi TASK.md gak pernah diupdate — baru ketahuan pas nulis dokumentasi per-fitur (`docs/fitur/`) dan cek ulang kode sungguhan. Sudah ada: `EditBookingDto` (backend, `guestName`/`guestPhone`/`checkIn`/`checkOut`/`items[]`/`priceOverride`/`discount` semua opsional + `note` wajib min 3 karakter alasan edit), `BookingsService.editBooking()` — hitung ulang harga only kalau tanggal/kamar berubah (reuse `checkAvailability` per item, exclude booking-nya sendiri biar gak collide sama diri sendiri), diff field-by-field jadi `changes` object, simpan ke tabel `bookingEditLog` (siapa yang edit, kapan, alasan, before/after tiap field) dalam satu transaksi bareng update booking-nya. Frontend: `app/admin/penginapan/booking/[code]/edit/page.tsx` → `EditBookingPage.tsx` (447 baris), tombol "Edit" di `BookingDetailModal.tsx` selalu tampil (gak digate status tertentu, cuma disable pas ada update lain in-flight), dan modal itu sendiri sekarang render **"Riwayat Edit"** — timeline semua editLog terbalik-kronologis dengan before/after per field. **Tidak ada validasi "maks H-7"** yang disebut §6.1 — masih belum diimplementasi.
  - [x] ⏳ **Filter periode disamain sama pola Owner (update 2026-07-26, direvisi lagi hari yg sama):** sempat dicoba pakai filter rentang manual "Dari Tanggal"–"Sampai Tanggal", tapi akhirnya diganti supaya **konsisten sama dashboard Owner** — pakai komponen `RangeFilter` yang sama persis (Hari Ini/Minggu Ini/Bulan Ini/Custom), sekarang dipindah ke `components/ui/RangeFilter.tsx` (tadinya di `components/owner/`) biar reusable lintas dashboard. Filter tanggal check-in spesifik (yang lama) **dikembalikan lagi sebagai filter TAMBAHAN** ("Cari Tanggal Check-in", opsional/clearable) — cuma buat mempersempit tabel di layar, **sengaja TIDAK ikut ke Export PDF** (PDF tetap ngikutin rentang RangeFilter aja, biar laporannya konsisten per periode, gak keganggu filter pencarian sesaat). i18n label 4 tombol rentang dipindah dari namespace `owner.*` ke `common.*` karena sekarang dipakai lintas dashboard.
  - [x] ⏳ **Selector "Tampilkan 15/20" per-halaman dihapus (update 2026-07-26):** pagination sekarang tetap ada (Sebelumnya/Berikutnya + "Halaman X/Y") tapi ukurannya di-hardcode `PAGE_SIZE = 20`, gak ada pilihan lagi — dianggap gak perlu dikonfigurasi user.
  - [x] ⏳ **Search dibikin independen dari filter lain (update 2026-07-26):** begitu kotak pencarian keisi, filter Periode/Status/Sumber **diabaikan sepenuhnya** — search jalan ke SEMUA booking (bukan cuma yang lolos filter lain), biar gampang nemuin booking spesifik walau lagi difilter periode/status/sumber yang beda. Dropdown Status/Sumber ikut disabled (opacity turun) selama search aktif biar jelas keliatan lagi gak dipakai, plus ada catatan kecil di bawah kotak search ("Pencarian aktif — mengabaikan filter periode/status/sumber..."). Konsekuensinya: Export PDF pas search aktif juga ikut nurut hasil pencarian (bukan periode), konsisten sama apa yang keliatan di layar. Filter "Cari Tanggal Check-in" tetap independen dari ini — tetap jalan di atas hasil manapun (search-mode atau filter-mode biasa).
  - [x] ⏳ **Alignment filter bar dibenerin (update 2026-07-26):** `RangeFilter` sebelumnya gak punya label di atasnya, beda tinggi sama field "Cari Tanggal Check-in" yang punya label uppercase kecil di atas — bikin jomplang pas disejajarkan. Dibungkus pakai `FilterField` yang sama (label "Periode") biar tinggi & alignment-nya konsisten. Tombol Export dipindah ke barisnya sendiri (kanan bawah) biar gak keganggu logic disable pas search aktif.
  - [x] ⏳ **Export Excel (update 2026-07-26):** tombol "Export Excel" ditambahin di sebelah "Export PDF", pakai `ExcelJS` (bukan `xlsx`/SheetJS versi gratis yang stylingnya sangat terbatas) — `lib/excel/bookingReport.ts`. Hasilnya beneran ".xlsx" bergaya: header brand dark green+terracotta (sama kayak PDF), Ringkasan Angka + breakdown Status/Sumber, lalu tabel detail dengan header bold+fill gelap, baris selang-seling, **autofilter** & **freeze header row** (biar tetap keliatan pas scroll data panjang) — kolom Total & Jumlah breakdown tetap **angka asli** (bukan teks terformat kayak di PDF) pakai `numFmt` Rupiah/persen, jadi bisa langsung dijumlah/diurutkan/difilter native di Excel. Logic angka ringkasan (`buildExportSummary()`) di-share bareng Export PDF biar dua format selalu konsisten, gak ada hitungan ganda yang bisa beda sendiri-sendiri.
  - [x] ⏳ **Export Excel (.xlsx) (update 2026-07-26):** tombol "Export Excel" di samping "Export PDF", pakai `exceljs` (`lib/excel/bookingReport.ts`) — bukan SheetJS/`xlsx` gratis yang nyaris gak bisa styling. Ikut filter aktif yang sama persis dengan PDF (logic ringkasannya di-share lewat `buildExportSummary()` biar gak ada perhitungan ganda yang bisa ketinggalan sinkron). Kolom Total disimpan sebagai **angka asli** (bukan teks) + `numFmt` Rupiah, jadi bisa langsung dijumlah/diurutkan di Excel; ada baris TOTAL pakai formula `SUM()` beneran, plus autofilter di header.
    - **Polish tampilan (update 2026-07-26):** (1) area di luar konten dicat warna "meja kerja" krem (`CANVAS`) — gridline dimatikan, jadi kalau dibiarkan putih polos batas laporannya gak keliatan sama sekali; (2) angka ringkasan tadinya dikirim sebagai **string** → Excel nandain tiap sel pakai segitiga hijau *"number stored as text"* & nilainya gak bisa dihitung; sekarang dikirim sebagai `number` + `numFmt` Rupiah; (3) swatch warna + label breakdown digabung ke SATU cell pakai `richText` — sebelumnya swatch di kolom terpisah yang lebar, jaraknya menganga jauh; (4) tambahan garis aksen penutup band header, zebra striping eksplisit, tinggi baris konsisten, `wrapText` di header tabel.
    - ⚠️ **Bug freeze pane (ketemu & dibenerin hari yang sama):** versi pertama naruh ringkasan + tabel dalam SATU sheet, lalu freeze di baris header tabel yang jatuh di baris **24** → `ySplit=24` mengunci 24 baris teratas (hampir setinggi jendela Excel), efeknya file kelihatan "gak bisa di-scroll ke bawah". Sempat salah didiagnosis sebagai "spec pane kurang lengkap" — ternyata murni salah desain layout. Fix: dipecah jadi **2 sheet** ("Ringkasan" + "Detail Booking"), header tabel di sheet kedua ditaruh di baris 5 → `ySplit=5`, scroll normal lagi. Diverifikasi dengan bongkar XML hasil generate-nya (`xl/worksheets/sheet2.xml` → `<pane ySplit="5" .../>`), bukan cuma nebak.
  - [x] ⏳ **PDF Data Booking dirapikan, ganti landscape (update 2026-07-26):** nambah kolom "Tgl. Booking" bikin tabelnya 10 kolom — kesempitan parah di potret sampai header ("Tgl. Bo|oking") dan isi ("WhatsAp|p") kepotong tengah kata. Fix: (1) `exportReportPdf` (`lib/pdf/report.ts`) sekarang terima parameter opsional `orientation` ('portrait' default, 'landscape' buat tabel lebar) — dipakai laporan Data Booking Admin aja (laporan Owner tetap potret, kolomnya udah pas); (2) kolom "Tipe" di PDF pakai `roomsSummaryShort()` (baru, `lib/data/admin.ts`) yang buang kategori tenda ("Royal Kahuripan" bukan "Royal Kahuripan — Glamping") — tabel di layar tetap pakai `roomsSummary()` biasa (kategori penuh), cuma versi PDF yang dipendekin. Diverifikasi lewat inspeksi `jspdf-autotable` langsung (`table.columns[i].width >= wrappedWidth` di semua kolom = gak ada yang kepaksa wrap).
  - [x] ⏳ **Field baru `createdAt` — tanggal booking DIBUAT, beda dari `checkIn` (update 2026-07-26):** ditambahin ke `AdminBooking` (`lib/data/admin.ts`), semua 29 baris mock diisi ulang manual (WhatsApp: beberapa hari sebelum check-in, ada jeda nego di WA; Walk-in: sama persis dengan `checkIn`, dicatat pas tamu datang langsung). Ditampilkan di kolom baru "Tgl. Booking" pada tabel Data Booking (sebelum kolom Check-in), di Detail Modal (Detail Menginap, view baca-saja — sengaja TIDAK bisa diedit karena ini fakta historis), dan di Export PDF. **Catatan:** form "Booking WhatsApp"/"Tamu Langsung" ternyata belum benar-benar nyimpen ke `adminBookings` sama sekali (tombol Simpan belum ada `onClick`, masih murni UI mockup) — jadi belum ada tempat buat nyetel `createdAt` otomatis saat booking baru dibuat; nanti nyusul pas form itu beneran diwire ke state/API.
  - [x] ⏳ **Export PDF (update 2026-07-26):** tombol "Export PDF" ditambahin di filter bar (kanan atas, sebelah selector per-halaman). Isinya ngikutin filter yang lagi aktif (search/status/sumber/**rentang tanggal**) — **bukan cuma halaman yang lagi ditampilin di layar** (pagination 15/20 di UI gak ngaruh ke export, semua hasil filter tetap ikut, auto-pagination sendiri di PDF-nya lewat `autoTable`). Isi: 4 stat ringkas (Total Booking, Total Pendapatan, Belum Lunas, Sedang Menginap), breakdown Distribusi Status & Sumber Booking, lalu tabel penuh. Dipakein modul PDF yang sama kayak Owner (`lib/pdf/report.ts`, sekarang digeneralisasi jadi `exportReportPdf` + parameter `theme` biar tiap dashboard bisa pakai warna brand-nya sendiri — Owner dark+gold, Admin dark green+terracotta lewat `ADMIN_REPORT_THEME`).
- [x] ⏳ **UI mobile Admin — bottom nav (update 2026-07-26):** disamain polanya sama dashboard Owner (lihat FASE 10). Sebelumnya `<Sidebar className="hidden md:flex" />` bikin menu Admin hilang total di HP tanpa pengganti — gak ada cara pindah menu maupun logout. Ditambahkan di `DashboardLayout.tsx`: bottom nav `fixed md:hidden` (5 menu), brand mark di header kiri buat mobile (judul halaman disembunyikan), dropdown akun+logout lewat avatar, `pb-24` di `<main>` biar konten gak ketutup, padding `env(safe-area-inset-bottom)`.
  - Daftar menu dipindah jadi satu sumber `useAdminNavItems()` di `Sidebar.tsx` (dipakai bareng sidebar desktop & bottom nav) + field `shortLabel` khusus mobile — label panjang ("Kelola Penginapan", "Booking WhatsApp") gak muat di tab selebar ~70px, jadi dipendekin ("Kelola", "WhatsApp").
  - 🐛 **Bug lama ikut kebenerin:** deteksi menu aktif dulu pakai `pathname.startsWith(href)` polos, jadi pas di `/admin/penginapan/booking-whatsapp` menu "Data Booking" (`/admin/penginapan/booking`) ikut nyala barengan. Diganti `isAdminNavActive()` yang bandingin `href + '/'`. Kalau gak dibenerin, bug-nya bakal kelihatan dobel (sidebar + bottom nav).
- [x] ⏳ **Proteksi semua route dashboard sesuai role — dites & dikonfirmasi 2026-08-21:** RBAC diperketat (§5 PROJECT.md) + diuji end-to-end di browser (ADMIN_PENGINAPAN/SUPER_ADMIN dipental dari `/owner`, OWNER boleh akses `/admin/penginapan`, redirect otomatis kalau sudah login buka `/login`) + backend via curl (401 tanpa token, 403 role salah)

---

## FASE 10 — Dashboard Owner

> **Update 2026-07-26:** Ringkasan Owner tadinya 100% angka dummy hardcoded (termasuk yang sudah kadaluarsa: nama kamar fiktif lama, "Online vs Walk-in", transaksi Tiket Masuk palsu ikut nyampur). Sekarang semua dihitung dari `adminBookings` yang sama dengan Data Booking admin (`lib/data/owner.ts`, fungsi `calc*`) — masih mock (belum API), tapi angkanya jujur/konsisten dgn data yang sama di seluruh dashboard.
>
> **Update 2026-08-21 — beneran ke API, bukan mock lagi:** seluruh `lib/data/owner.ts` di-refactor — semua fungsi `calc*` sekarang **wajib** menerima `bookings`/`rooms` sebagai parameter (tidak ada lagi fallback diam-diam ke `adminBookings` mock). `OwnerOverviewPage.tsx` & `OwnerPenginapanPage.tsx` fetch `GET /admin/bookings` + `GET /admin/room-types` sendiri (pola sama Admin `OverviewPage.tsx` FASE 9) + loading/error state. Adapter `toOverviewBooking()` yang tadinya private di `OverviewPage.tsx` dipindah jadi `toAdminBookingMock()` (`lib/api/bookings.ts`, di-export) — dipakai bersama 3 halaman (Admin Overview + 2 halaman Owner), bukan 3 salinan nyaris identik. Diverifikasi lewat browser sungguhan: booking test yang dibuat lewat form Admin (`DGC-AT4JNH`) langsung ikut kehitung di Dashboard Owner tanpa refresh manual data — sebelumnya nyangkut di 29 baris mock, sekarang benar-benar live. `npx tsc --noEmit`, `npx eslint`, dan `npx next build` semua lolos setelah refactor.

- [x] ⏳ **`/owner` — proteksi RBAC beres & dites 2026-08-21:** eksklusif **`OWNER` saja** (revisi §5 PROJECT.md — `SUPER_ADMIN` tidak lagi diizinkan masuk sini, punya hub sendiri `/super-admin`), ditegakkan `useRequireRole(['OWNER'])` + diuji end-to-end di browser
- [x] Filter rentang tanggal (hari ini / minggu ini / bulan ini / **custom**) — **beneran nge-filter** sekarang, bukan cuma UI. **Update 2026-07-26:** "Custom" sekarang beneran bisa pilih tanggal dari–sampai sendiri (`RangeFilter.tsx`, dipakai bareng di Ringkasan & Penginapan) — kalau belum diisi, sementara jatuh ke default "Bulan Ini"
- [x] 4 stat card + indikator naik/turun **vs periode sebelumnya yang sesuai** (kemarin/minggu lalu/bulan lalu, bukan selalu "vs bulan lalu")
- [x] Grafik garis: tren pendapatan 6 bulan (real, dari `adminBookings`) — skala Y sekarang dinamis mengikuti data asli (bukan hardcode 140–340 yang cuma cocok buat angka dummy lama)
- [x] Grafik batang: pendapatan per unit bisnis (Penginapan real, Tiket & Cafe → "Belum aktif") — skala juga dinamis
- [x] Donut: proporsi booking per tipe tenda — 6 unit asli, bukan nama fiktif lama
- [x] Donut: sumber booking → **WhatsApp vs Walk-in** (bukan "Online vs Walk-in" — booking online belum ada di Fase 1)
- [x] Tabel booking terbaru — sekarang cuma booking penginapan asli (dulu campur transaksi "Tiket Masuk" fiktif padahal sistemnya belum ada), kolom "Metode" diganti "Status" (DP/Lunas/Check-in/dst, sesuai model status yang sudah ada)
- [x] ⏳ **Export laporan PDF (update 2026-07-26):** tombol "Export Laporan" di Ringkasan sekarang beneran jalan — generate PDF terprogram via `jsPDF` + `jspdf-autotable` (`lib/pdf/ownerReport.ts`), **bukan screenshot halaman** (html2canvas dsb.) biar teksnya tajam & gampang dibaca, bukan raster buram. Isinya sesuai filter rentang yang lagi aktif (`range`/`customRange` saat tombol diklik): header brand (dark+gold, sama kayak tema Owner), 4 stat card, kontribusi 3 unit bisnis, tabel detail booking (bukan cuma 8 terbaru — semua booking dalam rentang, auto-pagination lewat `autoTable` kalau panjang), footer nomor halaman di tiap halaman. Label tombol diubah jadi "Export Laporan (PDF)" (drop "/ Excel" — belum diimplementasi, jangan janji fitur yang belum ada).
  - Export Excel masih belum ada — nanti nyusul kalau dibutuhkan.
- [x] ⏳ **Export PDF juga di `/owner/penginapan` (update 2026-07-26):** tombol "Export Laporan" baru ditambahin di halaman ini (sebelumnya cuma ada di Ringkasan), pola visual disamain persis (header dark+gold, stat card, dst) via `lib/pdf/ownerReport.ts` yang digeneralisasi supaya reusable dua halaman — parameter `units`/`bookings` yang tadinya spesifik-Ringkasan diganti jadi `breakdowns` (list section legenda donut, bisa lebih dari satu — di sini "Booking per Tipe" + "WhatsApp vs Walk-in") & `table` generik (di sini "Performa per Tipe Tenda", bukan daftar booking). Isinya juga ngikutin filter rentang aktif di halaman ini.
- [x] Menu sidebar "Tiket Masuk" & "Cafe" badge **Coming Soon** — sudah ada badge SOON, disabled (render `<div>`, bukan `<Link>`, jadi memang gak bisa diklik)
- [x] ⏳ **Route asli per menu (update 2026-07-26):** `OwnerDashboard.tsx` (tab-switch di 1 komponen) **dihapus**, diganti `OwnerLayout.tsx` (shell sidebar+header, dipakai bareng) + `OwnerOverviewPage.tsx`/`OwnerPenginapanPage.tsx`/`OwnerLaporanPage.tsx` masing-masing punya route sendiri (`/owner`, `/owner/penginapan`, `/owner/laporan`) — konsisten sama pola Admin
- [x] **`/owner/penginapan` diisi konten real** (`calcRoomTypePerformance` di `lib/data/owner.ts`): tabel performa per 6 tipe tenda (booking, pendapatan, okupansi rata-rata) + link "Kelola detail di menu Admin →". ⚠️ Pendapatan booking yang mencakup >1 tipe tenda **diaproksimasi proporsional per qty** (`AdminBooking.total` cuma satu angka gabungan, belum ada subtotal per tipe yang tersimpan) — sudah dikasih catatan di UI, bukan pemisahan harga presisi
- [x] **Bar chart "Pendapatan per Tipe Tenda"** (update 2026-07-26) — dipasang cuma di halaman Penginapan, sengaja **tidak** dipasang di semua halaman (lihat diskusi: Ringkasan udah ada chart, Laporan gak butuh chart karena fungsinya export bukan analitik, halaman operasional Admin tetap tabel/form polos)
- [x] ⏳ **Kolom "Terisi" (okupansi per tipe) dihapus lagi** (sama hari) dari tabel performa — rata-rata harian bikin tipe yang jarang dipesan keliatan 0%/rendah padahal wajar buat bisnis berkembang, kurang actionable buat Owner. `RoomTypePerformance` di `lib/data/owner.ts` juga dirapiin, gak hitung itu lagi
- [x] **Link CTA diganti** dari "Kelola detail di menu Admin" (ke `/admin/penginapan/kelola`, CMS konten) jadi **"Lihat Detail Booking →"** (ke `/admin/penginapan/booking`, Data Booking) — lebih pas sama isi tabelnya (performa booking, bukan edit konten tenda)
- [x] ⏳ **Istilah "Okupansi" disederhanakan buat Owner (update 2026-07-26):** stat card Ringkasan diganti jadi lebih awam ("Rata-rata Tenda Terisi") — istilah "Okupansi" di dashboard Admin (Ringkasan & kalender) sengaja **tidak diubah**, staf operasional lebih familiar sama istilah itu. *(Kolom "Terisi" di tabel performa tipe tenda sendiri sudah dihapus total, lihat poin di atas.)*
- [x] ⏳ **Donut "Booking per Tipe" & "WhatsApp vs Walk-in" dipindah ke `/owner/penginapan` (update 2026-07-26):** sebelumnya di Ringkasan, tapi keduanya breakdown spesifik penginapan (tipe tenda & channel booking) — lebih pas jadi deep-dive di halaman Penginapan. Sekalian ditambahin klik-untuk-detail di kedua donut (`Charts.tsx`, `DonutChart`): tap legend/segment nampilin jumlah booking + estimasi Rp inline (bukan popup terpisah, lebih enak buat mobile) — perlu tambahan `revenue` proporsional per segmen di `calcBookingByType`/`calcBySource` (`lib/data/owner.ts`), pakai pendekatan estimasi proporsional-qty yang sama kayak `calcRoomTypePerformance`.
- [x] ⏳ **Donut baru "Kontribusi per Unit Bisnis" di Ringkasan (update 2026-07-26):** slot donut yang kosong abis 2 donut di atas dipindah, sekarang diisi perbandingan 3 unit bisnis (Penginapan/Tiket Masuk/Cafe) — `calcRevenueByUnit()` di `lib/data/owner.ts`. Tiket & Cafe otomatis 0% (sistemnya belum ada), jadi Penginapan wajar tampil 100% buat sekarang — bukan bug, memang representasi jujur kondisi saat ini, otomatis kebagi begitu 2 unit lain aktif.
- [x] ⏳ **UI mobile Owner (update 2026-07-26):** sidebar `OwnerLayout.tsx` sebelumnya `hidden` total di bawah breakpoint `md` tanpa pengganti apa pun — di HP gak ada cara pindah menu maupun logout sama sekali. Ditambahkan **bottom nav bar** (`fixed`, `md:hidden`, pakai ulang `navItems` yang sama biar gak duplikasi, item "Soon" tetap non-klik) + tombol logout ikon di header (`md:hidden`, sidebar desktop tetap punya link Keluar sendiri) + padding bawah `<main>` (`pb-24` di mobile) biar konten gak ketutup bottom nav.
- [x] ⏳ **`/owner/laporan` dihapus (update 2026-07-26):** dulu cuma placeholder "hub" export, sekarang gak kepake lagi karena tombol Export PDF udah nempel kontekstual di Ringkasan & Penginapan masing-masing (lihat 2 poin di atas). Dihapus: route `app/owner/laporan/page.tsx`, komponen `OwnerLaporanPage.tsx`, item nav "Laporan" di `OwnerLayout.tsx` (sidebar + bottom nav mobile), i18n key `owner.navLaporan` & `owner.laporanPlaceholder`.

---

## FASE 11 — QA & Polish

- [x] ⏳ **Uji alur pencatatan booking end-to-end (2026-08-21):** dites langsung di browser (bukan cuma curl) — buat booking baru lewat menu Booking WhatsApp (kode `DGC-AT4JNH`, status awal DP, DP Rp175.000/Rp350.000) → Tandai Lunas (sudah dibayar otomatis jadi Rp350.000 penuh) → Tandai Check-in (stat card "Sedang Menginap" naik real-time). Belum sampai ke COMPLETED karena butuh tanggal check-out benar-benar lewat (bukan sesuatu yang bisa disimulasikan tanpa mock tanggal sistem) — logikanya sendiri (`computeEffectiveStatus()`) sudah diverifikasi manual saat FASE 7/8.
- [x] Uji multi-tenda dalam satu booking — sudah diverifikasi manual FASE 7 (2 tenda beda tipe + extra bed dalam satu booking)
- [x] Uji anti double-booking — sudah diverifikasi manual FASE 5 (kena `409` pas kapasitas penuh)
- [x] ⏳ **Uji check-in ulang & transisi ilegal ditolak (2026-08-21):** re-tes lewat curl atas booking yang sama persis abis dites end-to-end di atas — CHECKED_IN→LUNAS (mundur) `409`, HANGUS setelah CHECKED_IN `409`, CHECKED_IN→CHECKED_IN (double check-in) `409`. Semua guard transisi masih solid, tidak ada regresi dari perubahan RBAC sesi ini.
- [x] Uji tarif weekday/weekend + extra bed + override — sudah diverifikasi manual via curl FASE 7 (angka cocok persis)
- [x] ⏳ **Uji RBAC seluruh role (2026-08-21):** backend via curl — semua endpoint admin 401 tanpa token, login salah password 401, token rusak 401, ketiga role (SUPER_ADMIN/OWNER/ADMIN_PENGINAPAN) bisa akses endpoint yang mengizinkan mereka. Frontend via browser — fokus ke perubahan RBAC sesi ini: ADMIN_PENGINAPAN paksa buka `/owner` → dipental ke `/admin/penginapan`; SUPER_ADMIN login → landing `/super-admin` (bukan `/owner`), paksa buka `/owner` → dipental balik; OWNER login → landing `/owner`, **berhasil** akses `/admin/penginapan` (akses "ke bawah" tetap jalan); sudah login lalu buka `/login` lagi → otomatis dilempar ke dashboard sendiri. Semua 5 skenario lolos.

---

## FASE 12 — Deployment

- [ ] `Dockerfile` backend & frontend
- [ ] `docker-compose.yml` (FE + BE + PostgreSQL + Nginx)
- [ ] Nginx: `dglorious.com` → FE, `api.dglorious.com` → BE
- [ ] VPS: user non-root, firewall, update
- [ ] Deploy: clone → `.env` production → `docker compose up`
- [ ] SSL Let's Encrypt (auto-renew)
- [ ] CORS: backend hanya izinkan domain frontend
- [ ] **Backup database otomatis** (cron harian, simpan di luar server)
- [ ] Uji seluruh alur di production
- [ ] Dokumentasi untuk klien (panduan + video)
- [ ] Serah terima: domain, VPS, akun ke pihak D'Glorious

---

# VERSI 2 — Rencana Selanjutnya (Belum Dikerjakan)

Struktur data & enum **sudah disiapkan**, implementasi menyusul di Versi 2:

**Halaman:**
- `/admin/settings` — konfigurasi global (jam, WA, rekening, S&K) *(digeser dari Versi 1, dianggap belum cukup penting utk MVP KP)*
- `/booking` (form + modal pembayaran), `/cek-booking`, `/booking/[kode]` adaptif — UI lama sempat dibangun lalu **dihapus** (bukan diparkir, update 2026-07-26): isinya simulasi Midtrans/QRIS/VA + auto-expire, kontradiktif dengan scope Versi 1 (manual only, tanpa payment gateway). Saat benar-benar dikerjakan, tulis ulang dari awal mengikuti skema final, jangan pakai ulang sisa UI lama.

**Modul Settings (backend):**
- Backend CRUD settings (hanya `SUPER_ADMIN`/`OWNER`) — sekarang baru read-only (`GET /settings`)
- Helper baca setting yang di-cache (dipakai banyak modul)
- Keputusan jam check-in/out per-tipe-unit vs seragam semua unit (`RoomSource.checkInTime/checkOutTime` masih per-room, belum dialihkan ke `settings` global)

**Booking WhatsApp/Walk-in — penyempurnaan:**
- Validasi kapasitas & anak otomatis di backend (§8.2 PROJECT.md) — Versi 1 sengaja cuma catatan UI (`childrenRuleHint`), belum ada validasi blocking
- Validasi "reschedule maks H-7 sebelum check-in" (S&K) — endpoint edit sendiri sudah ada (lihat FASE 8, audit 2026-08-21), tapi belum ada aturan H-7 ini secara spesifik

**Dashboard Owner:**
- Gateway navigasi Owner ↔ Admin (link "Buka Dashboard Admin →" / "← Kembali ke Owner")
- Menu "Kelola Akun" (CRUD akun admin + reset password/nonaktifkan, taruh di dashboard Owner)

**QA lanjutan (dari FASE 11):**
- Uji fallback bahasa (kosongkan EN → tampil ID)
- Uji responsif mobile & desktop (terutama halaman login yang baru di-redesign)
- Loading state & error handling di semua form
- SEO dasar publik: meta tag, Open Graph, sitemap
- Uji validasi kapasitas/anak & uji settings (ubah jam/WA/rekening/S&K → berubah di UI) — nunggu 2 fitur di atas selesai dibangun dulu

**Digeser dari fase 1 (perubahan scope):**
- **Booking online mandiri oleh tamu** — guest checkout (`/booking`), **Midtrans Snap**, webhook + **verifikasi signature**
- **Kode booking yang diakses tamu** + `/cek-booking` + `/booking/[kode]` adaptif *(UI lama sudah dihapus 2026-07-26 karena kontradiktif dengan scope Fase 1 — tulis ulang dari nol saat fase ini benar-benar dikerjakan)*
- **Email otomatis** (kode, tiket, reminder) — Nodemailer/SMTP + queue
- **Auto-expire 1×24 jam** (cron job) → status **`EXPIRED`** + `expired_at`, lepas kunci tanggal — *dipakai saat booking online (admin fase 1 hanya input booking yang sudah fix, jadi tak ada booking menggantung)*
- **DP + upload bukti transfer** (fase 1 cukup penanda Belum Lunas/Lunas)
- **Generate tiket PDF + QR** untuk tamu
- Status alur online: `WAITING_PAYMENT`, `PAID` (ada di enum, belum dipakai)
- **Bahasa Mandarin (中文)** — struktur i18n & translations siap, tinggal isi data

**Modul & hal lain (fase selanjutnya):**
- Sistem tiket masuk / portal (`ADMIN_PORTAL`)
- Sistem transaksi & stok cafe (`ADMIN_CAFFE`)
- Scanner QR untuk check-in (fase 1 pakai input kode manual)
- Midtrans **production** (butuh dokumen usaha klien)
- WhatsApp API otomatis (fase 1 pakai link `wa.me` manual)
- Akun/membership untuk tamu
