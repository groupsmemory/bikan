/**
 * BIKAN Instructor Upload — Materi & Transkrip
 * ──────────────────────────────────────────────
 * Route: /instructor/upload
 * Antarmuka untuk mengunggah:
 * - Video materi (akan di-encode ke HLS via FFmpeg lokal)
 * - Transkrip teks (untuk AI context di lessons.ts)
 * - Metadata lesson (judul, deskripsi, chapters, IRT params)
 *
 * Catatan: Untuk MVP, upload bersifat "form-to-guide" —
 * instruktur mengisi metadata, lalu mendapat instruksi
 * FFmpeg untuk encode video secara lokal.
 * File video tidak di-upload ke server (hemat bandwidth).
 */

'use client';

import React, { useState } from 'react';
import { Upload, FileVideo, FileText, Copy, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/features/auth/AuthContext';

interface LessonMetadata {
  id: string;
  title: string;
  description: string;
  duration: string;
  bloomLevel: string;
  chapters: string; // JSON string
  keywords: string;
  misconceptions: string;
  socraticPrompts: string;
  scaffoldingHints: string;
}

export default function InstructorUploadPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'metadata' | 'encode' | 'done'>('metadata');
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] = useState<LessonMetadata>({
    id: '',
    title: '',
    description: '',
    duration: '~5 menit',
    bloomLevel: 'C2 Understanding',
    chapters: '',
    keywords: '',
    misconceptions: '',
    socraticPrompts: '',
    scaffoldingHints: '',
  });

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const slug = metadata.id || metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);

  const ffmpegCommand = `scripts\\encode-hls.bat "C:\\path\\to\\video.mp4" ${slug}`;

  const lessonsEntry = `{
  id: '${slug}',
  title: '${metadata.title}',
  description: '${metadata.description}',
  duration: '${metadata.duration}',
  durationSeconds: 300,
  bloomLevel: '${metadata.bloomLevel}',
  videoUrl: resolveVideo('/videos/${slug}/master.m3u8', STREAM_APPLE_BASIC),
  thumbnailColor: 'from-blue-500 to-indigo-600',
  chapters: [${metadata.chapters || '\n    { title: "Intro", startTime: 0 }'}],
  order: 6,
  irt: { a: 1.2, b: 0.5, c: 0.20 },
  aiContext: {
    keywords: [${metadata.keywords.split(',').map(k => `'${k.trim()}'`).join(', ')}],
    commonMisconceptions: [${metadata.misconceptions.split('\n').filter(Boolean).map(m => `\n      '${m.trim()}'`).join(',')}
    ],
    socraticPrompts: [${metadata.socraticPrompts.split('\n').filter(Boolean).map(p => `\n      '${p.trim()}'`).join(',')}
    ],
    prerequisites: [],
    scaffoldingHints: [${metadata.scaffoldingHints.split('\n').filter(Boolean).map(h => `\n      '${h.trim()}'`).join(',')}
    ],
  },
  tags: [${metadata.keywords.split(',').map(k => `'${k.trim()}'`).join(', ')}],
}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-base p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Upload Materi</h1>
            <p className="text-sm text-muted-blue/50">Tambah lesson baru ke kurikulum BIKAN</p>
          </div>
          <a href="/instructor" className="flex items-center gap-1 text-xs font-bold text-tactical-orange hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </a>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {['metadata', 'encode', 'done'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-tactical-orange text-white' : 'bg-muted-blue/10 text-muted-blue/40'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-muted-blue/10" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Metadata */}
        {step === 'metadata' && (
          <div className="soft-ui-card p-6 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-tactical-orange" />
              Metadata Lesson
            </h2>

            <div className="grid gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Judul Lesson</label>
                <input
                  value={metadata.title}
                  onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="Contoh: Pengantar Fungsi Kuadrat"
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Deskripsi</label>
                <textarea
                  value={metadata.description}
                  onChange={e => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Deskripsi singkat materi..."
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-blue/40">Durasi</label>
                  <input
                    value={metadata.duration}
                    onChange={e => setMetadata({ ...metadata, duration: e.target.value })}
                    placeholder="~5 menit"
                    className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-blue/40">Bloom Level</label>
                  <select
                    value={metadata.bloomLevel}
                    onChange={e => setMetadata({ ...metadata, bloomLevel: e.target.value })}
                    className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm"
                  >
                    <option>C1 Remembering</option>
                    <option>C2 Understanding</option>
                    <option>C3 Applying</option>
                    <option>C4 Analyzing</option>
                    <option>C5 Evaluating</option>
                    <option>C6 Creating</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Keywords (pisah koma)</label>
                <input
                  value={metadata.keywords}
                  onChange={e => setMetadata({ ...metadata, keywords: e.target.value })}
                  placeholder="parabola, fungsi kuadrat, koefisien"
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Miskonsepsi Umum (satu per baris)</label>
                <textarea
                  value={metadata.misconceptions}
                  onChange={e => setMetadata({ ...metadata, misconceptions: e.target.value })}
                  placeholder="Siswa mengira a negatif berarti parabola lebih kecil&#10;Siswa lupa tanda negatif di rumus"
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Pertanyaan Sokratik (satu per baris)</label>
                <textarea
                  value={metadata.socraticPrompts}
                  onChange={e => setMetadata({ ...metadata, socraticPrompts: e.target.value })}
                  placeholder="Apa yang terjadi jika a = 0?&#10;Bagaimana grafik berubah jika c bertambah?"
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-blue/40">Scaffolding Hints (satu per baris)</label>
                <textarea
                  value={metadata.scaffoldingHints}
                  onChange={e => setMetadata({ ...metadata, scaffoldingHints: e.target.value })}
                  placeholder="Coba substitusi x = 0 dulu&#10;Ingat: a > 0 berarti buka ke atas"
                  className="w-full mt-1 p-3 rounded-lg border border-muted-blue/10 text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={() => setStep('encode')}
              disabled={!metadata.title}
              className="w-full py-3 rounded-xl bg-tactical-orange text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              Lanjut: Instruksi Encode Video →
            </button>
          </div>
        )}

        {/* Step 2: Encode Instructions */}
        {step === 'encode' && (
          <div className="space-y-4">
            <div className="soft-ui-card p-6 space-y-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-tactical-orange" />
                Encode Video ke HLS
              </h2>
              <p className="text-xs text-muted-blue/50 leading-relaxed">
                Jalankan perintah berikut di terminal untuk mengkonversi video ke format HLS multi-bitrate.
                Pastikan FFmpeg sudah terinstall (<code className="bg-muted-blue/5 px-1 rounded">winget install ffmpeg</code>).
              </p>

              <div className="relative">
                <pre className="p-4 bg-muted-blue text-white text-xs rounded-xl overflow-x-auto font-mono">
                  {ffmpegCommand}
                </pre>
                <button
                  onClick={() => handleCopy(ffmpegCommand)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-muted-green" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                </button>
              </div>

              <p className="text-[10px] text-muted-blue/40">
                Output akan tersimpan di: <code className="bg-muted-blue/5 px-1 rounded">public/videos/{slug}/</code>
              </p>
            </div>

            <div className="soft-ui-card p-6 space-y-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-green" />
                Entry untuk lessons.ts (Git-CMS)
              </h2>
              <p className="text-xs text-muted-blue/50">
                Tambahkan entry berikut ke <code className="bg-muted-blue/5 px-1 rounded">src/data/lessons.ts</code> di dalam array <code>lessons</code>:
              </p>

              <div className="relative">
                <pre className="p-4 bg-muted-blue/5 text-muted-blue text-[10px] rounded-xl overflow-x-auto font-mono max-h-[300px] overflow-y-auto">
                  {lessonsEntry}
                </pre>
                <button
                  onClick={() => handleCopy(lessonsEntry)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-muted-blue/10 hover:bg-muted-blue/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-muted-green" /> : <Copy className="w-3.5 h-3.5 text-muted-blue/40" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('metadata')}
                className="flex-1 py-3 rounded-xl border border-muted-blue/10 text-sm font-bold text-muted-blue/60 hover:bg-muted-blue/5 transition-colors"
              >
                ← Kembali
              </button>
              <button
                onClick={() => setStep('done')}
                className="flex-1 py-3 rounded-xl bg-muted-green text-white font-bold text-sm hover:scale-[1.02] transition-transform"
              >
                Selesai ✓
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="soft-ui-card p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-bold">Materi Siap Ditambahkan!</h2>
            <p className="text-sm text-muted-blue/50 leading-relaxed max-w-md mx-auto">
              Setelah video di-encode dan entry ditambahkan ke <code>lessons.ts</code>,
              commit perubahan dan deploy. Materi akan langsung tersedia untuk siswa.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={() => { setStep('metadata'); setMetadata({ ...metadata, title: '', description: '' }); }}
                className="px-6 py-2 rounded-xl bg-tactical-orange text-white text-xs font-bold hover:scale-105 transition-transform"
              >
                + Upload Lagi
              </button>
              <a
                href="/instructor"
                className="px-6 py-2 rounded-xl border border-muted-blue/10 text-xs font-bold text-muted-blue/60 hover:bg-muted-blue/5 transition-colors"
              >
                Kembali ke Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
