/**
 * BIKAN Terms of Service
 */

import Link from 'next/link';

export const metadata = {
  title: 'Syarat & Ketentuan - BIKAN LMS',
  description: 'Syarat dan ketentuan penggunaan platform BIKAN LMS',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-base py-12 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <Link href="/" className="text-tactical-orange text-xs font-bold no-underline">← Kembali</Link>

        <h1 className="text-2xl font-black mt-6">Syarat & Ketentuan Layanan</h1>
        <p className="text-muted-blue/50 text-sm">KMP BIKAN — Terakhir diperbarui: 15 Mei 2026</p>

        <hr />

        <h2>1. Definisi</h2>
        <ul>
          <li><strong>"Platform"</strong> merujuk pada aplikasi web BIKAN LMS yang dikelola oleh Koperasi Multi-Pihak BIKAN.</li>
          <li><strong>"Pengguna"</strong> merujuk pada setiap individu yang mendaftar dan menggunakan Platform.</li>
          <li><strong>"Konten"</strong> merujuk pada materi video, soal, dan materi pembelajaran yang tersedia di Platform.</li>
          <li><strong>"Layanan AI"</strong> merujuk pada fitur Socratic Assistant dan otomatisasi berbasis kecerdasan buatan.</li>
        </ul>

        <h2>2. Penerimaan Syarat</h2>
        <p>Dengan mendaftar dan menggunakan Platform, Anda menyetujui seluruh syarat dan ketentuan ini. Jika Anda berusia di bawah 18 tahun, Anda memerlukan persetujuan orang tua atau wali sah.</p>

        <h2>3. Akun Pengguna</h2>
        <ul>
          <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.</li>
          <li>Satu akun hanya boleh digunakan oleh satu individu.</li>
          <li>Kami berhak menangguhkan akun yang melanggar ketentuan ini.</li>
        </ul>

        <h2>4. Penggunaan Platform</h2>
        <p>Pengguna dilarang:</p>
        <ul>
          <li>Menyalin, mendistribusikan, atau menjual kembali Konten tanpa izin tertulis.</li>
          <li>Menggunakan bot, scraper, atau alat otomatis untuk mengakses Platform.</li>
          <li>Melakukan kecurangan akademis termasuk berbagi jawaban assessment.</li>
          <li>Mengunggah konten yang melanggar hukum, mengandung SARA, atau pornografi.</li>
          <li>Mencoba mengakses sistem, database, atau infrastruktur tanpa otorisasi.</li>
        </ul>

        <h2>5. Layanan AI (Socratic Assistant)</h2>
        <ul>
          <li>Layanan AI bersifat alat bantu belajar, bukan pengganti pengajar profesional.</li>
          <li>Respons AI dapat mengandung ketidakakuratan. Pengguna bertanggung jawab memverifikasi informasi.</li>
          <li>Interaksi dengan AI dicatat untuk peningkatan kualitas layanan (lihat Kebijakan Privasi).</li>
          <li>AI tidak akan memberikan jawaban langsung — hanya pertanyaan penuntun sesuai metode Sokratik.</li>
        </ul>

        <h2>6. Pembayaran & Langganan</h2>
        <ul>
          <li>Harga langganan tercantum di halaman Pricing dan dapat berubah dengan pemberitahuan 30 hari.</li>
          <li>Pembayaran diproses melalui Xendit. BIKAN tidak menyimpan data kartu kredit/debit.</li>
          <li>Pengembalian dana (refund) tersedia dalam 7 hari pertama setelah pembayaran jika belum mengakses lebih dari 20% konten.</li>
          <li>Free trial 7 hari hanya tersedia sekali per pengguna.</li>
        </ul>

        <h2>7. Hak Kekayaan Intelektual</h2>
        <ul>
          <li>Seluruh Konten, desain, kode, dan merek dagang adalah milik KMP BIKAN.</li>
          <li>Sertifikat digital yang diterbitkan adalah milik penerima tetapi format dan desainnya milik BIKAN.</li>
          <li>Instruktur mempertahankan hak moral atas konten yang mereka buat, dengan lisensi non-eksklusif kepada Platform.</li>
        </ul>

        <h2>8. Batasan Tanggung Jawab</h2>
        <p>Platform disediakan "sebagaimana adanya" (as-is). BIKAN tidak menjamin:</p>
        <ul>
          <li>Ketersediaan layanan 100% tanpa gangguan.</li>
          <li>Hasil akademis tertentu dari penggunaan Platform.</li>
          <li>Keakuratan 100% dari respons AI.</li>
        </ul>

        <h2>9. Penghentian Layanan</h2>
        <p>BIKAN berhak menghentikan akses Pengguna yang melanggar ketentuan ini. Pengguna dapat menghapus akun kapan saja melalui pengaturan profil.</p>

        <h2>10. Hukum yang Berlaku</h2>
        <p>Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan melalui musyawarah, dan jika tidak tercapai, melalui Pengadilan Negeri Jakarta Selatan.</p>

        <h2>11. Perubahan Ketentuan</h2>
        <p>BIKAN dapat memperbarui ketentuan ini. Perubahan material akan diberitahukan melalui email atau notifikasi dalam aplikasi minimal 14 hari sebelum berlaku.</p>

        <hr />
        <p className="text-xs text-muted-blue/40">
          Kontak: legal@bikan.co.id | KMP BIKAN, Permenkop No. 8 Tahun 2021
        </p>
      </div>
    </div>
  );
}
