/**
 * BIKAN Root Layout
 * ─────────────────
 * Next.js 15 App Router - Persistent UI shell
 * Handles: metadata, fonts, global providers, PWA manifest
 */

import type { Metadata, Viewport } from 'next';
import '@/lib/env'; // Environment validation — crash early if vars missing
import '@/src/index.css';

export const metadata: Metadata = {
  title: 'BIKAN - Bimbingan Andalan',
  description: 'Platform pembelajaran matematika adaptif berbasis IRT dengan AI Socratic Assistant',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Prefetch HLS.js for faster video initialization (LCP < 1.5s target) */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"
          as="script"
          crossOrigin="anonymous"
        />
        {/* Prefetch first HLS stream for instant playback */}
        <link
          rel="preconnect"
          href="https://devstreaming-cdn.apple.com"
        />
        <link
          rel="preconnect"
          href="https://test-streams.mux.dev"
        />
        {/* KaTeX CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
