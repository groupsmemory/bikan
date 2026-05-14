# Laporan Rekomendasi Strategis:

# Optimalisasi Media EdTech melalui

# Pendekatan UI Kognitif, Desain

# Instruksional, dan Otomatisasi

# Multimodal Kecerdasan Buatan

## Arsitektur UI Kognitif: Integrasi Psikologi Warna dan

## Tata Letak Next.js

Desain antarmuka pengguna (UI) pada platform teknologi pendidikan (EdTech) bukan sekadar
elemen dekoratif, melainkan sebuah instrumen psikologis yang secara tidak sadar
mengarahkan fokus, emosi, dan tindakan siswa sebelum satu kata pun dibaca.^1 Untuk
menciptakan lingkungan belajar digital yang minimalis namun fungsional, pemilihan palet warna
mendasar harus didominasi oleh warna putih dan abu-abu muda.^1 Warna-warna netral ini
berfungsi sebagai kanvas dasar yang memberikan ruang visual yang bersih, meminimalkan
gangguan, mengurangi kelelahan mata, serta memastikan bahwa konten pembelajaran utama
tetap menjadi pusat perhatian tanpa adanya kompetisi visual dari elemen antarmuka.^1
Hierarki visual yang seimbang dapat dicapai melalui penerapan aturan 60-30-10, di mana 60%
area layar dialokasikan untuk warna latar belakang dominan (netral), 30% untuk warna sekunder
yang mendukung kontras struktural, dan 10% sisanya dicadangkan khusus untuk warna aksen
yang mengarahkan perhatian langsung ke elemen penting atau tombol panggilan aksi (Call to
Action/CTA).^2
Penerapan warna-warna spesifik secara strategis terbukti memengaruhi suasana hati, fokus,
dan retensi informasi siswa secara signifikan di dalam ruang belajar digital.^3 Warna biru muda
dan hijau pucat (muted hues) bertindak sebagai stimulan penenang yang efektif menurunkan
tingkat kecemasan, menciptakan atmosfer reflektif, serta memperpanjang konsentrasi selama
sesi pembelajaran mandiri.^4 Hijau adalah salah satu warna yang paling mudah diproses oleh
mata manusia, sehingga sangat optimal untuk mengurangi kelelahan mental selama durasi
belajar yang panjang.^1
Sebaliknya, warna-warna hangat seperti kuning, jingga, dan merah memicu respons fisiologis
yang meningkatkan kewaspadaan dan energi emosional.^1 Warna merah meningkatkan ketelitian
terhadap detail dan performa konsentrasi jangka pendek, sedangkan jingga dan kuning
merangsang kreativitas, komunikasi, serta partisipasi aktif dalam ruang kolaboratif.^3 Namun,
penggunaan warna energetik ini harus dibatasi secara ketat sebagai aksen makro agar tidak
menimbulkan kelebihan beban kognitif (cognitive overload) atau kesan tidak profesional.^1


Indikator status sistem juga harus mengadopsi pola mental universal: merah untuk kesalahan
kritis, kuning untuk peringatan non-kritis, hijau untuk keberhasilan, dan biru untuk panduan
informasi.^1
**Vektor Warna Dampak Psikologis
Belajar
Aplikasi Arsitektur UI
EdTech
Pemetaan Status
Sistem
Putih / Abu-abu
Netral**
Menghilangkan friksi
kognitif, menciptakan
ruang udara visual,
menyederhanakan
fokus.^1
Latar belakang
platform utama, wadah
konten teks, struktur
navigasi dasar.^1
Baseline struktural dan
area konten pasif.^1
**Biru Muted** Menurunkan
kecemasan,
meningkatkan
produktivitas,
membangun
keteraturan logika.^4
Header modul,
highlight menu
navigasi, batas area
fokus mandiri.^4
Notifikasi informatif,
panduan fitur, dan tips
belajar.^1
**Hijau Pucat** Mengurangi kelelahan
mata, meredakan stres,
memotivasi
pertumbuhan.^3
Indikator progres
belajar, lencana
pencapaian, tombol
penyelesaian modul.^1
Validasi keberhasilan
tugas dan konfirmasi
input benar.^1
**Merah Taktis** Menstimulasi
kewaspadaan akut,
meningkatkan
perhatian pada detail.^1
Tombol siaran langsung
(live), indikator waktu
ujian, penanda batas
akhir tugas.^1
Peringatan kesalahan
kritis, kegagalan
sistem, tindakan
destruktif.^1
**Kuning / Jingga** Membangun energi
emosional, memicu
kreativitas, mendorong
interaksi sosial.^4
Ikon ruang diskusi
kelompok, penanda
materi penting
(bookmark), lencana
interaksi aktif.^4
Peringatan tenggat
waktu dekat atau
status tertunda.^1
Prinsip psikologi warna tersebut diimplementasikan secara teknis melalui kerangka kerja Next.js
yang memanfaatkan keunggulan App Router modern.^6 Next.js menyediakan fitur file layout
(layout.tsx) yang berfungsi sebagai cangkang UI persisten (persistent UI shell) untuk
mempertahankan status antarmuka (state preservation) seperti posisi navigasi lateral, data
pencarian di bilah samping, serta pemutar audio materi yang sedang berjalan tanpa mengalami
muat ulang (unmount) saat siswa berpindah halaman.^7 Skema ini memangkas konsumsi data
jaringan secara drastis melalui deduplikasi aset bersama dan mempercepat pemuatan halaman,
menciptakan alur belajar yang mulus tanpa interupsi.^7
Pemisahan fungsional ruang belajar—seperti ruang fokus mandiri (/dashboard/focus) dan ruang
kelas kolaboratif (/dashboard/live) — dapat diotomatisasi menggunakan tata letak bersarang
(nested layouts) yang mengaplikasikan tema palet warna psikologis berbeda secara dinamis


