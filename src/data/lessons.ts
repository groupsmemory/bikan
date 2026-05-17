/**
 * BIKAN Git-CMS — Single Source of Truth untuk Kurikulum
 * ──────────────────────────────────────────────────────
 * File ini adalah CMS utama BIKAN (Code-First, $0, Type-Safe).
 *
 * Keunggulan pendekatan ini:
 * - Tanpa biaya & latensi 0ms (no network call ke CMS eksternal)
 * - Type-safe: setiap materi dipaksa mematuhi kontrak TypeScript
 * - Offline-first: data statis, tidak bergantung API pihak ketiga
 * - Git-versioned: setiap perubahan kurikulum ter-track di Git history
 *
 * Struktur data mendukung:
 * - IRT 3PLM parameters (discrimination, difficulty, guessing)
 * - AI Tutor context (Socratic prompts, misconceptions, scaffolding)
 * - HLS video streaming (Vercel Edge CDN, adaptive bitrate)
 * - Bloom's Taxonomy tagging (C1-C6)
 * - Chapter-based micro-learning navigation
 */

// ─── IRT 3PLM Parameters (selaras dengan lib/ai/irt-engine.ts) ───
export interface IRTParams {
  /** Discrimination (a): seberapa baik item membedakan kemampuan siswa. Range: 0.5-2.5 */
  a: number;
  /** Difficulty (b): tingkat kesulitan pada skala theta. Range: -3.0 to +3.0 */
  b: number;
  /** Pseudo-guessing (c): probabilitas menjawab benar secara tebakan. Range: 0.0-0.35 */
  c: number;
}

// ─── AI Tutor Context (untuk Socratic AI Assistant) ───
export interface AIContext {
  /** Kata kunci topik untuk retrieval AI tutor */
  keywords: string[];
  /** Miskonsepsi umum yang sering dialami siswa di topik ini */
  commonMisconceptions: string[];
  /** Pertanyaan Socratic untuk memicu berpikir kritis */
  socraticPrompts: string[];
  /** Prasyarat konsep yang harus dikuasai sebelum lesson ini */
  prerequisites: string[];
  /** Scaffolding hints: petunjuk bertahap jika siswa kesulitan */
  scaffoldingHints: string[];
}

// ─── Chapter (segment navigasi dalam video) ───
export interface Chapter {
  title: string;
  startTime: number; // detik
}

// ─── Lesson (unit micro-learning tunggal) ───
export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;           // Display string (e.g. "~4 menit")
  durationSeconds: number;    // Durasi aktual dalam detik (untuk analytics)
  bloomLevel: BloomLevel;     // Taxonomy level
  videoUrl: string;           // HLS (.m3u8) atau direct (.mp4)
  thumbnailColor: string;     // Gradient placeholder
  chapters: Chapter[];
  order: number;
  /** IRT 3PLM parameters untuk assessment items terkait lesson ini */
  irt: IRTParams;
  /** Konteks AI untuk Socratic tutor */
  aiContext: AIContext;
  /** Tags untuk filtering & search */
  tags: string[];
}

// ─── Bloom's Taxonomy Levels ───
export type BloomLevel =
  | 'C1 Remembering'
  | 'C2 Understanding'
  | 'C3 Applying'
  | 'C4 Analyzing'
  | 'C5 Evaluating'
  | 'C6 Creating';

// ─── Module (kumpulan lessons dalam satu topik) ───
export interface Module {
  id: string;
  title: string;
  description: string;
  masteryThreshold: number;   // 0-100, skor minimum untuk unlock modul berikutnya
  estimatedHours: number;     // Estimasi waktu penyelesaian (jam)
  lessons: Lesson[];
  /** Prasyarat modul (ID modul yang harus selesai duluan) */
  prerequisiteModules: string[];
}

// ─── HLS Video Sources ───
// PRODUCTION: Video lokal di public/videos/ → Vercel Edge CDN (gratis, < 1.5s cold start)
// DEVELOPMENT: Apple/Mux test streams sebagai fallback saat video belum di-encode

