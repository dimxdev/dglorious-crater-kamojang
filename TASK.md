# TASK.md — Checklist Pengerjaan

Urutan task dari nol sampai siap deploy. Kerjakan **berurutan dari atas ke bawah** — banyak task bergantung pada task sebelumnya.

Baca `PROJECT.md` dulu sebelum mulai. Centang `[x]` setiap task yang selesai.

> **⚠️ Scope Fase 1.** Company profile/katalog publik + **pencatatan booking internal oleh admin**
> (admin hanya input booking yang **sudah fix**; nego & pembayaran terjadi di WhatsApp/luar sistem).
> **Booking online (Midtrans, guest checkout, email, tiket PDF/QR, auto-expire) + Mandarin
> digeser ke "Yang TIDAK Dikerjakan di Fase Ini"** — struktur tetap disiapkan.
> Istilah unit di UI: **"Tenda" / "Villa"** (entity DB tetap `room_types`).

---

## Peta Halaman

### Publik — katalog / brosur digital (TANPA booking online)
- [x] `/` — **Homepage**: hero, daya tarik, preview tenda, info praktis, CTA
- [x] `/tentang` — sejarah, galeri, fasilitas
- [x] `/penginapan` — katalog tenda & villa
- [x] `/penginapan/[slug]` — detail unit
- [x] `/syarat-ketentuan` — halaman S&K (12 poin, teks dari `settings`) *(mock frontend, 12 poin sekarang teks resmi klien — update 2026-07-26)*
- [ ] ⏳ **Revisi scope:** buang widget booking online dari detail → CTA **"Hubungi Reservasi via WhatsApp"**; tampilkan harga **weekday/weekend**; label **"Tenda"/"Villa"**
- [x] Elemen global: navbar, footer, floating WhatsApp

### Admin
- [x] `/login` — satu pintu semua role
- [x] `/admin/penginapan` — Ringkasan
- [x] `/admin/penginapan/booking-whatsapp` — Booking WhatsApp *(2026-07-26: rename dari `tambah-booking`; field mengikuti form reservasi WA resmi klien — lihat PROJECT.md §8.1)*
- [x] `/admin/penginapan/walk-in` — Tamu Langsung *(2026-07-26: menu baru, dipisah dari Booking WhatsApp karena tamu sudah di lokasi saat dicatat — langsung CHECKED_IN, skip DP/Lunas)*
- [x] `/admin/penginapan/booking` — Data Booking (tabel + filter + modal + **ubah status & edit tanggal langsung dari sini**, lihat FASE 8)
- [x] ~~`/admin/penginapan/checkin`~~ — **dihapus 2026-07-26**, fungsinya dilebur ke Data Booking (lihat PROJECT.md §6.2 & §7)
- [x] `/admin/penginapan/kelola` — Kelola/CMS (drawer tab bahasa + galeri)
- [ ] `/admin/settings` — konfigurasi global (jam, WA, rekening, S&K) *(digeser ke Fase 2, lihat FASE 4 — dianggap belum cukup penting utk MVP KP)*

### Owner
- [x] `/owner` — Ringkasan, `/owner/penginapan` — Performa per tipe tenda (real, lihat FASE 10), `/owner/laporan` — placeholder. **Update 2026-07-26:** dipecah jadi route asli per menu (`OwnerLayout.tsx` + `page.tsx` masing-masing), bukan tab-switch di satu komponen `OwnerDashboard.tsx` (dihapus) — biar bisa di-bookmark/share & konsisten sama pola Admin.