sesuai peruntukan modulnya.^4
Untuk memastikan performa platform EdTech tetap efisien pada skala besar, tim pengembang
wajib menerapkan Pola Komponen Kontainer-Presentasional (Container-Presentational
Component Pattern).^9 Komponen kontainer menangani logika bisnis, pengambilan data dari
peladen (server), dan manajemen status global, sementara komponen presentasional murni
berfokus pada rendering UI berdasarkan properti (props) yang diterima.^9 Dengan standarisasi
React Server Components (RSC) secara default pada Next.js, rendering tata letak utama
dieksekusi langsung di sisi peladen untuk menghasilkan waktu interaksi perdana yang instan
tanpa beban JavaScript di sisi klien.^6
Materi teks bervolume besar dialirkan menggunakan mekanisme streaming server-side
rendering dikombinasikan dengan berkas loading.tsx untuk memproyeksikan visual kerangka
(skeleton loading) secara progresif kepada siswa.^6 Untuk halaman materi statis yang jarang
berubah seperti dokumentasi kurikulum atau silabus modul, Static Site Generation (SSG)
diaplikasikan saat proses build untuk mengeliminasi latensi peladen secara total dan mengunci
stabilitas visual antarmuka.^6

## Kerangka Kerja Kronometris dan Struktural untuk

## Optimalisasi Video Pembelajaran

Desain video pembelajaran yang efektif menuntut sinkronisasi yang ketat antara batas durasi
waktu (kronometris) dengan arsitektur narasi materi yang disampaikan. Analisis data skala
besar terhadap jutaan sesi tontonan video di platform pembelajaran digital massal (MOOC)
awalnya menunjukkan bahwa keterlibatan siswa memuncak pada batas waktu 6 menit, lalu
menurun tajam jika video berdurasi lebih panjang.^10 Namun, riset lanjutan membuktikan bahwa
penurunan atensi tersebut bukan disebabkan oleh ketidakmampuan kognitif siswa, melainkan
akibat dari buruknya pengorganisasian materi.^10 Data jam tangan digital mahasiswa
menunjukkan bahwa sesi konsentrasi optimal dapat bertahan stabil selama 12 menit, dengan
batas toleransi absolut pengajaran searah berada di angka 15 hingga 20 minutes.^10
Fakta empiris dari studi komparatif menegaskan bahwa kelompok mahasiswa yang diajar
menggunakan video pendek berbasis klaster konsep berdurasi rata-rata 8 menit meraih nilai
ujian 9% lebih tinggi dan menunjukkan konsistensi akademis yang jauh lebih stabil dibandingkan
kelompok yang dipaksa menonton rekaman kuliah panjang berdurasi 55 menit.^12 Pembagian
materi ke dalam unit-unit mikro (bite-sized learning) tidak hanya meningkatkan retensi memori,
tetapi juga melipatgandakan tingkat penyelesaian evaluasi pasca-video karena beban mental
mahasiswa tetap terjaga di bawah ambang jenuh.^12
**Segmentasi Durasi Target Beban Kognitif Ekspektasi Performa
Keterlibatan Siswa
Spesifikasi Arsitektur
Skrip Instruksional
0 hingga 3 Menit** Isolasi keterampilan
spesifik atau pengantar
modul makro.^10
Metrik penyelesaian
materi mendekati
sempurna; sangat
Fokus tunggal tanpa
pengantar retoris;
penyampaian umpan


