/**
 * BIKAN Privacy Policy
 * Mencakup perlindungan data anak (COPPA/FERPA compliance)
 */

import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi - BIKAN LMS',
  description: 'Kebijakan privasi dan perlindungan data platform BIKAN LMS',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-base py-12 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <Link href="/" className="text-tactical-orange text-xs font-bold no-underline">← Kembali</Link>

        <h1 className="text-2xl font-black mt-6">Kebijakan Privasi</h1>
        <p className="text-muted-blue/50 text-sm">KMP BIKAN — Terakhir diperbarui: 15 Mei 2026</p>
        <p className="text-muted-blue/50 text-sm">Berlaku sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (PDP) dan prinsip COPPA/FERPA untuk perlindungan data anak.</p>

        <hr />

        <h2>1. Data yang Kami Kumpulkan</h2>

        <h3>1.1 Data yang Anda Berikan</h3>
        <ul>
          <li><strong>Data Identitas:</strong> Nama lengkap, alamat email, kata sandi (disimpan dalam bentuk hash bcrypt, tidak dapat dibaca).</li>
          <li><strong>Data Profil:</strong> Peran pengguna (siswa/instruktur/admin).</li>
          <li><strong>Data Pembayaran:</strong> Diproses oleh Xendit — kami TIDAK menyimpan nomor kartu, CVV, atau data finansial sensitif.</li>
        </ul>

        <h3>1.2 Data yang Dikumpulkan Otomatis</h3>
        <ul>
          <li><strong>Data Pembelajaran:</strong> Progres modul, skor assessment, estimasi kemampuan (theta IRT), waktu belajar, streak harian.</li>
          <li><strong>Data Interaksi AI:</strong> Pertanyaan yang diajukan ke Socratic Assistant, jumlah token yang digunakan, latensi respons. Kami TIDAK menyimpan konten percakapan secara permanen.</li>
          <li><strong>Data Teknis:</strong> Tipe browser, resolusi layar, preferensi tema (dark/light), status koneksi internet.</li>
        </ul>

        <h3>1.3 Data yang TIDAK Kami Kumpulkan</h3>
        <ul>
          <li>Lokasi GPS presisi</li>
          <li>Kontak telepon atau daftar kontak</li>
          <li>Foto, video, atau audio dari perangkat pengguna (kecuali saat fitur voice input diaktifkan secara eksplisit)</li>
          <li>Data dari aplikasi lain di perangkat</li>
        </ul>

        <h2>2. Tujuan Penggunaan Data</h2>
        <table>
          <thead>
            <tr><th>Data</th><th>Tujuan</th><th>Dasar Hukum</th></tr>
          </thead>
          <tbody>
            <tr><td>Identitas</td><td>Autentikasi & manajemen akun</td><td>Persetujuan pengguna</td></tr>
            <tr><td>Pembelajaran</td><td>Personalisasi soal adaptif (IRT), tracking mastery</td><td>Kepentingan sah (peningkatan layanan)</td></tr>
            <tr><td>Interaksi AI</td><td>Monitoring biaya token, peningkatan kualitas respons</td><td>Kepentingan sah</td></tr>
            <tr><td>Pembayaran</td><td>Pemrosesan langganan</td><td>Pelaksanaan kontrak</td></tr>
          </tbody>
        </table>

        <h2>3. Perlindungan Data Anak (COPPA/FERPA Compliance)</h2>
        <div className="bg-tactical-orange/5 border border-tactical-orange/20 rounded-xl p-4 not-prose">
          <p className="text-sm font-bold text-tactical-orange mb-2">⚠️ Ketentuan Khusus untuk Pengguna di Bawah 13 Tahun</p>
          <ul className="text-sm text-muted-blue/70 space-y-2 list-disc pl-4">
            <li>Anak di bawah 13 tahun <strong>wajib</strong> mendaftar dengan persetujuan dan pengawasan orang tua/wali.</li>
            <li>Kami <strong>tidak</strong> mengumpulkan data pribadi anak secara langsung tanpa verifiable parental consent.</li>
            <li>Orang tua/wali berhak meninjau, mengoreksi, atau menghapus data anak mereka kapan saja.</li>
            <li>Data anak <strong>tidak</strong> digunakan untuk iklan bertarget atau dijual ke pihak ketiga.</li>
            <li>Fitur AI chat untuk pengguna di bawah 13 tahun dibatasi pada konteks akademis saja.</li>
          </ul>
        </div>

        <h3>3.1 Prinsip FERPA (Family Educational Rights and Privacy Act)</h3>
        <ul>
          <li><strong>Hak Akses:</strong> Orang tua/wali dan siswa (≥18 tahun) berhak mengakses seluruh catatan pendidikan mereka.</li>
          <li><strong>Hak Koreksi:</strong> Permintaan koreksi data yang tidak akurat akan diproses dalam 14 hari kerja.</li>
          <li><strong>Pembatasan Disclosure:</strong> Data pendidikan tidak dibagikan ke pihak ketiga tanpa persetujuan tertulis, kecuali diwajibkan hukum.</li>
          <li><strong>Data Minimum:</strong> Kami hanya mengumpulkan data yang diperlukan untuk fungsi pendidikan (prinsip data minimization).</li>
        </ul>

        <h3>3.2 Hak Orang Tua/Wali</h3>
        <ul>
          <li>Meninjau data pribadi dan catatan belajar anak.</li>
          <li>Meminta penghapusan akun dan seluruh data anak.</li>
          <li>Menonaktifkan fitur tertentu (AI chat, voice input).</li>
          <li>Menerima notifikasi jika ada perubahan kebijakan yang mempengaruhi data anak.</li>
        </ul>

        <h2>4. Penyimpanan & Keamanan Data</h2>
        <ul>
          <li><strong>Lokasi Server:</strong> Data disimpan di NeonDB (region Asia Tenggara) dan Vercel (Edge global).</li>
          <li><strong>Enkripsi:</strong> Data in-transit dilindungi TLS 1.3. Password di-hash dengan bcrypt (cost factor 12).</li>
          <li><strong>Session:</strong> Menggunakan JWT httpOnly cookie dengan expiry 7 hari.</li>
          <li><strong>Akses Internal:</strong> Hanya personel yang berwenang yang dapat mengakses database produksi.</li>
          <li><strong>Retensi:</strong> Data akun aktif disimpan selama akun aktif. Data akun yang dihapus akan dihapus permanen dalam 30 hari.</li>
        </ul>

        <h2>5. Berbagi Data dengan Pihak Ketiga</h2>
        <table>
          <thead>
            <tr><th>Pihak Ketiga</th><th>Data yang Dibagikan</th><th>Tujuan</th></tr>
          </thead>
          <tbody>
            <tr><td>Google (Gemini API)</td><td>Teks pertanyaan siswa (tanpa identitas)</td><td>Pemrosesan AI tutor</td></tr>
            <tr><td>Xendit</td><td>Email, nama (untuk invoice)</td><td>Pemrosesan pembayaran</td></tr>
            <tr><td>Vercel</td><td>Log teknis (IP, user-agent)</td><td>Hosting & CDN</td></tr>
            <tr><td>NeonDB</td><td>Seluruh data aplikasi</td><td>Database hosting</td></tr>
          </tbody>
        </table>
        <p>Kami <strong>TIDAK</strong> menjual data pribadi kepada pihak ketiga untuk tujuan iklan atau pemasaran.</p>

        <h2>6. Hak Pengguna (UU PDP Indonesia)</h2>
        <ul>
          <li><strong>Hak Akses:</strong> Meminta salinan data pribadi Anda.</li>
          <li><strong>Hak Koreksi:</strong> Memperbarui data yang tidak akurat.</li>
          <li><strong>Hak Hapus:</strong> Meminta penghapusan akun dan seluruh data (right to be forgotten).</li>
          <li><strong>Hak Portabilitas:</strong> Meminta ekspor data dalam format yang dapat dibaca mesin.</li>
          <li><strong>Hak Keberatan:</strong> Menolak pemrosesan data untuk tujuan tertentu.</li>
        </ul>
        <p>Untuk menggunakan hak-hak di atas, hubungi: <strong>privacy@bikan.co.id</strong></p>

        <h2>7. Cookie & Penyimpanan Lokal</h2>
        <ul>
          <li><strong>Session Cookie (httpOnly):</strong> Untuk autentikasi. Wajib untuk fungsi platform.</li>
          <li><strong>localStorage:</strong> Preferensi tema, posisi video terakhir, data offline queue. Tidak dikirim ke server.</li>
          <li><strong>Service Worker Cache:</strong> Aset statis untuk akses offline. Tidak mengandung data pribadi.</li>
        </ul>

        <h2>8. Perubahan Kebijakan</h2>
        <p>Perubahan material akan diberitahukan via email minimal 14 hari sebelum berlaku. Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai persetujuan.</p>

        <h2>9. Kontak</h2>
        <ul>
          <li><strong>Data Protection Officer:</strong> privacy@bikan.co.id</li>
          <li><strong>Alamat:</strong> KMP BIKAN, Jakarta, Indonesia</li>
          <li><strong>Respons:</strong> Permintaan terkait data pribadi akan direspons dalam 14 hari kerja.</li>
        </ul>

        <hr />
        <p className="text-xs text-muted-blue/40">
          Kebijakan ini disusun sesuai UU No. 27 Tahun 2022 (PDP), dengan mengadopsi prinsip COPPA (Children&apos;s Online Privacy Protection Act) dan FERPA (Family Educational Rights and Privacy Act) untuk standar perlindungan data anak internasional.
        </p>
      </div>
    </div>
  );
}