> Semua halaman = **UI, data masih mock**. Penyambungan ke API + proteksi route (RBAC) di fase backend masing-masing.
>
> ~~Diparkir untuk fase berikutnya (booking online, sudah terlanjur dibangun — jangan dihapus): `/booking` (form + modal pembayaran), `/cek-booking`, `/booking/[kode]` adaptif.~~
> **Update 2026-07-26:** UI itu akhirnya **dihapus** (bukan diparkir). Rekening pembayaran & S&K yang sudah dibuat di `/admin/settings` & `/syarat-ketentuan` ternyata tidak nyambung ke flow itu karena isinya simulasi Midtrans/QRIS/VA + auto-expire — sudah kontradiktif dengan keputusan scope Fase 1 (manual only, status langsung `CONFIRMED`, tanpa payment gateway). Saat Fase Berikutnya (booking online) benar-benar dikerjakan, halaman ini perlu ditulis ulang dari awal mengikuti skema final, bukan dipakai ulang dari sisa UI lama.

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
  - [ ] ⏳ **Revisi lanjutan (temuan dari price list resmi, PROJECT.md §11):** `extra_bed_price` tunggal **tidak cukup** — real data punya **2 tarif tambah orang** per tipe tenda ("Dengan Ekstra Bed" vs "Tanpa Ekstra Bed"), dan Glorious Campervan malah flat per-orang. Perlu field tambahan (mis. `extra_no_bed_price` di `room_types`, atau `is_with_bed: boolean` di booking) — dikerjakan saat FASE 6/7, sudah dimodelkan di frontend (`lib/data/rooms.ts`).
- [x] Tabel baru **`booking_items`** (booking ↔ beberapa tenda: room_type_id, room_unit_id nullable, qty, subtotal_snapshot)
- [x] Tabel baru **`settings`** (key-value konfigurasi global)
- [x] `BookingSource`: **`MANUAL`** (fase 1) + `ONLINE` (fase berikutnya)
- [x] Tandai `WAITING_PAYMENT`/`PAID`/`EXPIRED`/`REJECTED` + `expired_at` sebagai **fase berikutnya** (tetap ada di enum/skema, belum dipakai). **Tidak ada auto-expire di fase 1.**
- [x] Migrasi baru (squash jadi satu `init` bersih — data lama cuma dummy) + update seeder (harga weekday/weekend dummy, source `MANUAL`, status `CONFIRMED`, seed `settings`: jam 14.00/12.00, no. WA, rekening BSI, teks S&K 12 poin, + 1 contoh booking multi-tenda)
- [x] `zh.json` & translations 中文 dikosongkan dulu — struktur tetap multi-bahasa (translations sudah ID+EN sejak awal)

---

## FASE 2 — Autentikasi & RBAC (Backend)

- [ ] Module `auth`: login, hash password (bcrypt), generate JWT
- [ ] JWT strategy + `JwtAuthGuard`
- [ ] `@Roles()` decorator + `RolesGuard`
- [ ] Uji: role salah → 403
- [ ] `GET /auth/me`
- [ ] Frontend: sambungkan `/login` ke API, simpan token, redirect sesuai role, proteksi route dashboard

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

- [ ] Tabel `settings` + seeder nilai awal (§8.3 PROJECT.md)
- [ ] Backend CRUD settings (hanya `SUPER_ADMIN`/`OWNER`)
- [ ] Helper baca setting yang di-cache (dipakai banyak modul)
- [ ] ⏳ **Update 2026-07-26:** Frontend `/admin/settings` (form edit jam/WA/rekening/S&K) sempat dibangun lalu **dihapus lagi** — dianggap belum cukup penting untuk MVP KP, digeser ke Fase 2. Data mock-nya (`lib/data/settings.ts`) **tetap dipertahankan** karena sudah dipakai halaman publik (lihat poin di bawah); yang dihapus cuma form admin-nya
- [x] Konsumsi setting: no. WA di CTA publik & teks S&K di `/syarat-ketentuan` sudah pakai `getSettings()` (`lib/data/settings.ts`) — kontennya untuk sekarang cuma bisa diubah lewat edit kode, bukan lewat UI admin
- [ ] ⏳ jam check-in/out di detail unit **masih per-room** (`RoomSource.checkInTime/checkOutTime`), belum dialihkan ke `settings` global — perlu keputusan apakah jam checkin/out tetap per-tipe-unit atau benar2 seragam semua unit

---

## FASE 5 — Modul Penginapan / CMS (Tenda)