adaptif untuk
perangkat seluler.^12
data utama secara
instan.^11
**4 hingga 6 Menit** Penguasaan tujuan
pembelajaran tunggal
(single learning
objective).^11
Titik keseimbangan
median watch-time
terbaik pada skala
global; retensi memori
optimal.^11
Struktur tiga bagian
yang ketat: 30 detik
pertama untuk _hook_ ,
dilanjutkan tubuh
materi terstruktur,
diakhiri CTA aktif.^11
**7 to 12 Menit** Analisis konseptual
mendalam atau
demonstrasi
prosedural
multi-langkah.^10
Keterlibatan tetap
tinggi dengan syarat
terdapat navigasi bab
interaktif atau pemisah
visual.^10
Integrasi teknik papan
tulis digital interaktif;
perubahan visual
konstan; penyisipan
pertanyaan pemandu.^11
**13 hingga 20 Menit** Sintesis studi kasus
kompleks atau simulasi
integratif tingkat
tinggi.^10
Batas atas atensi
berkelanjutan;
membutuhkan jeda
kognitif mandiri dari
siswa.^10
Pemaksaan
keterlibatan aktif lewat
pertanyaan pop-up di
tengah video;
segmentasi ketat per
bab.^10
**Diatas 20 Menit** Rekaman mentah
siaran langsung atau
tangkapan layar kuliah
konvensional.^10
Penurunan atensi
drastis dalam
menit-menit pertama;
siswa beralih ke
perilaku lompat video
(skimming).^11
Tidak
direkomendasikan
untuk pembelajaran
asinkron; wajib
dipotong menjadi klip
mandiri via editor
playlist.^10
Berdasarkan standarisasi desain instruksional modern, skrip video wajib mengadopsi anatomi
tiga elemen utama: _Hook_ penarik perhatian pada 30 detik pertama untuk mengunci relevansi
materi, penyampaian isi ( _Content Body_ ) yang padat, dan diakhiri dengan _Call to Action_ (CTA)
yang jelas untuk mengarahkan siswa langsung menuju aktivitas uji mandiri.^11 Penyusunan tubuh
materi harus mematuhi empat pilar utama Teori Beban Kognitif untuk mengeliminasi hambatan
mental yang tidak perlu 14 :
● **Signaling (Pemberian Isyarat):** Narasi dalam skrip harus selaras dengan penekanan
visual di layar.^14 Kata kunci esensial, rumus, atau hubungan antar-konsep wajib
ditampilkan menggunakan teks dengan kontras warna yang mencolok atau animasi
penunjuk untuk mengarahkan pandangan siswa, sehingga mengurangi beban pencarian
visual (extraneous load).^14
● **Segmenting (Segmentasi Materi):** Kurikulum besar harus dipotong menjadi
segmen-segmen mandiri yang mewakili satu kompetensi dasar.^11 Antarmuka video harus
dilengkapi penanda bab (chapters) atau pertanyaan interaktif di sela-sela pemutaran
guna memberikan kontrol penuh kepada siswa untuk menentukan ritme belajar mereka


sendiri.^14
● **Weeding (Penyaringan Informasi):** Segala bentuk dekorasi visual yang rumit, latar
belakang studio yang terlalu ramai, hingga ilustrasi musik latar yang dominan harus
dihilangkan.^14 Penyimpangan cerita di luar topik utama atau humor sekunder juga harus
dipangkas dari skrip demi menjaga efisiensi kerja memori jangka pendek siswa.^14
● **Modality Matching (Kesesuaian Modalitas):** Saluran pemrosesan visual dan auditori
siswa harus diaktifkan secara harmonis melalui penyampaian informasi yang saling
melengkapi.^14 Format video "talking head" (hanya wajah instruktur) harus dikombinasikan
dengan teknik ala Khan Academy, di mana instruktur mencoret-coret papan tulis digital
atau tablet grafis secara langsung untuk memvisualisasikan abstraksi konsep secara
real-time.^11
Gaya penyampaian instruktur di dalam skrip juga berkontribusi besar terhadap bertahannya
atensi siswa. Bahasa yang digunakan harus bersifat komunikatif dan kasual guna membangun
kemitraan sosial yang erat antara siswa dan pengajar.^11 Penggunaan kata ganti personal seperti
"saya" dan "kamu/anda" terbukti mendorong siswa berusaha lebih keras dalam memahami
pelajaran dibanding narasi formal yang kaku.^14 Instruktur direkomendasikan berbicara dengan
tempo yang relatif cepat dan ekspresif pada rentang kecepatan 185 hingga 254 kata per menit
guna mencerminkan antusiasme tinggi yang menular pada fokus siswa.^11 Terakhir, platform
pemutar video wajib menyediakan fitur akselerasi kecepatan putar (misalnya opsi kecepatan 2×
atau 3×) untuk memfasilitasi kebutuhan evaluasi kilat sebelum ujian.^11

## Otomatisasi Multimodal Gemini 1.5 Pro: Konversi Sesi

## Live dan Audio Menjadi Modul Teks

