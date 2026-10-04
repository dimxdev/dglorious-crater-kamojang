# Tentang (Company Profile)

**Route:** `/tentang`
**Status:** ✅ Selesai
**File utama:** `frontend/app/tentang/page.tsx` → `frontend/components/public/AboutPage.tsx`

## Ringkasan
Halaman profil perusahaan/brosur digital — menceritakan sejarah, daya tarik wisata, galeri foto, fasilitas per zona kawasan, serta info tiket masuk & parkir. Murni konten informasi, tidak ada transaksi apa pun di sini.

## Cara Kerja
Seluruh isi halaman diambil dari data lokal (`lib/data/content.ts`, `lib/data/kawasan.ts`, `lib/data/images.ts`) — **tidak ada satu pun panggilan API**. Getter-getter datanya (mis. `getAttractions(locale)`) menerima `locale` sebagai argumen langsung, jadi ganti bahasa cukup memicu re-render dengan locale baru, tanpa fetch ulang. Bagian indeks fasilitas (`KawasanIndex`) punya sedikit interaktivitas: memakai hook `useDrawOnEnter` yang mendeteksi kapan section masuk viewport lalu menjalankan animasi "menggambar" daftar fasilitas saat di-scroll.

## Sub-fitur
- **Header (`PageMast`)** — judul, lead, dan 3 meta stat (tahun berdiri, ketinggian, luas area).
- **Sejarah** — narasi 4 paragraf ditemani foto.
- **Daya Tarik** (`id="atraksi"`) — grid penuh tiap atraksi: ikon + foto + deskripsi.
- **Galeri** — grid foto asimetris, item pertama membentang 2×2.
- **Indeks Fasilitas** (`id="fasilitas"`) — daftar fasilitas dikelompokkan per zona kawasan, dengan animasi reveal saat di-scroll. Sengaja ditampilkan lengkap tanpa filter/sembunyi.
- **Tiket & Parkir** (`id="tiket"`) — 4 kartu perbandingan paket tiket masuk (harga siang/malam) plus tabel tarif parkir.

## Keputusan Desain Penting
Halaman ini sepenuhnya self-contained dari data lokal karena isinya informasi statis yang tidak dimodelkan di database sama sekali. Harga tiket & parkir di sini adalah **konten brosur**, bukan sistem penjualan tiket — sistem ini tidak menjual tiket. Foto di halaman ini (dan di beranda) adalah ilustrasi buatan AI (Google Gemini), bukan foto asli lokasi — dicatat di `lib/data/images.ts` supaya mudah diganti foto asli.

## Terhubung ke
- `lib/data/content.ts` (`getAttractions`, `getGalleryItems`, `getTicketPackages`, `getParkingFees`)
- `lib/data/kawasan.ts` (`getZones`, `totalFacilities`)
- `lib/data/images.ts` (`getImage`)