### Backend
- [ ] CRUD `room_types` (+ translations satu transaksi) — `price_weekday`, `price_weekend`
- [ ] CRUD `room_units`
- [ ] Upload gambar + galeri (`is_cover`, `sort_order`)
- [ ] Endpoint publik: list & detail (fallback bahasa ID)
- [ ] **Fungsi cek ketersediaan** — satu fungsi reusable
- [ ] **Fungsi pilih tarif** weekday/weekend per tanggal — reusable
- [ ] Soft delete + `created_by`

### Frontend — Admin (`/admin/penginapan/kelola`)
- [ ] Tabel + tombol tambah
- [ ] Form tambah/edit dengan **tab bahasa ID / EN** *(中文 = fase berikutnya, tab disiapkan)*
  - Multi-bahasa: nama, deskripsi, fasilitas, aturan
  - Universal: **harga weekday, harga weekend**, kapasitas, jumlah unit, status aktif
  - Catatan: "Tab ID wajib. Jika EN kosong, tampil versi Indonesia."
- [ ] Upload galeri (grid thumbnail + tandai cover)

> CMS harus bisa dibangun & diuji dengan **data dummy** — nama/harga asli belum didapat.

---

## FASE 6 — Company Profile / Katalog Publik

- [ ] `/` (homepage) — sambungkan ke data tenda dari API
- [ ] `/tentang`
- [ ] `/penginapan` (katalog/brosur) — label **"Tenda"/"Villa"**
- [ ] `/penginapan/[slug]` (detail): galeri, kapasitas, fasilitas, aturan, **harga weekday/weekend**, jam check-in/out (dari settings)
- [ ] **CTA "Hubungi Reservasi via WhatsApp"** (link `wa.me` dari settings + pesan template) — **bukan** booking online
- [ ] `/syarat-ketentuan` — tampilkan 12 poin S&K dari settings
- [ ] Pastikan **tidak ada** form checkout / cek-booking / login tamu di sisi publik

---

## FASE 7 — Menu Booking WhatsApp & Tamu Langsung (Pencatatan Internal) — *fitur inti fase 1*

> **Update 2026-07-26:** dipecah jadi 2 menu (§6.1 & §8.1 PROJECT.md) — **Booking WhatsApp** (booking sudah dealing di WA, tamu belum tiba, mulai status `DP`) dan **Tamu Langsung** (tamu sudah di lokasi, bayar di tempat, langsung `CHECKED_IN`, skip `DP`/`LUNAS`). Field form sama persis (ikut form reservasi WA resmi klien); yang beda cuma status awal saat disimpan. **Update lanjutan (sama hari):** status booking & status pembayaran digabung jadi satu progres `DP → LUNAS → CHECKED_IN → COMPLETED` (+ cabang `HANGUS`). **Update lanjutan lagi (sama hari):** `CANCELLED` dihapus (digabung ke `HANGUS` — batal manual & tidak pernah datang sama-sama berarti uang hangus), ditambah `NO_SHOW` ("Tidak Datang") khusus untuk booking yang sudah `LUNAS` tapi tidak pernah check-in sampai tanggal checkout — lihat §6.2 PROJECT.md.

### Backend
- [ ] Generator `booking_code` acak (`DGC-XXXXXX`, unik)
- [ ] `POST /bookings`: `booking_source = MANUAL`, `created_by = admin`, status awal **`DP`** (Booking WhatsApp) atau **`CHECKED_IN`** (Tamu Langsung)
- [ ] Dukung **multi-tenda** (buat `booking_items`)
- [ ] Validasi ketersediaan (fungsi FASE 5) — cegah double-booking
- [ ] **Validasi kapasitas & anak** (§8.2 PROJECT.md): orang efektif = dewasa + anak ≥6; jika > kapasitas → peringatan extra bed / charge person / ganti tipe
- [ ] Hitung total: Σ(tarif weekday/weekend per tenda × malam) + (extra_bed_qty × extra_bed_price); **opsi override** → `is_price_override`
- [ ] Snapshot total ke `price_snapshot` (per item ke `subtotal_snapshot`)
- [ ] Upload **foto KTP opsional** → `ktp_photo_url`
- [ ] Reschedule: admin edit tanggal *(validasi "maks H-7" = peningkatan opsional)* — lihat juga FASE 8