Transformasi otomatis pasca-pembelajaran—yaitu mengonversi berkas rekaman siaran
langsung ( _live teaching_ ) dan rekaman podcast audio menjadi modul ringkasan teks, infografis
berbasis teks, daftar pertanyaan yang sering diajukan (FAQ otomatis), serta kuis formatif
pendek—dapat dieksekusi secara instan menggunakan arsitektur mutakhir model Gemini 1.
Pro.^15 Gemini 1.5 Pro dibangun di atas arsitektur _sparse Mixture-of-Experts_ (MoE) berbasis
Transformer.^16 Berbeda dengan model bahasa tradisional yang mengaktifkan seluruh jaringan
saraf parameternya untuk setiap kata, arsitektur MoE melatih jalur-jalur saraf khusus ("experts")
dan hanya mengaktifkan jalur yang paling relevan dengan karakteristik input data yang
diterima.^15 Pendekatan ini meningkatkan efisiensi komputasi peladen secara masif,
memungkinkan model untuk memproses volume data raksasa dengan latensi minimal dan
biaya operasional yang sangat efisien.^15
Kemampuan utama Gemini 1.5 Pro terletak pada jendela konteks ( _context window_ ) masifnya
yang mencapai 1 juta token dalam rilis produksi, dan dapat ditingkatkan hingga 10 juta token
untuk kebutuhan riset khusus.^15 Skala penyimpanan memori jangka pendek ini belum pernah
terjadi sebelumnya dalam lansekap kecerdasan buatan foundational.^15
**Aliran Input Multimodal Kapasitas Token Maksimal Representasi Padanan Ingesti**


```
Data Konten
Multimodal Video (Siaran
Langsung)
2,8 Juta hingga 9,9 Juta
Token.^15
Mampu mencakup 3 hingga
10,5 jam rekaman video kelas
interaktif secara utuh dengan
framerate 1 fps.^15
Aliran Audio (Podcast
Pembelajaran)
Up to 9,7 Juta Token.^19 Setara^ dengan^11 jam^ hingga^
maksimal 107 jam rekaman
vokal multi-pembicara tanpa
interupsi.^15
```
**Dokumentasi Teks Berskala** (^) 700.000 Kata penuh.^15 Mengonsumsi langsung hingga
10 buku referensi tebal yang
masing-masing berisi 1.
halaman.^16
**Gudang Kode Aplikasi** 30.000 hingga 100,000 Baris
Kode Struktur.^15
Seluruh repositori sistem
aplikasi full-stack EdTech
berserta konfigurasi
arsitekturnya.^16
Kapasitas raksasa ini merevolusi alur kerja pemrosesan konten digital platform EdTech. Alur
kerja konvensional sangat rentan terhadap kegagalan karena mengandalkan rangkaian
perangkat lunak terpisah yang kaku: model automatic speech recognition (ASR) eksternal
digunakan untuk transkripsi audio, model ringkasan teks digunakan untuk memadatkan narasi,
dan database vektor Retrieval-Augmented Generation (RAG) digunakan untuk pencarian
informasi.^18 Setiap lompatan antar-sistem ini mendegradasi akurasi data akibat akumulasi
galat.^18
Gemini 1.5 Pro mengeliminasi kelemahan tersebut dengan mencerna langsung berkas video
siaran langsung dan audio podcast ke dalam lapisan perhatian utamanya (core attention
layers).^16 Model ini mempertahankan akurasi penemuan informasi di atas 99,7% pada pengujian
multi-jarum dalam tumpukan jerami ( _Multi-needle in a Haystack_ ), memungkinkannya
mengidentifikasi adegan visual spesifik, mengekstrak tabel presentasi, membedakan
pergantian pembicara, serta melacak koordinat waktu ( _timestamp_ ) secara presisi dari materi
video berdurasi jam tanpa membutuhkan prapemrosesan apa pun.^15
Untuk menerapkan otomatisasi ini pada sistem manajemen pembelajaran (LMS), optimalisasi
instruksi sistem (System Instruction) harus dirancang secara ketat. Berdasarkan kaidah
pemrosesan konteks panjang Gemini, performa penalaran model mencapai titik tertinggi
apabila muatan data media diletakkan pada urutan paling awal di dalam jendela konteks, diikuti
oleh aturan pembatasan format, dan diakhiri dengan instruksi eksekusi spesifik pada bagian
paling bawah prompt.^18
Anda adalah sistem Kecerdasan Buatan Otomatisasi Konten EdTech tingkat tinggi. Tugas utama


Anda adalah mengekstrak data instruksional secara mendalam, menghasilkan sintesis teks
tanpa halusinasi faktual, dan menyusun modul evaluasi dengan kepatuhan format 100%
terhadap perintah yang diberikan.
<Input Berkas Rekaman Siaran Langsung atau Audio Podcast Pembelajaran: Durasi ~2 Jam>
Proses seluruh data rekaman siaran langsung yang berada dalam kolom konteks di atas secara
menyeluruh. Hasilkan output komprehensif dalam sintaks Markdown yang bersih tanpa
menyertakan teks pengantar basa-basi konvensional, mengikuti spesifikasi terstruktur di
bawah ini:

