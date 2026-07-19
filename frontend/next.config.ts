import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't get confused by the
  // root-level package-lock.json in the monorepo.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