### Frontend (`/admin/penginapan/booking-whatsapp` & `/admin/penginapan/walk-in`)
- [x] UI kedua form (mock, belum wired ke API): nama, No. telepon, **pilih tenda**, tanggal check-in/out, **dewasa**, **anak**, **extra bed (jumlah + tarif)**, catatan
- [x] Booking WhatsApp: field **upload KTP (opsional)** + pilih status awal DP/Lunas
- [x] Tamu Langsung: field metode bayar (Tunai/QRIS/Transfer) + catatan otomatis "langsung Check-in"
- [x] ~~`RoomItemsEditor.tsx` (tipe + jumlah tenda saja)~~ — **update 2026-07-26: diganti `RoomGroupEditor.tsx`** (dipakai kedua form Booking WhatsApp & Walk-in — `RoomItemsEditor.tsx` tetap dipakai di modal edit Data Booking). Sekarang tiap grup tenda (tombol "+" nambah grup baru) punya tipe + **dewasa/anak/extra bed sendiri-sendiri** (bukan satu angka gabungan buat seluruh booking) — perlu karena kalau pesan 2 tipe tenda beda, jumlah orang di tiap tenda bisa beda.
  - [x] ⏳ **Revisi lanjutan (sama hari):** field "Jumlah" (qty per tipe) **dihapus** — tiap unit fisik jadi barisnya sendiri (klik + berkali-kali kalau perlu beberapa unit tipe sama), karena kebutuhan tiap unit (dewasa/anak/extra bed) bisa beda-beda, jadi gak bisa digabung pakai satu angka qty.
  - [x] ⏳ **Revisi lanjutan lagi (sama hari, koreksi salah paham sebelumnya):** "Jumlah Extra Bed" **tetap ada seperti semula** (bukan direname) — yang dihapus cuma field **"Jenis Extra Bed"** (with/without) dari `RoomGroupEditor`, defaultnya di-hardcode `'with'` di kode (tidak dipilih admin lagi). `RoomItemsEditor`/modal edit Data Booking **tidak berubah**, masih ada pilihan jenisnya. Sebagai gantinya ditambah info **"X malam weekday, Y malam weekend"** (`calcNightsBreakdown` di `lib/pricing.ts`) di bawah tanggal check-in/out, biar admin lihat kenapa subtotalnya segitu.
- [x] **Auto-hitung total** (`lib/pricing.ts`: `calcStayPrice`, `extraBedRate`, `calcGroupsTotal`) — subtotal per grup tenda (real-time, weekday/weekend per tanggal + extra bed per malam × qty) tampil di tiap kartu, **Total Keseluruhan** di bawahnya, plus **opsi override manual** (toggle "Ubah nominal manual"). Asumsi yang dipakai (belum dikonfirmasi klien, lihat PROJECT.md §11): definisi weekend = Sabtu–Minggu, tarif extra bed dihitung **per malam** (bukan sekali bayar).
- [ ] Indikator ketersediaan real-time + **peringatan kapasitas/anak** (dengan catatan aturan) — belum wired ke data booking asli

---

## FASE 8 — Perubahan Status Booking

> **Update 2026-07-26:** menu Check-in terpisah **dihapus** — perubahan status (termasuk check-in) sekarang dilakukan langsung dari menu Data Booking (klik baris → detail → tombol aksi). Lihat PROJECT.md §6.2 & §7.

- [ ] Backend `PATCH /bookings/:code/status` — transisi `DP → LUNAS → CHECKED_IN`, atau `→ HANGUS` kapan saja sebelum check-in. Validasi transisi tidak boleh mundur/loncat.
- [ ] Backend: `COMPLETED` (dari `CHECKED_IN` + tanggal checkout lewat) & `NO_SHOW` (dari `LUNAS` + tanggal checkout lewat, belum checked-in) **dihitung di endpoint GET** (bandingkan tanggal `check_in`/`check_out` vs hari ini) — **bukan** disimpan sebagai kolom, **bukan** cron job.
- [ ] Backend `PATCH /bookings/:code` — edit tanggal check-in/out (reschedule manual admin, §6.1)
- [x] Frontend (mock, `BookingsPage.tsx`): tombol "Tandai Lunas" / "Tandai Check-in" / "Batalkan Booking" / "Edit Tanggal" muncul kontekstual sesuai status saat ini — belum wired ke API