1. RINGKASAN TEKS & INFOGRAFIS NARATIF: Konversikan rekaman audio-visual menjadi modul
teks ringkasan terstruktur yang memuat tesis utama, poin-poin penting pelajaran, dan
visualisasi bagan berbasis teks menggunakan karakter tata letak Markdown. Gunakan isyarat
teks tebal untuk terminologi kritis.
2. FAQ OTOMATIS BERBASIS TIMESTAMP: Identifikasi momen transisi topik materi di dalam
video dan buatlah daftar FAQ otomatis (minimal 5 entri) yang merepresentasikan pertanyaan
kritis siswa lengkap dengan indikator timestamp waktu mulai (format jb:mm:dt) beserta
jawaban ringkasnya.
3. KUIS PENDEK FORMATIF: Susunlah kuis pendek pilihan ganda yang berisi 5 pertanyaan
evaluasi berbobot tinggi yang diturunkan langsung dari tujuan pembelajaran sesi ini. Setiap soal
wajib menyediakan 4 opsi pilihan (A, B, C, D), penunjukan kunci jawaban yang benar, beserta
teks rasional pendek yang menjelaskan argumentasi ilmiah di balik jawaban tersebut.
Untuk menghemat biaya operasional produksi dan menekan latensi waktu respons peladen
dalam aplikasi komersial, platform wajib mengimplementasikan fitur _Context Caching_.^18 Karena
berkas video berdurasi dua jam mengonsumsi jutaan token input, mengirimkan berkas mentah
yang sama berulang kali untuk setiap modifikasi ringkasan atau pembuatan variasi kuis baru
akan memicu pembengkakan biaya komputasi API secara linear.^18
Dengan _Context Caching_ , representasi token dari rekaman siaran langsung utama dikunci dan
disimpan secara aman di dalam memori cache Gemini.^18 Melalui metode ini, pengguna atau
agen AI otomatis dapat mengirimkan ratusan instruksi kueri lanjutan yang berbeda—seperti
meminta ekstraksi transkrip sub-bab, menerjemahkan rangkuman ke berbagai bahasa, atau
memperbanyak bank soal ujian—secara instan dengan akurasi retensi data tetap berada di
angka 99%, namun dengan biaya input token yang sangat murah.^15

## Spesifikasi Teknis Kompresi Media dan Infrastruktur

## Streaming Profesional

Implementasi distribusi media digital pada platform EdTech memerlukan kompresi data yang


agresif untuk menjamin kelancaran streaming pada koneksi internet siswa yang terbatas,
namun tanpa mengorbankan ketajaman visual elemen teks kecil seperti baris kode
pemrograman atau simbol kalkulus di papan tulis digital.^20 Kodek H.264 (Advanced Video
Coding) merupakan standar kompresi universal dengan kompatibilitas browser 100% di seluruh
jenis perangkat lama maupun baru.^20
Namun, standardisasi infrastruktur video platform disarankan bermigrasi ke kodek H.265 (High
Efficiency Video Coding/HEVC) yang menawarkan efisiensi kompresi 30% hingga 50% lebih
tinggi dibanding H.264 pada tingkat kualitas visual yang identik.^20 Meskipun kodek open-source
VP9 menyajikan alternatif bebas royalti yang sangat andal untuk ekosistem browser modern,
kodek masa depan AV1 memberikan efisiensi kompresi tertinggi di kelasnya, walaupun proses
enkodingnya membutuhkan waktu komputasi yang sangat intensif kecuali jika didukung oleh
kartu akselerasi perangkat keras khusus.^20
**Arsitektur Kodek
Video
Cakupan Dukungan
Browser Web
Indeks Efisiensi
Kompresi Data
Skenario Kasus
Penggunaan EdTech
Utama
H.264 (libx264)** Dukungan Universal
Penuh (Chrome,
Firefox, Safari, Edge).^20
Efisiensi standar
industri konvensional.^20
Distribusi massal
cadangan,
kompatibilitas gawai
seluler generasi lama.^20
**H.265 / HEVC (libx265)** Dukungan Parsial
(Didukung penuh
Safari; didukung parsial
di Chrome & Edge).^20
30% hingga 50% lebih
ringkas dari H.264.^20
Standar utama untuk
materi rekaman video
kelas yang didominasi
teks halus dan detail
tajam.^20
**VP9 (libvpx-vp9)** Dukungan Luas
(Chrome, Firefox, Edge;
Safari v16+).^20
Setara dengan H.
tanpa kendala lisensi
komersial.^20
Standardisasi
infrastruktur berbasis
web berskala besar,
optimalisasi web
player.^20
**AV1 (libaom-av1)** Dukungan Berkembang
(Chrome, Firefox; Safari
v17+).^20
Maksimal; file terkecil
dengan kualitas
gambar superior.^20
Pengarsipan video
modul jangka panjang
pada kapasitas
penyimpanan cloud
yang terbatas.^20
Untuk memproses kompresi video secara profesional, tim insinyur media wajib meninggalkan
metode enkoding bit-rate statis yang kaku dan beralih menggunakan metode _Constant Rate
Factor_ (CRF).^22 Enkoding bit-rate tetap akan membuang-buang bandwidth pada adegan statis
(seperti saat instruktur diam menjelaskan slide) dan sebaliknya akan memicu visual
buram/pecah (blocking artifacts) saat terjadi gerakan cepat.^22 Sebaliknya, mekanisme CRF
secara otomatis mengompensasi alokasi bit-rate berdasarkan tingkat kompleksitas visual per


