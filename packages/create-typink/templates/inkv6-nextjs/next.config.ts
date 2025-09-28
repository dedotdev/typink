import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  images: {
    remotePatterns: [new URL('https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/typink/**')],
  },
};

export default nextConfig;
