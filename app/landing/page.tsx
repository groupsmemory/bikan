/**
 * BIKAN SEO Landing Page
 * ───────────────────────
 * Halaman publik untuk organic traffic & conversion
 * Route: /landing
 */

import Link from 'next/link';

export const metadata = {
  title: 'BIKAN - Platform Pembelajaran Matematika Adaptif | Bimbingan Andalan',
  description: 'Belajar matematika dengan AI Socratic Assistant dan assessment adaptif berbasis IRT. Video micro-learning, grafik interaktif, dan sertifikat digital. Mulai gratis!',
  keywords: 'belajar matematika, LMS Indonesia, fungsi kuadrat, aljabar, AI tutor, bimbel online, koperasi edtech, UTBK matematika',
  openGraph: {
    title: 'BIKAN - Bimbingan Andalan | Matematika Adaptif',
    description: 'Platform pembelajaran matematika adaptif dengan AI Socratic Assistant. Gratis untuk siswa Indonesia.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'BIKAN LMS',
    url: 'https://bikan.id',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BIKAN - Belajar Matematika Adaptif',
    description: 'AI Socratic + IRT Adaptive Testing. Gratis.',
  },
  alternates: {
    canonical: 'https://bikan.id/landing',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'BIKAN LMS',
    description: 'Platform pembelajaran matematika adaptif berbasis IRT dengan AI Socratic Assistant',
    url: 'https://bikan.id',
    sameAs: ['https://github.com/groupsmemory/bikan'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      description: 'Free Tier — akses penuh modul aljabar dasar',
    },
    educationalCredentialAwarded: 'Sertifikat Kompetensi Aljabar BIKAN',
  };

  return (
    <div className="min-h-screen bg-neutral-base">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-tactical-orange/10 text-tactical-orange text-xs font-bold px-4 py-2 rounded-full">
            🎓 Koperasi Multi-Pihak • Permenkop No. 8/2021
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-muted-blue leading-tight">
            Belajar Matematika<br />
            <span className="text-tactical-orange">Adaptif & Cerdas</span>
          </h1>

          <p className="text-lg text-muted-blue/60 max-w-2xl mx-auto leading-relaxed">
            Platform LMS dengan AI Socratic Assistant yang menyesuaikan tingkat kesulitan 
            berdasarkan kemampuan Anda secara real-time. Capai mastery 90% untuk membuka level berikutnya.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 rounded-xl bg-tactical-orange text-white font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
            >
              Mulai Belajar Gratis
            </Link>
            <a
              href="#fitur"
              className="px-8 py-4 rounded-xl border-2 border-muted-blue/10 text-muted-blue font-bold text-sm uppercase tracking-widest hover:bg-muted-blue/5 transition-colors"
            >
              Lihat Fitur
            </a>
          </div>

          <p className="text-[11px] text-muted-blue/30">
            7 hari free trial Premium • Tanpa kartu kredit • Batalkan kapan saja
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section id="fitur" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Mengapa BIKAN Berbeda?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            emoji="🧠"
            title="IRT Adaptive Testing"
            description="Soal menyesuaikan tingkat kesulitan berdasarkan kemampuan Anda. Tidak terlalu mudah, tidak terlalu sulit."
          />
          <FeatureCard
            emoji="🤖"
            title="AI Socratic Assistant"
            description="Tanya apa saja — AI membimbing dengan pertanyaan penuntun, bukan memberikan jawaban langsung."
          />
          <FeatureCard
            emoji="📐"
            title="Canvas Interaktif"
            description="Eksplorasi grafik fungsi kuadrat secara langsung. Pinch, zoom, dan geser untuk memahami konsep."
          />
          <FeatureCard
            emoji="🎬"
            title="Video Micro-Learning"
            description="Materi dalam segmen 3-12 menit. HLS adaptive streaming, chapter navigation, speed control."
          />
          <FeatureCard
            emoji="🔥"
            title="Learning Streak"
            description="Bangun kebiasaan belajar harian. Target 30 menit/hari untuk menjaga streak tanpa tekanan kompetisi."
          />
          <FeatureCard
            emoji="📜"
            title="Sertifikat Digital"
            description="Dapatkan sertifikat kompetensi saat mastery tercapai. Verifiable dan bisa di-share."
          />
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-muted-blue/5 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-2xl font-bold">Investasi Terjangkau</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="soft-ui-card p-8 space-y-4">
              <h3 className="font-bold text-lg">Basic</h3>
              <p className="text-3xl font-black text-tactical-orange">Rp 99.000<span className="text-sm font-normal text-muted-blue/40">/bulan</span></p>
              <ul className="text-sm text-muted-blue/60 space-y-2 text-left">
                <li>✓ Semua video materi</li>
                <li>✓ Assessment adaptif IRT</li>
                <li>✓ Mastery tracking</li>
                <li>✓ Offline mode</li>
              </ul>
            </div>
            <div className="soft-ui-card p-8 space-y-4 border-2 border-muted-green">
              <div className="text-[9px] font-bold uppercase bg-muted-green text-white px-2 py-0.5 rounded-full inline-block">Populer</div>
              <h3 className="font-bold text-lg">Premium</h3>
              <p className="text-3xl font-black text-muted-green">Rp 199.000<span className="text-sm font-normal text-muted-blue/40">/bulan</span></p>
              <ul className="text-sm text-muted-blue/60 space-y-2 text-left">
                <li>✓ Semua fitur Basic</li>
                <li>✓ AI Tutor unlimited</li>
                <li>✓ Post-live automation</li>
                <li>✓ Sertifikat digital</li>
              </ul>
            </div>
          </div>
          <Link
            href="/"
            className="inline-block px-8 py-4 rounded-xl bg-tactical-orange text-white font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
          >
            Coba 7 Hari Gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-muted-blue to-black flex items-center justify-center text-white font-black text-lg">
          B
        </div>
        <p className="text-sm text-muted-blue/40">
          KMP BIKAN 2026 — Koperasi Multi-Pihak Bimbingan Andalan
        </p>
        <p className="text-[10px] text-muted-blue/20">
          Permenkop No. 8 Tahun 2021 • Platform Pembelajaran Matematika Adaptif
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="soft-ui-card p-6 space-y-3 hover:scale-[1.02] transition-transform">
      <span className="text-3xl">{emoji}</span>
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-muted-blue/50 leading-relaxed">{description}</p>
    </div>
  );
}