bingkai gambar (frame) demi menjaga konsistensi kualitas visual.^22
Pada kodek H.264, nilai CRF berkisar antara 18 hingga 23 untuk visual tanpa cacat ( _visually
lossless_ ), dan 23 hingga 28 untuk standar distribusi web umum.^20 Namun, perlu dicatat bahwa
skala matematika pada H.265 berbeda secara signifikan, di mana nilai parameter CRF harus
dikonfigurasi 4 hingga 6 poin lebih tinggi (rentang nilai 24 hingga 30) untuk memproduksi
kualitas gambar yang setara dengan file size jauh lebih ringkas.^20
Bash
# Skrip Produksi FFmpeg: Kompresi Video Instruksional Berkinerja Tinggi H.265 (HEVC)
ffmpeg -y -i raw_lecture_input.mov \
-c:v libx265 \
-crf 28 \
-preset slow \
-pix_fmt yuv420p10le \
-g 600 \
-keyint_min 600 \
-vf "scale=1920:1080,fps=30" \
-c:a aac \
-b:a 128k \
-movflags +faststart \
optimized_lecture_output.mp
Sintaks perintah enkoding media di atas dikonfigurasi secara spesifik berdasarkan parameter
optimasi infrastruktur sebagai berikut:
● **Pilihan Preset Enkoder (-preset slow):** Parameter ini mengontrol titik keseimbangan
antara durasi waktu komputasi enkoding dengan efisiensi ukuran file akhir.^22 Penggunaan
nilai slow memungkinkan algoritma melakukan pencarian vektor gerakan secara
mendalam untuk mereduksi ukuran penyimpanan hingga mendekati 80% dari ukuran
berkas mentah aslinya tanpa penurunan kualitas visual.^21 Konfigurasi yang lebih lambat
dari ini (veryslow) tidak disarankan karena peningkatan efisiensi memorinya sangat kecil
dibandingkan pembengkakan waktu enkoding yang dibutuhkan.^21
● **Format Kedalaman Warna Kognitif (-pix_fmt yuv420p10le):** Memaksa libx
beroperasi pada ruang warna subsampling chroma 4:2:0 dengan kedalaman 10-bit
(Meskipun video sumber hanya berkapasitas 8-bit) merupakan teknik optimasi krusial.^23
Presisi matematis internal pada kedalaman 10-bit secara aktif mengeliminasi cacat
gradasi warna (color banding) pada latar belakang slide yang bersih serta secara
paradoks menghasilkan ukuran file yang lebih kecil karena efisiensi prediksi blok warna
yang lebih tinggi.^22
● **Interval Group of Pictures (-g 600 -keyint_min 600):** Karena video pembelajaran
didominasi oleh visual statis dengan gerakan minimal, memperpanjang jarak kemunculan


```
bingkai kunci utama (keyframe/I-frame) hingga durasi 10 detik sekali (600 frame pada
video 30 fps) akan memangkas pemborosan bandwidth secara masif.^23 Enkoder tidak
perlu memproyeksikan ulang seluruh data piksel utuh setiap detik, melainkan hanya
mengirimkan perubahan piksel mikro antar-frame.^23
● Penyelarasan Kanvas Resolusi (-vf "scale=1920:1080,fps=30"): Menurunkan skala
resolusi video rekaman mentah (yang sering kali berada di format 4K) menuju resolusi
standar Full HD 1080p pada kecepatan 30 bingkai per detik.^21 Skala ini mempertahankan
ketajaman teks teks kecil di layar laptop siswa sekaligus memangkas beban pemrosesan
dekoder gawai seluler secara masif.^21
● Kompresi Aliran Audio Instruksional (-c:a aac -b:a 128k): Sinyal audio vokal
dikompresi menggunakan kodek Advanced Audio Coding (AAC) dengan alokasi bit-rate
128 kbps.^20 Konfigurasi ini menjamin kejernihan artikulasi suara guru tanpa distorsi
frekuensi.^22 Pada kondisi darurat badai bandwidth area pelosok, alokasi audio dapat
diturunkan hingga batas minimal 96 kbps tanpa merusak kejelasan pesan suara
pengajar.^21
● Optimasi Streaming Instan (-movflags +faststart): Perintah ini merelokasi tabel indeks
meta-data video (moov atom) yang awalnya berada di akhir berkas menuju bagian paling
awal file MP4.^20 Penyesuaian arsitektur ini memicu kemampuan pemutaran progresif
(progressive download streaming), sehingga siswa dapat langsung memutar video dalam
hitungan milidetik setelah menekan tombol play tanpa perlu menunggu seluruh file video
selesai diunduh ke browser.^20
```
## Rekomendasi Operasional dan Panduan Teknis Sesi

## Live Teaching