// Local HLS paths (setelah encode via scripts/encode-hls.sh)
const LOCAL_LESSON_01 = '/videos/lesson-01-pengantar/master.m3u8';
const LOCAL_LESSON_02 = '/videos/lesson-02-koefisien/master.m3u8';
const LOCAL_LESSON_03 = '/videos/lesson-03-diskriminan/master.m3u8';
const LOCAL_LESSON_04 = '/videos/lesson-04-titik-puncak/master.m3u8';
const LOCAL_LESSON_05 = '/videos/lesson-05-pemfaktoran/master.m3u8';

// Fallback: Apple/Mux public HLS test streams (untuk development)
const STREAM_APPLE_BASIC = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8';
const STREAM_APPLE_ADVANCED = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8';
const STREAM_MUX_TEST = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

/**
 * Resolves video URL: gunakan lokal jika tersedia, fallback ke test stream.
 * Di production (Vercel), path /videos/ dilayani dari Edge CDN global.
 */
const resolveVideo = (localPath: string, fallback: string): string => {
  // In production build, local paths always work via Vercel CDN
  // In development, check if file exists would require server-side check
  // So we use env variable to toggle
  if (process.env.NEXT_PUBLIC_USE_LOCAL_VIDEOS === 'true') {
    return localPath;
  }
  return fallback;
};