---

## FASE 9 — Dashboard Admin Penginapan

- [ ] `/admin/penginapan` — 4 stat card (booking hari ini, belum lunas, okupansi, pendapatan bulan ini) — dari API
- [ ] Tabel booking terbaru + kalender okupansi bulanan
- [x] `/admin/penginapan/booking` — tabel (mock, belum API):
  - Kolom: kode, nama, WA, tenda, check-in/out, sumber, total, **status gabungan**, aksi
  - Badge status (revisi 2026-07-26: DP / Lunas / Check-in / Selesai / Hangus / Tidak Datang — lihat §6.2 PROJECT.md)
  - Filter: status (5 nilai), sumber (WhatsApp/Walk-in), **tanggal check-in spesifik** (opsional, bisa dihapus), **bulan+tahun** (default bulan berjalan, **wajib terisi — tidak bisa dikosongkan**, biar data yang numpuk berbulan-bulan gak ditampilin semua sekaligus); search kode/nama/**no. WA**; **pagination 15/20 per halaman**
  - Modal detail (klik baris) — **update 2026-07-26**: dibikin lebih detail & dikelompokkan per section (Data Tamu / Detail Menginap / Pembayaran) — Dewasa, Anak-anak, Extra Bed, Catatan, status Foto KTP (khusus jalur WhatsApp) sekarang ikut ditampilkan biar admin gampang nyiapin unitnya
  - [x] Tombol "Tandai Hangus" manual **dihapus** — Hangus sekarang murni status turunan otomatis (§6.2), tidak ada aksi manual buat itu lagi
  - [x] **Edit Booking** diperluas dari sekadar edit tanggal jadi edit seluruh isi (nama, WA, tipe tenda, tanggal, dewasa/anak, extra bed, catatan, total) — **cuma bisa kalau status masih DP atau LUNAS**; begitu CHECKED_IN (atau turunannya: COMPLETED/HANGUS/NO_SHOW) data dianggap final, tidak bisa diedit lagi
  - [x] ⏳ **Filter periode disamain sama pola Owner (update 2026-07-26, direvisi lagi hari yg sama):** sempat dicoba pakai filter rentang manual "Dari Tanggal"–"Sampai Tanggal", tapi akhirnya diganti supaya **konsisten sama dashboard Owner** — pakai komponen `RangeFilter` yang sama persis (Hari Ini/Minggu Ini/Bulan Ini/Custom), sekarang dipindah ke `components/ui/RangeFilter.tsx` (tadinya di `components/owner/`) biar reusable lintas dashboard. Filter tanggal check-in spesifik (yang lama) **dikembalikan lagi sebagai filter TAMBAHAN** ("Cari Tanggal Check-in", opsional/clearable) — cuma buat mempersempit tabel di layar, **sengaja TIDAK ikut ke Export PDF** (PDF tetap ngikutin rentang RangeFilter aja, biar laporannya konsisten per periode, gak keganggu filter pencarian sesaat). i18n label 4 tombol rentang dipindah dari namespace `owner.*` ke `common.*` karena sekarang dipakai lintas dashboard.
  - [x] ⏳ **Selector "Tampilkan 15/20" per-halaman dihapus (update 2026-07-26):** pagination sekarang tetap ada (Sebelumnya/Berikutnya + "Halaman X/Y") tapi ukurannya di-hardcode `PAGE_SIZE = 20`, gak ada pilihan lagi — dianggap gak perlu dikonfigurasi user.
  - [x] ⏳ **Search dibikin independen dari filter lain (update 2026-07-26):** begitu kotak pencarian keisi, filter Periode/Status/Sumber **diabaikan sepenuhnya** — search jalan ke SEMUA booking (bukan cuma yang lolos filter lain), biar gampang nemuin booking spesifik walau lagi difilter periode/status/sumber yang beda. Dropdown Status/Sumber ikut disabled (opacity turun) selama search aktif biar jelas keliatan lagi gak dipakai, plus ada catatan kecil di bawah kotak search ("Pencarian aktif — mengabaikan filter periode/status/sumber..."). Konsekuensinya: Export PDF pas search aktif juga ikut nurut hasil pencarian (bukan periode), konsisten sama apa yang keliatan di layar. Filter "Cari Tanggal Check-in" tetap independen dari ini — tetap jalan di atas hasil manapun (search-mode atau filter-mode biasa).
  - [x] ⏳ **Alignment filter bar dibenerin (update 2026-07-26):** `RangeFilter` sebelumnya gak punya label di atasnya, beda tinggi sama field "Cari Tanggal Check-in" yang punya label uppercase kecil di atas — bikin jomplang pas disejajarkan. Dibungkus pakai `FilterField` yang sama (label "Periode") biar tinggi & alignment-nya konsisten. Tombol Export dipindah ke barisnya sendiri (kanan bawah) biar gak keganggu logic disable pas search aktif.
  - [x] ⏳ **Export Excel (update 2026-07-26):** tombol "Export Excel" ditambahin di sebelah "Export PDF", pakai `ExcelJS` (bukan `xlsx`/SheetJS versi gratis yang stylingnya sangat terbatas) — `lib/excel/bookingReport.ts`. Hasilnya beneran ".xlsx" bergaya: header brand dark green+terracotta (sama kayak PDF), Ringkasan Angka + breakdown Status/Sumber, lalu tabel detail dengan header bold+fill gelap, baris selang-seling, **autofilter** & **freeze header row** (biar tetap keliatan pas scroll data panjang) — kolom Total & Jumlah breakdown tetap **angka asli** (bukan teks terformat kayak di PDF) pakai `numFmt` Rupiah/persen, jadi bisa langsung dijumlah/diurutkan/difilter native di Excel. Logic angka ringkasan (`buildExportSummary()`) di-share bareng Export PDF biar dua format selalu konsisten, gak ada hitungan ganda yang bisa beda sendiri-sendiri.
  - [x] ⏳ **PDF Data Booking dirapikan, ganti landscape (update 2026-07-26):** nambah kolom "Tgl. Booking" bikin tabelnya 10 kolom — kesempitan parah di potret sampai header ("Tgl. Bo|oking") dan isi ("WhatsAp|p") kepotong tengah kata. Fix: (1) `exportReportPdf` (`lib/pdf/report.ts`) sekarang terima parameter opsional `orientation` ('portrait' default, 'landscape' buat tabel lebar) — dipakai laporan Data Booking Admin aja (laporan Owner tetap potret, kolomnya udah pas); (2) kolom "Tipe" di PDF pakai `roomsSummaryShort()` (baru, `lib/data/admin.ts`) yang buang kategori tenda ("Royal Kahuripan" bukan "Royal Kahuripan — Glamping") — tabel di layar tetap pakai `roomsSummary()` biasa (kategori penuh), cuma versi PDF yang dipendekin. Diverifikasi lewat inspeksi `jspdf-autotable` langsung (`table.columns[i].width >= wrappedWidth` di semua kolom = gak ada yang kepaksa wrap).
  - [x] ⏳ **Field baru `createdAt` — tanggal booking DIBUAT, beda dari `checkIn` (update 2026-07-26):** ditambahin ke `AdminBooking` (`lib/data/admin.ts`), semua 29 baris mock diisi ulang manual (WhatsApp: beberapa hari sebelum check-in, ada jeda nego di WA; Walk-in: sama persis dengan `checkIn`, dicatat pas tamu datang langsung). Ditampilkan di kolom baru "Tgl. Booking" pada tabel Data Booking (sebelum kolom Check-in), di Detail Modal (Detail Menginap, view baca-saja — sengaja TIDAK bisa diedit karena ini fakta historis), dan di Export PDF. **Catatan:** form "Booking WhatsApp"/"Tamu Langsung" ternyata belum benar-benar nyimpen ke `adminBookings` sama sekali (tombol Simpan belum ada `onClick`, masih murni UI mockup) — jadi belum ada tempat buat nyetel `createdAt` otomatis saat booking baru dibuat; nanti nyusul pas form itu beneran diwire ke state/API.
  - [x] ⏳ **Export PDF (update 2026-07-26):** tombol "Export PDF" ditambahin di filter bar (kanan atas, sebelah selector per-halaman). Isinya ngikutin filter yang lagi aktif (search/status/sumber/**rentang tanggal**) — **bukan cuma halaman yang lagi ditampilin di layar** (pagination 15/20 di UI gak ngaruh ke export, semua hasil filter tetap ikut, auto-pagination sendiri di PDF-nya lewat `autoTable`). Isi: 4 stat ringkas (Total Booking, Total Pendapatan, Belum Lunas, Sedang Menginap), breakdown Distribusi Status & Sumber Booking, lalu tabel penuh. Dipakein modul PDF yang sama kayak Owner (`lib/pdf/report.ts`, sekarang digeneralisasi jadi `exportReportPdf` + parameter `theme` biar tiap dashboard bisa pakai warna brand-nya sendiri — Owner dark+gold, Admin dark green+terracotta lewat `ADMIN_REPORT_THEME`).
- [ ] Proteksi semua route dashboard sesuai role

---

## FASE 10 — Dashboard Owner

> **Update 2026-07-26:** Ringkasan Owner tadinya 100% angka dummy hardcoded (termasuk yang sudah kadaluarsa: nama kamar fiktif lama, "Online vs Walk-in", transaksi Tiket Masuk palsu ikut nyampur). Sekarang semua dihitung dari `adminBookings` yang sama dengan Data Booking admin (`lib/data/owner.ts`, fungsi `calc*`) — masih mock (belum API), tapi angkanya jujur/konsisten dgn data yang sama di seluruh dashboard.

- [ ] `/owner` — eksklusif `OWNER` + `SUPER_ADMIN` (wiring route + verifikasi build) — proteksi RBAC beneran belum ada
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
- [ ] Sambungkan grafik & angka ke API analitik beneran (masih hitung di client dari mock)
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
- [ ] ⏳ **Ide didiskusikan 2026-07-26, sengaja DITUNDA (bukan prioritas sekarang):**
  - **Gateway navigasi Owner ↔ Admin** — link "Buka Dashboard Admin →" di sidebar Owner (ke `/admin/penginapan`) + link "← Kembali ke Owner" di sidebar Admin (`Sidebar.tsx`, dekat tombol Keluar). Bisa dikombinasikan sama deep-link kontekstual per halaman yang udah ada polanya (mis. "Lihat Detail Booking →" di `/owner/penginapan`) — dua-duanya gak saling eksklusif.
  - **Menu "Kelola Akun"** (CRUD akun admin + reset password) — taruh di dashboard **Owner** aja (bukan Admin, soal keamanan/separation of duties — Admin gak boleh bisa bikin/nonaktifin sesama admin). Delete sebaiknya jadi **Nonaktifkan** (bukan hapus permanen), biar riwayat `created_by` di booking lama gak nyangkut ke akun yang udah ilang. Password: cuma ada aksi "Reset Password", jangan pernah nampilin/edit password asli langsung.

---

## FASE 11 — QA & Polish

- [ ] Uji alur pencatatan booking end-to-end (tambah → Lunas → check-in → COMPLETED)
- [ ] Uji multi-tenda dalam satu booking
- [ ] Uji anti double-booking (dua booking bersamaan, tanggal & unit sama)
- [ ] Uji check-in ulang → ditolak
- [ ] Uji tarif weekday vs weekend + extra bed + override
- [ ] Uji validasi kapasitas/anak (orang efektif > kapasitas → peringatan)
- [ ] Uji settings (ubah jam/WA/rekening/S&K → berubah di UI)
- [ ] Uji RBAC seluruh role (paksa lewat Postman)
- [ ] Uji fallback bahasa (kosongkan EN → tampil ID)
- [ ] Uji responsif mobile & desktop
- [ ] Loading state & error handling di semua form
- [ ] SEO dasar publik: meta tag, Open Graph, sitemap

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

## Yang TIDAK Dikerjakan di Fase Ini

Struktur data & enum **sudah disiapkan**, implementasi fase berikutnya:

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
