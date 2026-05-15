/**
 * BIKAN 404 Page
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-base p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl font-black text-muted-blue/10">404</div>
        <h1 className="text-xl font-bold text-muted-blue">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-muted-blue/50">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-tactical-orange text-white text-sm font-bold hover:scale-105 transition-transform"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