// ─── Module 1: Aljabar & Fungsi Kuadrat ───
export const MODULE_1: Module = {
  id: 'mod-aljabar-kuadrat',
  title: 'Aljabar & Fungsi Kuadrat',
  description: 'Memahami bentuk umum, diskriminan, titik puncak, dan grafik fungsi kuadrat',
  masteryThreshold: 90,
  estimatedHours: 2.5,
  prerequisiteModules: [],
  lessons: [
    {
      id: 'lesson-01-pengantar',
      title: 'Pengantar: Mengapa Parabola Ada di Mana-Mana?',
      description: 'Hook motivasional — parabola dalam arsitektur, fisika, dan ekonomi. Membangun relevansi materi dengan dunia nyata.',
      duration: '~4 menit',
      durationSeconds: 240,
      bloomLevel: 'C1 Remembering',
      videoUrl: resolveVideo(LOCAL_LESSON_01, STREAM_APPLE_BASIC),
      thumbnailColor: 'from-tactical-orange to-amber-500',
      chapters: [
        { title: 'Hook: Parabola di Kehidupan Nyata', startTime: 0 },
        { title: 'Definisi Fungsi Kuadrat', startTime: 45 },
        { title: 'Bentuk Umum f(x) = ax² + bx + c', startTime: 120 },
        { title: 'CTA: Coba di Canvas Interaktif', startTime: 200 },
      ],
      order: 1,
      irt: { a: 0.8, b: -1.5, c: 0.25 },
      aiContext: {
        keywords: ['parabola', 'fungsi kuadrat', 'bentuk umum', 'ax²+bx+c'],
        commonMisconceptions: [
          'Siswa mengira parabola hanya ada di matematika, bukan dunia nyata',
          'Siswa bingung antara fungsi linear dan kuadrat',
          'Siswa tidak memahami mengapa pangkat 2 menghasilkan kurva',
        ],
        socraticPrompts: [
          'Apa yang terjadi pada lintasan bola basket saat dilempar? Bentuk apa yang terbentuk?',
          'Jika f(x) = x², apa bedanya dengan f(x) = x? Coba gambar keduanya.',
          'Mengapa jembatan lengkung lebih kuat dari jembatan datar?',
        ],
        prerequisites: [],
        scaffoldingHints: [
          'Ingat: fungsi linear f(x) = mx + b menghasilkan garis lurus',
          'Fungsi kuadrat punya x² — ini yang membuat kurva',
          'Coba substitusi x = -2, -1, 0, 1, 2 ke f(x) = x² dan plot hasilnya',
        ],
      },
      tags: ['pengantar', 'motivasi', 'parabola', 'bentuk-umum'],
    },
    {
      id: 'lesson-02-koefisien',
      title: 'Peran Koefisien a, b, dan c',
      description: 'Eksplorasi visual — bagaimana setiap koefisien mengubah bentuk dan posisi parabola.',
      duration: '~6 menit',
      durationSeconds: 360,
      bloomLevel: 'C2 Understanding',
      videoUrl: resolveVideo(LOCAL_LESSON_02, STREAM_APPLE_ADVANCED),
      thumbnailColor: 'from-blue-500 to-indigo-600',
      chapters: [
        { title: 'Koefisien a: Lebar & Arah Parabola', startTime: 0 },
        { title: 'Koefisien b: Pergeseran Horizontal', startTime: 90 },
        { title: 'Koefisien c: Pergeseran Vertikal', startTime: 180 },
        { title: 'Kuis Cepat: Tebak Grafik', startTime: 270 },
        { title: 'Rangkuman & CTA', startTime: 330 },
      ],
      order: 2,
      irt: { a: 1.2, b: -0.8, c: 0.20 },
      aiContext: {
        keywords: ['koefisien', 'a', 'b', 'c', 'lebar parabola', 'arah buka'],
        commonMisconceptions: [
          'Siswa mengira koefisien b menggeser parabola secara horizontal murni',
          'Siswa bingung antara efek a negatif (terbalik) vs a kecil (lebar)',
          'Siswa lupa bahwa c adalah titik potong sumbu-y',
        ],
        socraticPrompts: [
          'Jika a = 1 dan a = 5, mana parabola yang lebih sempit? Mengapa?',
          'Apa yang terjadi pada grafik jika kita ubah a dari positif ke negatif?',
          'Tanpa menghitung, di mana grafik f(x) = x² + 3 memotong sumbu-y?',
        ],
        prerequisites: ['lesson-01-pengantar'],
        scaffoldingHints: [
          'Fokus pada a dulu: a > 0 buka ke atas, a < 0 buka ke bawah',
          'Semakin besar |a|, semakin sempit parabolanya',
          'c selalu = f(0), yaitu nilai y saat x = 0',
        ],
      },
      tags: ['koefisien', 'transformasi', 'grafik', 'visual'],
    },
    {
      id: 'lesson-03-diskriminan',
      title: 'Diskriminan: Kunci Rahasia Akar Persamaan',
      description: 'Memahami D = b² - 4ac dan hubungannya dengan jumlah akar real.',
      duration: '~8 menit',
      durationSeconds: 480,
      bloomLevel: 'C3 Applying',
      videoUrl: resolveVideo(LOCAL_LESSON_03, STREAM_MUX_TEST),
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
      irt: { a: 1.5, b: 0.0, c: 0.20 },
      aiContext: {
        keywords: ['diskriminan', 'D', 'b²-4ac', 'akar', 'real', 'kembar'],
        commonMisconceptions: [
          'Siswa lupa menguadratkan b (menulis b - 4ac bukan b² - 4ac)',
          'Siswa bingung antara D = 0 (satu akar kembar) vs tidak ada akar',
          'Siswa tidak menghubungkan diskriminan dengan posisi grafik terhadap sumbu-x',
        ],
        socraticPrompts: [
          'Jika D > 0, berapa kali grafik parabola memotong sumbu-x?',
          'Apa arti geometris dari D = 0? Bayangkan parabolanya.',
          'Bisakah kamu membuat persamaan kuadrat yang pasti tidak punya akar real?',
        ],
        prerequisites: ['lesson-01-pengantar', 'lesson-02-koefisien'],
        scaffoldingHints: [
          'D = b² - 4ac. Hitung b² dulu, lalu 4ac, baru kurangkan',
          'D > 0 → 2 akar, D = 0 → 1 akar kembar, D < 0 → 0 akar real',
          'Hubungkan: D > 0 berarti grafik memotong sumbu-x di 2 titik',
        ],
      },
      tags: ['diskriminan', 'akar', 'persamaan-kuadrat', 'analisis'],
    },
    {
      id: 'lesson-04-titik-puncak',
      title: 'Titik Puncak & Sumbu Simetri',
      description: 'Menghitung dan memvisualisasikan titik puncak parabola menggunakan rumus -b/2a.',
      duration: '~7 menit',
      durationSeconds: 420,
      bloomLevel: 'C3 Applying',
      videoUrl: resolveVideo(LOCAL_LESSON_04, STREAM_APPLE_ADVANCED),
      thumbnailColor: 'from-purple-500 to-pink-600',
      chapters: [
        { title: 'Rumus Titik Puncak', startTime: 0 },
        { title: 'Sumbu Simetri x = -b/2a', startTime: 80 },
        { title: 'Nilai Maksimum vs Minimum', startTime: 160 },
        { title: 'Contoh Soal Terapan', startTime: 260 },
        { title: 'Latihan Mandiri', startTime: 350 },
      ],
      order: 4,
      irt: { a: 1.4, b: 0.5, c: 0.15 },
      aiContext: {
        keywords: ['titik puncak', 'vertex', 'sumbu simetri', '-b/2a', 'maksimum', 'minimum'],
        commonMisconceptions: [
          'Siswa lupa tanda negatif di rumus x = -b/2a',
          'Siswa bingung kapan titik puncak adalah maksimum vs minimum',
          'Siswa tidak bisa menghubungkan titik puncak dengan bentuk vertex f(x) = a(x-h)² + k',
        ],
        socraticPrompts: [
          'Jika a > 0, apakah titik puncak adalah titik tertinggi atau terendah? Mengapa?',
          'Bagaimana cara menemukan nilai y di titik puncak setelah tahu x-nya?',
          'Sebuah peluru ditembakkan ke atas. Kapan ia mencapai ketinggian maksimum?',
        ],
        prerequisites: ['lesson-02-koefisien'],
        scaffoldingHints: [
          'Langkah 1: Hitung x_puncak = -b / (2a)',
          'Langkah 2: Substitusi x_puncak ke f(x) untuk dapat y_puncak',
          'a > 0 → puncak di bawah (minimum), a < 0 → puncak di atas (maksimum)',
        ],
      },
      tags: ['titik-puncak', 'vertex', 'sumbu-simetri', 'optimasi'],
    },
    {
      id: 'lesson-05-pemfaktoran',
      title: 'Teknik Pemfaktoran Persamaan Kuadrat',
      description: 'Metode pemfaktoran, melengkapkan kuadrat sempurna, dan rumus abc.',
      duration: '~10 menit',
      durationSeconds: 600,
      bloomLevel: 'C4 Analyzing',
      videoUrl: resolveVideo(LOCAL_LESSON_05, STREAM_MUX_TEST),
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
      irt: { a: 1.8, b: 1.2, c: 0.15 },
      aiContext: {
        keywords: ['pemfaktoran', 'melengkapkan kuadrat', 'rumus abc', 'rumus kuadratik', 'akar'],
        commonMisconceptions: [
          'Siswa mencoba memfaktorkan semua persamaan padahal tidak semua bisa difaktorkan',
          'Siswa salah tanda saat melengkapkan kuadrat sempurna',
          'Siswa lupa membagi dengan 2a di rumus kuadratik',
        ],
        socraticPrompts: [
          'Kapan pemfaktoran langsung tidak bisa digunakan? Beri contoh.',
          'Apa hubungan antara rumus kuadratik dan diskriminan yang sudah kita pelajari?',
          'Jika kamu hanya boleh mengingat satu metode, mana yang paling universal? Mengapa?',
        ],
        prerequisites: ['lesson-03-diskriminan', 'lesson-04-titik-puncak'],
        scaffoldingHints: [
          'Coba faktorkan dulu. Jika tidak bisa, gunakan rumus kuadratik',
          'Rumus: x = (-b ± √D) / 2a, di mana D = b² - 4ac',
          'Melengkapkan kuadrat: pindahkan c, tambah (b/2a)² di kedua ruas',
        ],
      },
      tags: ['pemfaktoran', 'rumus-kuadratik', 'teknik-solusi', 'analisis'],
    },
  ],
};