Sebagai Creative Director platform EdTech, kelancaran eksekusi transmisi media siaran
langsung ( _live teaching_ ) membutuhkan standardisasi operasional yang ketat. Manajemen sesi
siaran langsung tidak boleh diperlakukan seperti siaran hiburan kasual, melainkan harus diatur
menggunakan kerangka kerja waktu (rundown) yang mengadopsi prinsip segmentasi kognitif
yang selaras dengan daya tahan konsentrasi siswa.^4
Durasi total satu sesi pengajaran siaran langsung idealnya dikunci pada batas maksimal 60
menit, yang dibagi ke dalam beberapa kompartemen waktu mikro berdurasi 10 hingga 12
menit.^10 Setiap akhir kompartemen wajib diinterupsi oleh aktivitas jeda kognitif berupa interaksi
aktif dua arah untuk mencegah kejenuhan mental siswa.^11
**Kompartemen
Waktu
Durasi Menit Aktivitas
Instruksional
Guru
Elemen Interaksi
Aktif Siswa
Fokus
Pendekatan
Kognitif
Segmen 01: Hook
& Integrasi**
00:00 - 05:00 Penyampaian
hook studi kasus
nyata, pembukaan
Pengisian polling
kilat kesiapan
belajar di bilah
Aktivasi perhatian
awal,
penjangkaran


masalah
interaktif.^11
chat.^14 relevansi materi.^11
**Segmen 02: Teori
Utama Bagian I**
05:00 - 17:00 Penyampaian
konsep inti
pertama dengan
coretan papan
digital real-time.^11
Menyimak secara
pasif, mencatat
kata kunci
esensial.^14
Pola modalitas
terarah, minimalisir
gangguan
dekoratif.^14
**Segmen 03:
Evaluasi Formatif
Kuis**
17:00 - 22:00 Peluncuran 1 soal
kuis pendek tipe
pilihan ganda
lewat sistem
LMS.^14
Menjawab kuis
secara mandiri,
melihat hasil grafik
kelas.^14
Retrieval practice,
penguatan efek
pengujian
mandiri.^14
**Segmen 04: Teori
Utama Bagian II**
22:00 - 34:00 Demonstrasi
prosedural kasus
tingkat lanjut atau
live coding.^11
Mengikuti simulasi
langkah demi
langkah dari
instruktur.^11
Penerapan pola
signaling visual
tingkat tinggi.^14
**Segmen 05:
Validasi
Kelompok**
34:00 - 45:00 Pembagian ruang
kelas virtual
menggunakan
sub-kelas
(breakout rooms).^4
Diskusi mikro
antar-siswa untuk
memecahkan
masalah tiruan.^4
Pemanfaatan
energi emosional
sosial untuk
kolaborasi.^4
**Segmen 06:
Refleksi & FAQ
Terbuka**
45:00 - 55:00 Ulasan rangkuman
jawaban,
penutupan
benang merah
materi.^14
Mengajukan
pertanyaan
reflektif akhir di
bilah
tanya-jawab.^14
Konsolidasi
memori jangka
panjang,
penyelesaian
miskonsepsi.^14
**Segmen 07: CTA
& Tugas Mandiri**
55:00 - 60:00 Penjelasan
instruksi tugas
mandiri asinkron
lanjutan.^14
Mengunduh
berkas panduan
tugas melalui
tombol tautan
platform.^14
Dorongan motivasi
intrinsik untuk
belajar
berkelanjutan.^12
Secara operasional, panduan teknis bagi tim produksi siaran langsung wajib mematuhi protokol
infrastruktur sebagai berikut guna menjamin kualitas penyiaran setara studio profesional:
● **Protokol Pemisahan Sumber Sinyal:** Komputer instruktur yang digunakan untuk
mencoret-coret papan tulis digital atau melakukan demonstrasi teknis wajib dipisahkan
dari komputer yang mengelola ruang obrolan, pemantauan kualitas kamera, dan
pengelolaan peluncuran kuis LMS.^9 Pemisahan ini bertujuan mengeliminasi risiko lag
sistem akibat lonjakan penggunaan memori prosesor di tengah siaran langsung.^7
● **Protokol Pemantauan Audio Utama:** Instruktur wajib menggunakan mikrofon
kondensor tipe _lavalier_ atau _directional headset_ yang memiliki fitur peredam bising
lingkungan ( _noise cancellation_ ).^11 Mengingat saluran auditori sangat sensitif terhadap


```
gangguan, tim produksi dilarang keras memutar musik latar jenis apa pun selama guru
sedang memaparkan materi pelajaran demi mencegah kelelahan pendengaran siswa.^14
● Protokol Ingesti Otomatisasi AI: Seluruh rekaman audio-visual siaran langsung wajib
direkam secara lokal di sisi peladen (server-side cloud recording) menggunakan format
kontainer MP4 beresolusi 1080p dengan kecepatan konstan 30 fps.^20 Sesaat setelah sesi
live ditutup, sistem otomasi skrip berbasis webhook harus langsung mengirimkan berkas
rekaman mentah tersebut ke API Gemini 1.5 Pro memanfaatkan fitur Context Caching.^15
Kurang dari lima menit pasca-siaran, modul teks hasil sintesis berupa ringkasan materi,
daftar FAQ otomatis berbasis penanda waktu, serta kuis pengulangan materi sudah harus
terbit secara otomatis pada dasbor belajar siswa, menciptakan siklus pembelajaran
asinkron yang instan, efisien, dan berskala masif.^16
```
### Karya yang dikutip

