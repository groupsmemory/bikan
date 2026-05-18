import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack for fast local dev (Next.js 15 stable)
  experimental: {
    // serverActions already stable in Next.js 15
    serverActions: {
      bodySizeLimit: '4mb', // Allow large transcript payloads
    },
  },
  // Environment variables exposed to client (prefix NEXT_PUBLIC_)
  env: {},
  // Image optimization
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