// ─── Module 2: Persamaan Linear & Sistem ───
export const MODULE_2: Module = {
  id: 'mod-linear-sistem',
  title: 'Persamaan Linear & Sistem',
  description: 'Sistem persamaan linear dua variabel, metode eliminasi dan substitusi',
  masteryThreshold: 90,
  estimatedHours: 3.0,
  prerequisiteModules: ['mod-aljabar-kuadrat'],
  lessons: [
    {
      id: 'lesson-06-linear-intro',
      title: 'Persamaan Linear: Garis Lurus di Mana-Mana',
      description: 'Pengantar persamaan linear satu variabel dan dua variabel. Hubungan antara persamaan dan grafik garis lurus.',
      duration: '~5 menit',
      durationSeconds: 300,
      bloomLevel: 'C1 Remembering',
      videoUrl: resolveVideo('/videos/lesson-06-linear-intro/master.m3u8', STREAM_APPLE_BASIC),
      thumbnailColor: 'from-cyan-500 to-blue-600',
      chapters: [
        { title: 'Hook: Garis Lurus di Kehidupan', startTime: 0 },
        { title: 'Bentuk Umum ax + by = c', startTime: 60 },
        { title: 'Gradien dan Intercept', startTime: 150 },
        { title: 'Menggambar Garis dari Persamaan', startTime: 220 },
      ],
      order: 1,
      irt: { a: 0.9, b: -1.5, c: 0.25 },
      aiContext: {
        keywords: ['persamaan linear', 'garis lurus', 'gradien', 'intercept', 'ax+by=c'],
        commonMisconceptions: [
          'Siswa bingung antara gradien positif dan negatif',
          'Siswa mengira semua persamaan menghasilkan garis lurus',
          'Siswa lupa bahwa y = mx + c adalah bentuk khusus dari ax + by = c',
        ],
        socraticPrompts: [
          'Jika gradien = 2, apa artinya bagi kemiringan garis?',
          'Di mana garis y = 3x + 1 memotong sumbu-y? Bagaimana kamu tahu tanpa menggambar?',
          'Apa bedanya y = 2x dan y = 2x + 5 secara visual?',
        ],
        prerequisites: [],
        scaffoldingHints: [
          'y = mx + c: m adalah gradien (kemiringan), c adalah titik potong sumbu-y',
          'Gradien = perubahan y / perubahan x = (y2-y1)/(x2-x1)',
          'Untuk menggambar: cari 2 titik, lalu hubungkan dengan garis lurus',
        ],
      },
      tags: ['linear', 'garis-lurus', 'gradien', 'pengantar'],
    },
    {
      id: 'lesson-07-spldv-intro',
      title: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
      description: 'Memahami konsep SPLDV: dua garis yang berpotongan, sejajar, atau berimpit.',
      duration: '~6 menit',
      durationSeconds: 360,
      bloomLevel: 'C2 Understanding',
      videoUrl: resolveVideo('/videos/lesson-07-spldv-intro/master.m3u8', STREAM_APPLE_ADVANCED),
      thumbnailColor: 'from-violet-500 to-purple-600',
      chapters: [
        { title: 'Apa itu SPLDV?', startTime: 0 },
        { title: 'Solusi Tunggal (Berpotongan)', startTime: 70 },
        { title: 'Tanpa Solusi (Sejajar)', startTime: 150 },
        { title: 'Tak Hingga Solusi (Berimpit)', startTime: 230 },
        { title: 'Visualisasi di Canvas', startTime: 300 },
      ],
      order: 2,
      irt: { a: 1.1, b: -0.8, c: 0.20 },
      aiContext: {
        keywords: ['SPLDV', 'sistem persamaan', 'dua variabel', 'berpotongan', 'sejajar', 'berimpit'],
        commonMisconceptions: [
          'Siswa mengira SPLDV selalu punya solusi',
          'Siswa tidak bisa membedakan kapan sistem sejajar vs berimpit',
          'Siswa bingung mengapa dua persamaan dibutuhkan untuk dua variabel',
        ],
        socraticPrompts: [
          'Jika dua garis sejajar, berapa titik perpotongannya? Apa artinya untuk solusi?',
          'Kapan kamu butuh 2 persamaan? Bisakah 1 persamaan menentukan x dan y sekaligus?',
          'Bagaimana kamu tahu dari persamaan saja (tanpa gambar) bahwa dua garis sejajar?',
        ],
        prerequisites: ['lesson-06-linear-intro'],
        scaffoldingHints: [
          'SPLDV = 2 persamaan, 2 variabel (x dan y)',
          'Solusi = titik (x, y) yang memenuhi KEDUA persamaan',
          'Sejajar: gradien sama, intercept beda → tidak ada solusi',
        ],
      },
      tags: ['SPLDV', 'sistem-persamaan', 'solusi', 'grafik'],
    },
    {
      id: 'lesson-08-eliminasi',
      title: 'Metode Eliminasi: Hapus Satu Variabel',
      description: 'Teknik eliminasi untuk menyelesaikan SPLDV — menyamakan koefisien lalu mengurangkan.',
      duration: '~8 menit',
      durationSeconds: 480,
      bloomLevel: 'C3 Applying',
      videoUrl: resolveVideo('/videos/lesson-08-eliminasi/master.m3u8', STREAM_MUX_TEST),
      thumbnailColor: 'from-amber-500 to-orange-600',
      chapters: [
        { title: 'Ide Dasar Eliminasi', startTime: 0 },
        { title: 'Langkah 1: Samakan Koefisien', startTime: 60 },
        { title: 'Langkah 2: Kurangkan/Jumlahkan', startTime: 150 },
        { title: 'Langkah 3: Substitusi Balik', startTime: 250 },
        { title: 'Contoh Soal Lengkap', startTime: 330 },
        { title: 'Latihan Mandiri', startTime: 420 },
      ],
      order: 3,
      irt: { a: 1.4, b: 0.0, c: 0.20 },
      aiContext: {
        keywords: ['eliminasi', 'samakan koefisien', 'kurangkan', 'SPLDV', 'variabel'],
        commonMisconceptions: [
          'Siswa lupa mengalikan SELURUH persamaan (hanya mengalikan satu suku)',
          'Siswa bingung kapan harus menjumlahkan vs mengurangkan',
          'Siswa lupa substitusi balik untuk mencari variabel kedua',
        ],
        socraticPrompts: [
          'Jika koefisien x di kedua persamaan sudah sama, apa langkah selanjutnya?',
          'Kapan kamu menjumlahkan dan kapan mengurangkan? Lihat tanda koefisiennya.',
          'Setelah dapat nilai x, bagaimana cara mencari y?',
        ],
        prerequisites: ['lesson-07-spldv-intro'],
        scaffoldingHints: [
          'Pilih variabel yang ingin dieliminasi (yang koefisiennya mudah disamakan)',
          'Kalikan persamaan agar koefisien variabel target sama',
          'Tanda sama → kurangkan. Tanda beda → jumlahkan.',
        ],
      },
      tags: ['eliminasi', 'teknik-solusi', 'SPLDV', 'koefisien'],
    },
    {
      id: 'lesson-09-substitusi',
      title: 'Metode Substitusi: Ganti dan Selesaikan',
      description: 'Teknik substitusi — nyatakan satu variabel dalam variabel lain, lalu substitusi.',
      duration: '~7 menit',
      durationSeconds: 420,
      bloomLevel: 'C3 Applying',
      videoUrl: resolveVideo('/videos/lesson-09-substitusi/master.m3u8', STREAM_APPLE_ADVANCED),
      thumbnailColor: 'from-lime-500 to-green-600',
      chapters: [
        { title: 'Ide Dasar Substitusi', startTime: 0 },
        { title: 'Langkah 1: Nyatakan y = ...', startTime: 70 },
        { title: 'Langkah 2: Substitusi ke Persamaan Lain', startTime: 150 },
        { title: 'Langkah 3: Selesaikan & Substitusi Balik', startTime: 250 },
        { title: 'Kapan Substitusi Lebih Mudah?', startTime: 340 },
      ],
      order: 4,
      irt: { a: 1.3, b: 0.5, c: 0.20 },
      aiContext: {
        keywords: ['substitusi', 'nyatakan variabel', 'ganti', 'SPLDV'],
        commonMisconceptions: [
          'Siswa substitusi ke persamaan yang SAMA (bukan persamaan lain)',
          'Siswa salah tanda saat memindahkan ruas',
          'Siswa bingung memilih variabel mana yang dinyatakan duluan',
        ],
        socraticPrompts: [
          'Dari persamaan 2x + y = 7, bisakah kamu nyatakan y dalam bentuk x?',
          'Mengapa kita substitusi ke persamaan LAIN, bukan persamaan yang sama?',
          'Kapan metode substitusi lebih mudah daripada eliminasi?',
        ],
        prerequisites: ['lesson-07-spldv-intro'],
        scaffoldingHints: [
          'Pilih persamaan yang paling mudah dinyatakan (koefisien 1 atau -1)',
          'Substitusi = ganti variabel di persamaan lain dengan ekspresi yang sudah ditemukan',
          'Substitusi lebih mudah jika salah satu variabel sudah berkoefisien 1',
        ],
      },
      tags: ['substitusi', 'teknik-solusi', 'SPLDV', 'variabel'],
    },
    {
      id: 'lesson-10-soal-cerita',
      title: 'Soal Cerita SPLDV: Dari Kata ke Persamaan',
      description: 'Menerjemahkan soal cerita menjadi sistem persamaan linear dan menyelesaikannya.',
      duration: '~10 menit',
      durationSeconds: 600,
      bloomLevel: 'C4 Analyzing',
      videoUrl: resolveVideo('/videos/lesson-10-soal-cerita/master.m3u8', STREAM_MUX_TEST),
      thumbnailColor: 'from-pink-500 to-rose-600',
      chapters: [
        { title: 'Strategi Membaca Soal Cerita', startTime: 0 },
        { title: 'Identifikasi Variabel', startTime: 80 },
        { title: 'Menyusun Persamaan dari Kalimat', startTime: 170 },
        { title: 'Contoh: Harga Barang', startTime: 280 },
        { title: 'Contoh: Umur & Campuran', startTime: 400 },
        { title: 'Soal Tantangan', startTime: 520 },
      ],
      order: 5,
      irt: { a: 1.7, b: 1.5, c: 0.15 },
      aiContext: {
        keywords: ['soal cerita', 'pemodelan', 'variabel', 'terjemahkan', 'SPLDV aplikasi'],
        commonMisconceptions: [
          'Siswa langsung menghitung tanpa mendefinisikan variabel terlebih dahulu',
          'Siswa salah menerjemahkan "lebih dari" dan "kurang dari" ke operasi matematika',
          'Siswa lupa memeriksa apakah jawaban masuk akal dalam konteks soal',
        ],
        socraticPrompts: [
          'Apa yang ditanyakan soal? Variabel apa yang perlu kamu cari?',
          'Kalimat mana yang bisa kamu ubah menjadi persamaan pertama?',
          'Setelah dapat jawaban x = 5, apakah masuk akal dalam konteks soal? Cek!',
        ],
        prerequisites: ['lesson-08-eliminasi', 'lesson-09-substitusi'],
        scaffoldingHints: [
          'Langkah 1: Baca soal, tentukan apa yang dicari (x = ?, y = ?)',
          'Langkah 2: Cari 2 informasi yang bisa jadi 2 persamaan',
          'Langkah 3: Selesaikan dengan eliminasi atau substitusi, lalu cek jawaban',
        ],
      },
      tags: ['soal-cerita', 'pemodelan', 'aplikasi', 'analisis', 'SPLDV'],
    },
  ],
};

// ─── All Modules ───
export const CURRICULUM: Module[] = [MODULE_1, MODULE_2];

// ─── Helper: Cari lesson berdasarkan ID ───
export function findLessonById(lessonId: string): Lesson | undefined {
  for (const mod of CURRICULUM) {
    const lesson = mod.lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

// ─── Helper: Ambil AI context untuk Socratic tutor ───
export function getAIContextForLesson(lessonId: string): AIContext | null {
  const lesson = findLessonById(lessonId);
  return lesson?.aiContext ?? null;
}

// ─── Helper: Ambil IRT params untuk adaptive assessment ───
export function getIRTParamsForLesson(lessonId: string): IRTParams | null {
  const lesson = findLessonById(lessonId);
  return lesson?.irt ?? null;
}

// ─── Helper: Hitung total durasi modul ───
export function getModuleDuration(moduleId: string): number {
  const mod = CURRICULUM.find(m => m.id === moduleId);
  if (!mod) return 0;
  return mod.lessons.reduce((sum, l) => sum + l.durationSeconds, 0);
}