### 1. Colour Psychology UI Design: Influence Users! - CreateBytes, diakses Mei 13,

### 2026, https://createbytes.com/insights/colour-psychology-in-ui-design

### 2. The Psychology of Color in UI/UX Design - UX Magazine, diakses Mei 13, 2026,

### https://uxmag.com/articles/the-psychology-of-color-in-ui-ux-design

### 3. How To Apply Color Psychology To Enhance eLearning Design, diakses Mei 13,

### 2026,

### https://elearningindustry.com/how-to-apply-color-psychology-to-enhance-elear

### ning-design

### 4. 3 Effective Ways to Leverage Color Psychology for Enhanced Learning Outcomes

- Daltile, diakses Mei 13, 2026,

### https://www.daltile.com/tile-therapy/articles/3-effective-ways-to-leverage-color-

### psychology-for-enhanced-learning-outcomes

### 5. Color Psychology for Education: How Does Color Enhance the Learning

### Environment?, diakses Mei 13, 2026,

### https://www.artcobell.com/en-us/blog/color-psychology-for-education

### 6. Overview of Next.js - Patterns.dev, diakses Mei 13, 2026,

### https://www.patterns.dev/react/nextjs/

### 7. Mastering Next JS Layout for Scalable Web Apps - Magic UI, diakses Mei 13, 2026,

### https://magicui.design/blog/next-js-layout

### 8. A Visual Guide to Layouts in Next.js 14 - Builder.io, diakses Mei 13, 2026,

### https://www.builder.io/blog/layouts-in-nextjs-14-visual

### 9. 5 Design Patterns for Building Scalable Next.js Applications - DEV Community,

### diakses Mei 13, 2026,

### https://dev.to/nithya_iyer/5-design-patterns-for-building-scalable-nextjs-applicati

### ons-1c

### 10. Video Length: How Long Should a Course Video Be? - Multimedia Services,

### diakses Mei 13, 2026,

### https://multimedia.ucsd.edu/best-practices/video-length.html

### 11. How Long Should Instructional Videos Be? - OSCQR - SUNY, diakses Mei 13, 2026,

### https://oscqr.suny.edu/how-long-should-instructional-videos-be/


### 12. What's the Optimum Length for an Instructional Video? And Why is it Important? -

### Boclips, diakses Mei 13, 2026,

### https://www.boclips.com/blog/whats-the-optimum-length-for-an-instructional-vi

### deo-and-why-does-it-matter

### 13. Video Length in Online Courses: What the Research Says | Quality Matters,

### diakses Mei 13, 2026,

### https://www.qualitymatters.org/qa-resources/resource-center/articles-resources/

### research-video-length

### 14. Effective Educational Videos: Principles and Guidelines for ..., diakses Mei 13,

### 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC5132380/

### 15. Gemini 1.5: Google's Generative AI Model with Mixture of Experts Architecture -

### Encord, diakses Mei 13, 2026,

### https://encord.com/blog/google-gemini-1-5-generative-ai-model-with-mixture-o

### f-experts/

### 16. Gemini 1.5 Pro - Prompt Engineering Guide, diakses Mei 13, 2026,

### https://www.promptingguide.ai/models/gemini-pro

### 17. Our next-generation model: Gemini 1.5 - Google Blog, diakses Mei 13, 2026,

### https://blog.google/innovation-and-ai/products/google-gemini-next-generation-

### model-february-2024/

### 18. Long context | Gemini API | Google AI for Developers, diakses Mei 13, 2026,

### https://ai.google.dev/gemini-api/docs/long-context

### 19. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of

### context - arXiv, diakses Mei 13, 2026, https://arxiv.org/pdf/2403.

### 20. Reducing video file size with FFmpeg for web optimization | Transloadit, diakses

### Mei 13, 2026,

### https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-o

### ptimization/

### 21. FFmpeg Compress Video Guide for Beginners - Cloudinary, diakses Mei 13, 2026,

### https://cloudinary.com/guides/video-effects/ffmpeg-compress-video

### 22. How to compress video files while maintaining quality with ffmpeg - Mux, diakses

### Mei 13, 2026,

### https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-q

### uality-with-ffmpeg

### 23. Benchmarking FFMPEG's H.265 Options - scottstuff.net, diakses Mei 13, 2026,

### https://scottstuff.net/posts/2025/03/17/benchmarking-ffmpeg-h265/

### 24. How to compress video using FFmpeg - Shotstack, diakses Mei 13, 2026,

### https://shotstack.io/learn/compress-video-ffmpeg/


