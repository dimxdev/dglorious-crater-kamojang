# D'Glorious Crater Kamojang

Sistem informasi & reservasi untuk destinasi wisata **D'Glorious Crater Kamojang**
(kawah geothermal, pemandian air panas, glamping) di perbatasan Bandung–Garut, Jawa Barat.

Proyek Kerja Praktik — lihat [PROJECT.md](PROJECT.md) untuk konteks & aturan arsitektur,
dan [TASK.md](TASK.md) untuk checklist pengerjaan.

## Tech Stack

| Layer    | Teknologi                                         |
| -------- | ------------------------------------------------- |
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS  |
| Backend  | NestJS · TypeScript                               |
| ORM      | Prisma 7 (driver adapter `pg`)                    |
| Database | PostgreSQL                                         |

## Struktur

```
dglorious/
├── backend/     # NestJS — sumber kebenaran, semua logika bisnis
├── frontend/    # Next.js — presentasi, fetch ke API backend
├── PROJECT.md   # konteks & aturan
└── TASK.md      # checklist pengerjaan
```

## Prasyarat

- Node.js 20+ (dikembangkan dengan v24)
- PostgreSQL 14+ berjalan lokal

## Setup

```bash
# 1. Install dependency masing-masing
cd backend && npm install
cd ../frontend && npm install

# 2. Siapkan environment
cp backend/.env.example backend/.env       # isi DATABASE_URL sesuai PostgreSQL lokal
cp frontend/.env.example frontend/.env.local

# 3. (FASE 1) generate Prisma client & migrasi database
cd backend && npx prisma generate && npx prisma migrate dev
```

## Menjalankan (development)

Buka **dua terminal terpisah**:

```bash
# Terminal 1 — backend (NestJS → http://localhost:3001)
cd backend && npm run start:dev

# Terminal 2 — frontend (Next.js → http://localhost:3000)
cd frontend && npm run dev
```

## Skrip lain

Jalankan di dalam folder `backend/` atau `frontend/` masing-masing:

```bash
npm run build          # build
npm run lint           # lint
npm run format         # prettier
```
# dglorious-crater-kamojang
