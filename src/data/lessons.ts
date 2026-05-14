/**
 * BIKAN Lesson Data - Micro-Learning Content Library
 * ──────────────────────────────────────────────────
 * Konfigurasi materi video untuk Modul 1: Aljabar & Fungsi Kuadrat
 *
 * Catatan:
 * - Video saat ini menggunakan HLS test streams publik sebagai placeholder
 * - Ganti URL dengan rekaman materi BIKAN asli saat tersedia
 * - Setiap lesson berdurasi 3-12 menit (sesuai PRD micro-learning)
 * - Chapters mengikuti segmentasi kognitif dari Creative Director doc
 */

export interface Chapter {
  title: string;
  startTime: number; // detik
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;        // Display string
  bloomLevel: string;      // C1-C6
  videoUrl: string;        // HLS (.m3u8) atau direct (.mp4)
  thumbnailColor: string;  // Gradient placeholder
  chapters: Chapter[];
  order: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  masteryThreshold: number; // 0-100
  lessons: Lesson[];
}

// ─── HLS Test Streams (placeholder sampai konten asli tersedia) ───
// Apple official test streams — reliable, multi-bitrate
const STREAM_APPLE_BASIC = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8';
const STREAM_APPLE_ADVANCED = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8';
// Mux test stream — longer content
const STREAM_MUX_TEST = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// ─── Module 1: Aljabar & Fungsi Kuadrat ───
export const MODULE_1: Module = {
  id: 'mod-aljabar-kuadrat',
  title: 'Aljabar & Fungsi Kuadrat',
  description: 'Memahami bentuk umum, diskriminan, titik puncak, dan grafik fungsi kuadrat',
  masteryThreshold: 90,
  lessons: [
    {
      id: 'lesson-01-pengantar',
      title: 'Pengantar: Mengapa Parabola Ada di Mana-Mana?',
      description: 'Hook motivasional — parabola dalam arsitektur, fisika, dan ekonomi. Membangun relevansi materi dengan dunia nyata.',
      duration: '~4 menit',
      bloomLevel: 'C1 Remembering',
      videoUrl: STREAM_APPLE_BASIC,
      thumbnailColor: 'from-tactical-orange to-amber-500',
      chapters: [
        { title: 'Hook: Parabola di Kehidupan Nyata', startTime: 0 },
        { title: 'Definisi Fungsi Kuadrat', startTime: 45 },
        { title: 'Bentuk Umum f(x) = ax² + bx + c', startTime: 120 },
        { title: 'CTA: Coba di Canvas Interaktif', startTime: 200 },
      ],
      order: 1,
    },
    {
      id: 'lesson-02-koefisien',
      title: 'Peran Koefisien a, b, dan c',
      description: 'Eksplorasi visual — bagaimana setiap koefisien mengubah bentuk dan posisi parabola.',
      duration: '~6 menit',
      bloomLevel: 'C2 Understanding',
      videoUrl: STREAM_APPLE_ADVANCED,
      thumbnailColor: 'from-blue-500 to-indigo-600',
      chapters: [
        { title: 'Koefisien a: Lebar & Arah Parabola', startTime: 0 },
        { title: 'Koefisien b: Pergeseran Horizontal', startTime: 90 },
        { title: 'Koefisien c: Pergeseran Vertikal', startTime: 180 },
        { title: 'Kuis Cepat: Tebak Grafik', startTime: 270 },
        { title: 'Rangkuman & CTA', startTime: 330 },
      ],
      order: 2,
    },
    {
      id: 'lesson-03-diskriminan',
      title: 'Diskriminan: Kunci Rahasia Akar Persamaan',
      description: 'Memahami D = b² - 4ac dan hubungannya dengan jumlah akar real.',
      duration: '~8 menit',
      bloomLevel: 'C3 Applying',
      videoUrl: STREAM_MUX_TEST,
      thumbnailColor: 'from-emerald-500 to-teal-600',
      chapters: [
        { title: 'Apa itu Diskriminan?', startTime: 0 },
        { title: 'D > 0: Dua Akar Berbeda', startTime: 60 },
        { title: 'D = 0: Akar Kembar', startTime: 150 },
        { title: 'D < 0: Tidak Ada Akar Real', startTime: 240 },
        { title: 'Latihan: Tentukan Jenis Akar', startTime: 330 },
        { title: 'Koneksi ke Grafik', startTime: 400 },
      ],
      order: 3,
    },
    {
      id: 'lesson-04-titik-puncak',
      title: 'Titik Puncak & Sumbu Simetri',
      description: 'Menghitung dan memvisualisasikan titik puncak parabola menggunakan rumus -b/2a.',
      duration: '~7 menit',
      bloomLevel: 'C3 Applying',
      videoUrl: STREAM_APPLE_ADVANCED,
      thumbnailColor: 'from-purple-500 to-pink-600',
      chapters: [
        { title: 'Rumus Titik Puncak', startTime: 0 },
        { title: 'Sumbu Simetri x = -b/2a', startTime: 80 },
        { title: 'Nilai Maksimum vs Minimum', startTime: 160 },
        { title: 'Contoh Soal Terapan', startTime: 260 },
        { title: 'Latihan Mandiri', startTime: 350 },
      ],
      order: 4,
    },
    {
      id: 'lesson-05-pemfaktoran',
      title: 'Teknik Pemfaktoran Persamaan Kuadrat',
      description: 'Metode pemfaktoran, melengkapkan kuadrat sempurna, dan rumus abc.',
      duration: '~10 menit',
      bloomLevel: 'C4 Analyzing',
      videoUrl: STREAM_MUX_TEST,
      thumbnailColor: 'from-rose-500 to-red-600',
      chapters: [
        { title: 'Metode 1: Pemfaktoran Langsung', startTime: 0 },
        { title: 'Metode 2: Melengkapkan Kuadrat', startTime: 120 },
        { title: 'Metode 3: Rumus ABC (Kuadratik)', startTime: 250 },
        { title: 'Kapan Pakai Metode Mana?', startTime: 400 },
        { title: 'Soal Tantangan', startTime: 480 },
        { title: 'Refleksi & Rangkuman', startTime: 550 },
      ],
      order: 5,
    },
  ],
};

// ─── Module 2: Persamaan Linear & Sistem (Locked) ───
export const MODULE_2: Module = {
  id: 'mod-linear-sistem',
  title: 'Persamaan Linear & Sistem',
  description: 'Sistem persamaan linear dua variabel, metode eliminasi dan substitusi',
  masteryThreshold: 90,
  lessons: [],
};

// ─── All Modules ───
export const CURRICULUM: Module[] = [MODULE_1, MODULE_2];
