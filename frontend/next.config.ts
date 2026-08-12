import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't get confused by the
  // root-level package-lock.json in the monorepo.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      // Room gallery uploads served by the NestJS backend (FASE 5).
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      // Seed data still uses placeholder photos until real unit photos arrive (§11 PROJECT.md).
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    // Backend jalan di localhost secara lokal — Next.js 16 default-nya nolak
    // fetch image optimizer ke IP privat (proteksi SSRF). Aman diaktifkan di
    // sini karena remotePatterns di atas sudah membatasi hostname+path-nya.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
