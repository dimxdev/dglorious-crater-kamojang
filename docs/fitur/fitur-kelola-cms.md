# Kelola Penginapan (CMS)

**Route:** `/admin/penginapan/kelola`
**Status:** ✅ Selesai
**File utama:** `frontend/components/admin/penginapan/KelolaPage.tsx` (+ `CmsDrawer`, `FacilityListEditor.tsx`), `backend/src/penginapan/room-types/`

## Ringkasan
CMS untuk mengelola konten tenda/villa — tambah/edit/hapus tipe unit, isi dua bahasa (ID/EN), dan kelola galeri foto. Data yang dikelola di sini adalah sumber untuk katalog publik sekaligus dropdown pilih tenda di form booking.

## Cara Kerja
Halaman menampilkan tabel tipe tenda (dari `GET /admin/room-types`); menambah atau mengedit membuka slide-in `CmsDrawer`. Di dalam drawer, konten yang bergantung bahasa (nama, kategori, tagline, deskripsi, dst) diedit lewat **tab ID/EN**, sementara data universal (slug, harga, kapasitas, tarif) diedit sekali. Saat disimpan, frontend hanya mengirim objek translasi EN kalau admin benar-benar mengisinya — kalau dibiarkan kosong, data EN yang sudah ada tidak ikut ditimpa jadi kosong.

Galeri foto sedikit khusus: upload butuh `roomTypeId` yang sudah ada, jadi saat mode Tambah galeri disembunyikan dengan pesan "simpan dulu"; begitu Simpan sukses, drawer otomatis berpindah ke mode Edit untuk ID yang baru dibuat sehingga admin bisa langsung mengunggah tanpa menutup-buka drawer. Menghapus tipe tenda bukan hapus permanen melainkan soft delete — mengeset `deletedAt` + `isActive: false`, sementara semua query (admin maupun publik) menyaring `deletedAt: null`, sehingga histori booking lama yang mereferensikan tipe itu tetap utuh.

## Sub-fitur
- **CRUD Tipe Tenda** — `GET/POST/PATCH/DELETE /admin/room-types`. Delete = soft delete.
- **Slug immutable** — dikunci sejak dibuat. `UpdateRoomTypeDto` meng-omit field `slug` sepenuhnya (bukan sekadar optional), jadi backend menolaknya, dan frontend juga membuang slug dari payload update serta menampilkannya disabled saat Edit.
- **Tab Bahasa ID/EN** — nama, kategori, tagline, deskripsi, info kasur, info kamar mandi, aturan. ID wajib; EN opsional dengan aturan "tidak ditimpa jika kosong".
- **Harga & Tarif** — `priceWeekday`/`priceWeekend`, kapasitas, jumlah unit, dan 3 opsi tarif tambah orang: dengan ekstra bed, tanpa ekstra bed, dan flat per-orang (flat dipakai unit non-berkasur seperti Glorious Campervan).
- **Fasilitas** (`FacilityListEditor`) — array `{icon, label: {id, en}}`, label per-bahasa inline di tiap item.
- **Upload Galeri** — `POST /admin/room-types/:id/images` (multipart, disimpan di disk lokal). Upload pertama otomatis jadi cover. Set cover lewat `PATCH /admin/room-images/:id/cover` (transaksional: unset cover lain dulu). Hapus foto cover → cover otomatis pindah ke foto berikutnya berdasarkan `sortOrder`.

## Keputusan Desain Penting
Kapasitas satu tipe disimpan sebagai satu angka `totalUnits`, bukan daftar unit fisik satu-satu. Angka ketersediaan dihitung dari `totalUnits` dikurangi qty booking yang overlap (lihat `fitur-cek-ketersediaan.md`).

Logika "kalau cover dihapus, promosikan foto berikutnya" diterapkan di dua tempat (frontend untuk umpan balik UI instan, backend untuk kebenaran data yang tersimpan). Ini pengulangan yang disengaja, bukan kelalaian — masing-masing melayani kebutuhan berbeda (respons cepat vs. sumber kebenaran).

## Terhubung ke
- `backend/src/penginapan/room-types/` (`RoomTypesAdminController`, `RoomImagesAdminController`, `RoomTypesService`)
- Katalog publik & Detail Unit — konsumen data yang sama
- Form Booking WhatsApp/Walk-in & Edit Booking — dropdown pilih tenda dan harga diambil dari `GET /admin/room-types`, jadi ikut berubah saat tarif diedit di sini
