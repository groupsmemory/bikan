# Laporan Penelitian Arsitektur dan

# Infrastruktur Skalabel Platform LMS

# BIKAN Berbasis Next.js 15, NeonDB, dan

# Gemini API

## Struktur Folder Next.js App Router Berbasis Fitur dan

## Multi-Role

Pembangunan aplikasi berskala perusahaan besar membutuhkan disiplin arsitektural yang ketat
untuk mengatasi kompleksitas kode, performa bermanifestasi tinggi, dan kolaborasi tim yang
paralel.^1 Next.js 15 memperkenalkan pergeseran fundamental melalui stabilisasi App Router,
penggunaan React Server Components (RSC) secara bawaan, serta pengenalan mesin
kompilasi Turbopack untuk menggantikan Webpack pada lingkungan pengembangan lokal.^1
Untuk platform Learning Management System (LMS) profesional seperti BIKAN yang melayani
banyak peran pengguna (multi-role seperti Administrator, Pengajar, dan Siswa), struktur folder
berbasis fitur ( _feature-based architecture_ ) dipadukan dengan arsitektur berlapis ( _layered
architecture_ ) guna menjamin pemisahan kepentingan ( _separation of concerns_ ) yang optimal.^1
Dalam implementasi Next.js 15, grafik dependensi aplikasi harus mengalir satu arah demi
menjaga modularitas kode: lapisan rute mengonsumsi komponen UI, dan komponen UI
mengonsumsi pustaka infrastruktur (app → components → lib).^2 Elemen di dalam direktori
pustaka diwajibkan bersifat agnostik dan dilarang keras mengimpor kode dari direktori
komponen maupun direktori aplikasi utama.^2 Manajemen peran pengguna diimplementasikan
menggunakan fitur _Route Groups_ untuk mengelompokkan halaman tanpa memengaruhi
struktur tautan URL, sementara komponen yang bersifat eksklusif untuk satu fitur diisolasi di
dalam _Private Folders_ dengan awalan garis bawah.^4 Peta struktur folder skala perusahaan
untuk platform BIKAN dirancang sebagai berikut:
bikan-lms/
├── app/ # Lapisan Inti Aplikasi & Routing Server
│ ├── (auth)/ # Route Group Otentikasi Terisolasi
│ │ ├── login/
│ │ └── register/
│ ├── (dashboard)/ # Route Group Ruang Kerja Multi-Role
│ │ ├── admin/ # Panel Khusus Administrator Sistem
│ │ │ ├── courses/
│ │ │ └── users/
│ │ ├── instructor/ # Panel Kerja Pengajar (Manajemen Materi)


│ │ │ └── curriculum/
│ │ ├── student/ # Panel Belajar Siswa (Progres Kuliah)
│ │ │ ├── courses/
│ │ │ └── progress/
│ │ ├── layout.tsx # Pengamanan Akses Global & Tata Letak Dashboard
│ │ └── page.tsx # Gerbang Pengalihan Otomatis Peran Pengguna
│ ├── api/ # Lapisan REST Endpoints & Penanganan Webhooks
│ │ └── v1/
│ ├── error.tsx # Penangkap Interupsi Kesalahan Aplikasi
│ ├── layout.tsx # Tata Letak Utama (Root Layout)
│ └── loading.tsx # Skeleton Loader Global Sisi Server
├── components/ # Lapisan Presentasi UI Rekonsiliasi
│ ├── features/ # Komponen Modular Berbasis Fitur Spesifik
│ │ ├── course-player/ # Modul Pemutar Materi Video Interaktif
│ │ ├── quiz-engine/ # Mesin Evaluasi Pengujian & Kuis
│ │ └── ai-tutor/ # Panel Interaksi Kecerdasan Buatan Gemini
│ ├── ui/ # Komponen Atomik Primitif (Button, Dialog, Input)
│ └── shared/ # Komponen Berbagi Pakai (Sidebar, Navbar)
├── agents/ # Orkestrasi Agen Cerdas LLM Workflow
│ ├── prompts/ # Penyimpanan Berkas Template System Prompt
│ ├── tools/ # Skrip Fungsi Eksternal Eksekusi Agen
│ └── lms-agent.ts # Deklarasi Kelas Utama Agen BIKAN
├── hooks/ # Custom React Hooks Eksklusif Klien
│ ├── use-auth-session.ts
│ └── use-player-state.ts
├── lib/ # Lapisan Infrastruktur Bisnis Agnostik
│ ├── db/ # Manajemen Basis Data Relasional
│ │ ├── client.ts # Inisialisasi Koneksi Klien NeonDB
│ │ └── schema.ts # Definisi Skema Tabel Data Relasional
│ ├── ai/ # Konfigurasi Konektor Google AI Studio SDK
│ │ └── gemini.ts
│ └── utils/ # Fungsi Pembantu Validasi dan Formatter
├── styles/ # Konfigurasi Gaya Global dan Variabel CSS
└── public/ # Penyimpanan Berkas Statis Browser
Struktur ini memfasilitasi tim pengembang untuk bekerja secara mandiri tanpa memicu konflik
kode pada repositori utama.^1 Integrasi fungsi kecerdasan buatan diisolasi sepenuhnya pada
direktori agen baru yang diperkenalkan pada pola pengembangan modern, mengonfigurasi alur
kerja model bahasa besar tanpa mengontaminasi komponen tampilan UI.^2
**Lapisan Arsitektur Komponen Utama Perilaku Rendering &
Konvensi Dependensi
Infrastruktur (/lib)** Klien Database, Skema Merupakan default Server-Side,


```
Object-Relational Mapping
(ORM), Konfigurasi SDK.^1
tidak boleh mengimpor dari
direktori /components atau
/app.^2
Agen Cerdas (/agents) System Prompts, Tool
Definition, Fungsi RAG.^2
Mengeksekusi instruksi kognitif
LLM di sisi server secara
terisolasi.^2
UI Reusable (/components) Komponen UI Atomik, Blok
Fitur Terisolasi.^1
Server Components secara
bawaan, menggunakan arahan
"use client" secara ketat hanya
pada interaksi dinamis.^1
Aplikasi (/app) Struktur Rute, Berkas Kontrol
(layout.tsx, error.tsx,
loading.tsx).^4
Menangani resolusi navigasi,
penegakan keamanan
otentikasi di tingkat server, dan
streaming data.^1
```
## Skema Database Relasional Komprehensif Berkinerja

## Tinggi

Untuk memenuhi kebutuhan platform LMS profesional berskala masif, desain database
diimplementasikan menggunakan PostgreSQL pada platform NeonDB dengan membagi entitas
ke dalam dua skema logis terpisah: lms_core untuk seluruh operasional akademik dan
lms_analytics untuk menampung log pemrosesan kecerdasan buatan.^6 Pemisahan skema ini
membentuk batasan keamanan yang jelas serta menyederhanakan pengelolaan hak akses
terperinci ( _fine-grained security_ ) menggunakan kontrol peran database.^6

### Kamus Data Hubungan Entitas LMS Profesional

```
Nama Tabel Ruang Lingkup Skema Deskripsi Fungsional
Keamanan dan Skalabilitas
users lms_core Menyimpan kredensial
otentikasi, enkripsi kata sandi,
dan penentuan peran
pengguna.^8
courses lms_core Representasi entitas mata
kuliah atau pelatihan yang
dikelola oleh instruktur.^8
enrollments lms_core Tabel relasi banyak-ke-banyak
yang memetakan pendaftaran
siswa ke mata kuliah tertentu.^8
resources lms_core Menyimpan metadata materi
```

```
pembelajaran baik berupa teks,
berkas eksternal, maupun
tautan URL.^8
assessments lms_core Mengelola modul kuis, ujian,
dan penugasan akademik
berkala.^8
grades lms_core Mencatat hasil evaluasi ujian,
perolehan skor numerik, dan
umpan balik instruktur.^8
learning_progress lms_core Melacak persentase
penyelesaian materi siswa
secara riil di tingkat unit
materi.^8
ai_interaction_logs lms_analytics Menyimpan rekam jejak utilitas
asisten pintar, volume token,
dan performa latensi.
```
### Deklarasi Data Definition Language (DDL SQL) Berkinerja Tinggi

##### SQL

-- Aktivasi Ekstensi Keamanan dan Pemantauan Kinerja Global
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public; [9]
-- Pembuatan Wadah Skema Logis Terisolasi
CREATE SCHEMA lms_core; [6]
CREATE SCHEMA lms_analytics; [6]
-- Definisi Tipe Data Enumerasi Terstruktur
CREATE TYPE lms_core.user_role AS ENUM ('admin', 'instructor', 'student'); [10]
CREATE TYPE lms_core.completion_status AS ENUM ('active', 'completed', 'dropped'); [8]
-- 1. TABEL PENGGUNA (USERS)
CREATE TABLE lms_core.users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
role lms_core.user_role NOT NULL DEFAULT 'student'[8, 10]
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,


updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- 2. TABEL KURSUS (COURSES)
CREATE TABLE lms_core.courses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title VARCHAR(255) NOT NULL,
description TEXT,
instructor_id UUID NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id)
REFERENCES lms_core.users(id) ON DELETE RESTRICT [8]
);
-- 3. TABEL PENDAFTARAN (ENROLLMENTS)
CREATE TABLE lms_core.enrollments (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
course_id UUID NOT NULL,
student_id UUID NOT NULL,
enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT
NULL[8]
status lms_core.completion_status NOT NULL DEFAULT 'active'[8]
CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES
lms_core.courses(id) ON DELETE CASCADE[10]
CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES
lms_core.users(id) ON DELETE CASCADE[10]
CONSTRAINT unique_student_course_enrollment UNIQUE (student_id, course_id)
);
-- 4. TABEL MATERI PEMBELAJARAN (RESOURCES)
CREATE TABLE lms_core.resources (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
course_id UUID NOT NULL,
title VARCHAR(255) NOT NULL,
resource_type VARCHAR(50) NOT NULL, -- e.g., 'video', 'pdf', 'link'
url TEXT NOT NULL[8]
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
CONSTRAINT fk_resources_course FOREIGN KEY (course_id) REFERENCES
lms_core.courses(id) ON DELETE CASCADE [8]
);
-- 5. TABEL EVALUASI UJIAN (ASSESSMENTS)


CREATE TABLE lms_core.assessments (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
course_id UUID NOT NULL,
title VARCHAR(255) NOT NULL,
description TEXT,
due_date TIMESTAMP WITH TIME ZONE[8]
max_score INT NOT NULL DEFAULT 100[8]
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
CONSTRAINT fk_assessments_course FOREIGN KEY (course_id) REFERENCES
lms_core.courses(id) ON DELETE CASCADE [8]
);
-- 6. TABEL NILAI EVALUASI (GRADES)
CREATE TABLE lms_core.grades (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
assessment_id UUID NOT NULL,
student_id UUID NOT NULL,
score INT NOT NULL[8]
feedback TEXT[8]
graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
CONSTRAINT fk_grades_assessment FOREIGN KEY (assessment_id) REFERENCES
lms_core.assessments(id) ON DELETE CASCADE[8]
CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES
lms_core.users(id) ON DELETE CASCADE [8]
);
-- 7. TABEL JEJAK PROGRES (LEARNING PROGRESS)
CREATE TABLE lms_core.learning_progress (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL,
course_id UUID NOT NULL,
lesson_id UUID NOT NULL[8]
completion_percentage INT NOT NULL DEFAULT 0[8]
last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT
NULL[8]
CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES lms_core.users(id)
ON DELETE CASCADE[8]
CONSTRAINT fk_progress_course FOREIGN KEY (course_id) REFERENCES
lms_core.courses(id) ON DELETE CASCADE[8]
CONSTRAINT check_percentage_bounds CHECK (completion_percentage >= 0 AND
completion_percentage <= 100)
);


##### -- 8. TABEL ANALITIK INTERAKSI AI PARTISI (AI INTERACTION LOGS)

CREATE TABLE lms_analytics.ai_interaction_logs (
id UUID DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL,
prompt_tokens INT NOT NULL,
completion_tokens INT NOT NULL,
total_tokens INT NOT NULL,
cached_tokens INT NOT NULL DEFAULT 0[11]
latency_ms INT NOT NULL,
workflow_tag VARCHAR(100) NOT NULL[12]
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at); [13]
-- Strategi Pengindeksan Berdasarkan Kardinalitas Kolom
CREATE INDEX idx_users_email ON lms_core.users(email); [9]
CREATE INDEX idx_enrollments_student_course ON lms_core.enrollments(student_id,
course_id); [8]
CREATE INDEX idx_learning_progress_composite ON lms_core.learning_progress(user_id,
course_id, lesson_id);
CREATE INDEX idx_grades_assessment_student ON lms_core.grades(assessment_id,
student_id); [8]
-- Strategi Indeks Parsial Demi Efisiensi Operasi Penulisan
CREATE INDEX idx_enrollments_active_status ON lms_core.enrollments (created_at)
WHERE status = 'active'; [14]

## Panduan Optimasi Kueri dan Arsitektur Penyimpanan

## NeonDB

NeonDB merombak total arsitektur penyimpanan PostgreSQL dengan memisahkan simpul
kalkulasi komputasi ( _compute nodes_ ) yang bersifat _stateless_ dan sekali pakai dari lapisan
penyimpanan data persisten ( _Pageservers_ ) yang disokong oleh media penyimpanan objek
berkemampuan skala tinggi.^15 Karakteristik pemisahan ini menghadirkan lompatan performa
baru, namun memerlukan teknik penulisan kueri dan pengelolaan konfigurasi engine yang
spesifik untuk meniadakan potensi latensi tambahan akibat lompatan jaringan antar-lapisan.^15

### Mekanisme Akselerasi Penulisan Data Tanpa Risiko Torn Pages

Inovasi arsitektural terbesar pada NeonDB adalah penonaktifan parameter _Full Page Writes_
(FPW) secara global di tingkat kluster.^16 Di dalam arsitektur PostgreSQL tradisional, pengaktifan


FPW bersifat mandatori guna menghindari korupsi data akibat kegagalan penulisan parsial
halaman berukuran 8KB ke media disk lokal saat sistem mengalami malafungsi mendadak ( _torn
pages_ ).^16
Postgres tradisional mengatasi hal ini dengan menyalin seluruh citra fisik halaman berukuran
8KB ke dalam Write-Ahead Log (WAL) setelah setiap milestone checkpoint, yang berdampak
pada pembengkakan ukuran file log hingga 15 kali lipat dan memicu kemacetan performa I/O.^16
NeonDB mengeliminasi kerentanan ini secara struktural dengan mengalirkan data transaksi
WAL secara langsung menuju konsensus kuorum _Safekeepers_ yang bersifat _stateless_.^15
Karena simpul komputasi Neon tidak menyimpan file data lokal yang dapat terfragmentasi
secara fisik, malafungsi _torn pages_ tidak akan pernah terjadi, sehingga penonaktifan FPW aman
dilakukan dan mampu mendongkrak daya tampung kecepatan penulisan ( _write throughput_ )
hingga 5 kali lipat.^16

### Manajemen Partisi Data untuk Lonjakan Data Log dan Aktivitas

### Pengguna

Untuk mengantisipasi lonjakan pertumbuhan tabel ai_interaction_logs yang mengancam
efisiensi pembacaan indeks _B-Tree_ , strategi pembagian tabel ( _Table Partitioning_ ) berbasis
jangkauan waktu ( _Range Partitioning_ ) wajib diterapkan secara berkala.^9 Melalui pembagian ini,
pemindaian data kueri dibatasi hanya pada partisi bulan berjalan tanpa perlu menelusuri
ratusan juta baris data histori lama.^13
SQL
-- Deklarasi Pembuatan Sub-Tabel Partisi Bulanan Eksplisit untuk Kuartal Dua 2026
CREATE TABLE lms_analytics.ai_logs_2026_m05 PARTITION OF
lms_analytics.ai_interaction_logs
FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
CREATE TABLE lms_analytics.ai_logs_2026_m06 PARTITION OF
lms_analytics.ai_interaction_logs
FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
Operasi penghapusan data lama ( _archiving_ ) dapat dieksekusi secara instan dengan
memisahkan dan menghapus sub-tabel partisi menggunakan perintah DROP TABLE alih-alih
mengeksekusi operasi DELETE FROM massal yang memicu penguncian baris database secara
masif dan memperlambat throughput sistem.^13

### Pola Pemantauan Kinerja Menggunakan pg_stat_statements

Analisis performa kueri pada aplikasi BIKAN mengandalkan metrik agregasi dari ekstensi
pg_stat_statements.^9 Pengembang dilarang menebak letak kemacetan performa dan diwajibkan


menggunakan tiga pola kueri diagnosis berikut:
SQL
-- Pola 1: Mengidentifikasi 100 Kueri Paling Sering Dieksekusi (Beban Frekuensi Tinggi)
SELECT userid, query, calls, total_exec_time / 1000 AS total_seconds, mean_exec_time AS
avg_ms
FROM pg_stat_statements
ORDER BY calls DESC LIMIT 100; [9]
-- Pola 2: Mengidentifikasi 100 Kueri dengan Latensi Rata-Rata Terburuk (Slowest Query)
SELECT userid, query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 100; [9]
-- Pola 3: Mengidentifikasi Kueri yang Mengembalikan Baris Data Terbanyak (Indikasi
Kebocoran Memori)
SELECT query, rows, mean_exec_time
FROM pg_stat_statements
ORDER BY rows DESC LIMIT 100; [9]

### Pemeliharaan Kinerja Memori Kerja dan Efisiensi Cache Hit Ratio

NeonDB memperluas arsitektur memori _shared buffers_ PostgreSQL bawaan dengan
mengintegrasikan sistem _Local File Cache_ pada simpul komputasinya.^9 Penilaian kesehatan
retensi memori kerja aktif didasarkan pada perhitungan matematis dari metrik yang disediakan
oleh ekstensi lokal neon 9 :
Apabila rasio hit menyentuh angka di bawah 99%, hal tersebut mengindikasikan bahwa alokasi
memori kerja komputasi sudah tidak mampu menampung data aktif ( _working dataset_ ), sehingga
konfigurasi kapasitas _Compute Unit_ (CU) wajib ditingkatkan demi menghindari pemindaian disk
sekunder.^9 Untuk mengatasi fragmentasi ruang baris akibat teknologi MVCC, operasi
pembersihan wajib diotomatisasi secara berkala 9 :
SQL
-- Pembersihan data sampah tanpa penguncian tabel eksklusif


VACUUM lms_core.learning_progress; [9]
-- Membangun ulang struktur indeks yang mengalami fragmentasi internal parah
REINDEX TABLE lms_core.enrollments; [9]

### Tuning Konfigurasi Core Engine PostgreSQL untuk Lonjakan

### Throughput Penulisan

```
Parameter Server Nilai Target Optimasi Justifikasi Teknis
Infrastruktur
wal_buffers 64MB Memperbesar ruang
penampung log transaksi di
memori sebelum dialirkan ke
Safekeeper untuk
meminimalkan hambatan I/O.^14
synchronous_commit off Mengaktifkan skema komit
asinkron guna
melipatgandakan performa tulis
hingga 3-5 kali dengan
toleransi kehilangan data log
maksimal 200ms saat bencana
crash.^14
wal_compression zstd Mengompresi log transaksi
secara agresif untuk
menghemat lebar pita jaringan
transfer data ke Pageserver.^14
checkpoint_timeout 15min Memperpanjang interval siklus
pembersihan memori demi
meratakan lonjakan penulisan
piringan dari default 5 menit.^14
checkpoint_completion_target 0.9 Menyebarkan beban I/O
penulisan data sepanjang 90%
waktu durasi interval
checkpoint untuk menghindari
pembekuan sistem.^14
```
## Arsitektur Integrasi Gemini API yang Aman dan

## Efisien Token

Integrasi asisten cerdas pada platform BIKAN dirancang dengan arsitektur tanpa celah


keamanan yang meniadakan eksposur kunci rahasia ke peramban, serta menerapkan teknik
rekayasa prompt taktis untuk menekan biaya pengeluaran token hingga 40-60%.^1

### Arsitektur Aliran Data Terisolasi Sisi Server

Keamanan mutlak dicapai dengan melarang komponen aplikasi di sisi klien melakukan
pemanggilan protokol HTTP secara langsung ke kluster Google AI Studio.^1 Kunci otentikasi
GEMINI_API_KEY disimpan secara eksklusif dalam bentuk variabel lingkungan terenkripsi di
sisi server peladen Next.js.^19 Akses interaksi kecerdasan buatan dijembatani oleh komponen
_Next.js Server Actions_ ("use server") yang mengeksekusi logika kognitif di balik firewall
peladen.^1

### Pembersihan dan Optimalisasi Struktur Prompt Caching

Model bahasa besar Gemini versi 2.5 ke atas mengintegrasikan fitur _Implicit Caching_ secara
bawaan yang memberikan reduksi harga token input hingga 90%.^11 Penghematan otomatis ini
dipicu apabila ukuran data input memenuhi batas minimum volume token spesifik sesuai tipe
model yang dituju.^21
**Varian Model Gemini Ambang Batas Minimum
Token Aktivasi Cache
Besaran Diskon Finansial
Input Token
Gemini 2.5 Flash / Gemini 3
Flash Preview**
21 90%^ Penghematan^ Biaya^ Input^
11
**Gemini 2.5 Pro / Gemini 3 Pro
Preview**

##### 21

90% Penghematan Biaya Input
11
Untuk memaksimalkan tingkat keberhasilan _Cache Hit_ , struktur pembentukan prompt diatur
secara ketat dengan menempatkan konten statis berukuran besar di bagian paling awal
instruksi.^11 Data dinamis yang sering berubah diletakkan di akhir susunan prompt.^11 Pola
penyusunan string prompt diatur dengan urutan berikut:
[Awal Prompt] -> ──► Memicu Validasi Cache Hit 111818 [Akhir Prompt] ->^11

### Teknik Penghematan Token Tingkat Lanjut

1. **Trimming Prompt Instructions:** Menghilangkan kata-kata basa-basi, pengulangan
    kalimat, dan instruksi kesopanan.^18 Model kecerdasan buatan merespons instruksi
    langsung secara efektif tanpa membutuhkan teks pemanis yang menguras token.^18
2. **Compress Context Documents:** Sebelum menyertakan dokumen kurikulum ke dalam
    prompt, bagian teks yang tidak relevan dengan kompetensi inti materi wajib dipangkas
    secara ketat.^18
3. **Structured Input Formats:** Transmisi data kompleks menggunakan format terstruktur
    seperti JSON atau pasangan kunci-nilai jauh lebih efisien menghemat ruang token
    dibandingkan narasi bahasa alami.^18
4. **Optimize Few-Shot Examples:** Pembelajaran contoh di dalam prompt ( _few-shot_ )
    dikurangi hingga jumlah minimum yang paling esensial dengan penulisan representasi


```
kasus yang sepadat mungkin.^18
```
5. **Control Output Length:** Penetapan parameter max_output_tokens dipasang secara
    ketat bersamaan dengan instruksi sistem agar model memberikan jawaban yang ringkas
    dan padat demi menghentikan generasi teks tanpa batas yang menguras anggaran biaya
    token.^12
6. **Dual-Model Routing:** Mengurangi biaya operasional hingga 41% dengan
    mengimplementasikan pola percabangan tugas cerdas.^12 Tugas evaluasi esai yang rumit
    dialihkan ke model bernilai akurasi tinggi seperti Gemini Pro, sedangkan interaksi
    tanya-jawab kasual siswa dilayani oleh Gemini Flash yang jauh lebih murah.^12

## Peta Jalan Teknis (Technology Roadmap) dari Lokal

## ke Vercel

Siklus hidup pengembangan, pengujian skema data, hingga peluncuran aplikasi ke peladen
produksi cloud dirancang terotomatisasi secara penuh guna mengeliminasi kesalahan manusia
dalam manajemen infrastruktur.^3
──────────► ──────────►
● Next.js 15 + Turbopack 2 - Eksekusi Linter & Unit Testing - Penyebaran Serverless Edge 3
● Database Branching Lokal via - Otomatisasi Cabang Database - Sinkronisasi Variabel
Lingkungan Neon CLI (neonctl) 15 via Neon CircleCI Orb 17 secara Terenkripsi 20
● Sinkronisasi Berkas .env.local 20 - Migrasi Otomatis Skema ORM 22 - Prewarming Memori
Cache 17

### Fase 1: Konfigurasi Lingkungan Kerja Lokal (Local Development)

Inisialisasi lingkungan kerja memanfaatkan kecepatan kompilasi Turbopack yang menggantikan
Webpack pada mode pengembangan Next.js 15.^2 Pengembang diwajibkan menginstal Neon
CLI (neonctl) untuk mengelola ekosistem pencabangan basis data secara mandiri tanpa
memengaruhi data utama di cloud.^15
Sinkronisasi rahasia dijalankan dengan mengeksekusi perintah vercel env pull, yang secara
otomatis mengunduh variabel lingkungan dari proyek cloud Vercel ke dalam memori komputer
lokal dalam bentuk berkas .env.local.^20 Untuk pengerjaan fitur baru, pengembang membentuk
cabang database temporer terisolasi yang mengadopsi struktur data produksi menggunakan
perintah neonctl branch create --name dev-[nama-fitur].^15

### Fase 2: Otomatisasi Pipa Integrasi (CI/CD Pipeline)

Setiap pengajuan kode baru melalui mekanis _Pull Request_ di GitHub akan memicu eksekusi
pipa otomasi CI/CD menggunakan platform GitHub Actions atau _Neon CircleCI Orb_.^17 Pipa
otomatis ini memprovisikan satu cabang database ephemeral (sementara) khusus untuk
menjalankan skenario pengujian integrasi.^17
Setelah cabang database temporer aktif, sistem menjalankan validasi sinkronisasi file skema


Object-Relational Mapping (ORM) terhadap database tujuan melalui eksekusi perintah npm run
db:generate untuk memproduksi file SQL, dilanjutkan dengan perintah npm run db:migrate
untuk menerapkan perubahan skema secara langsung.^22 Apabila seluruh rangkaian pengujian
integrasi lolos, sistem secara otomatis menghapus cabang database ephemeral tersebut untuk
meniadakan pemborosan biaya penyimpanan komputasi.^17

### Fase 3: Peluncuran ke Server Produksi Cloud Vercel

Ketika kode digabungkan ke cabang utama (main), Vercel memulai proses kompilasi kode dan
mendistribusikannya ke infrastruktur peladen global _Serverless Edge Functions_ demi
meminimalkan waktu respon awal halaman bagi pengguna akhir.^3 Penghubungan string koneksi
dilakukan secara aman di tingkat dasbor manajemen variabel lingkungan Vercel dengan
penegakan konfigurasi parameter enkripsi lapisan soket aman
(sslmode=require&channel_binding=require).^20
Setelah infrastruktur produksi aktif, NeonDB menjalankan fitur _Automatic Cache Prewarming_
secara berkala selama pembaruan terjadwal simpul komputasi.^17 Fitur ini secara otomatis
memuat ulang data penting ke dalam memori lokal sesaat setelah peladen Postgres melakukan
restart, sehingga kecepatan kueri aplikasi tetap stabil tanpa mengalami penurunan performa
awal.^17

## Panduan Implementasi Step-by-Step

Panduan prosedural ini disusun secara berurutan tanpa bahasa chatbot untuk menjamin
kemudahan adopsi sistem oleh tim teknis dan operasional.

### 1. Panduan Rekayasa Kode Bagi Pengembang (Developer Guide)

```
● Langkah 1: Jalankan instalasi seluruh paket dependensi pustaka inti yang dibutuhkan
untuk interaksi platform, database ORM, dan modul SDK kecerdasan buatan 19 :
Bash
npm install @google/genai drizzle-orm pg
npm install -D drizzle-kit @types/pg
● Langkah 2: Susun arsitektur inisialisasi koneksi basis data relasional pada berkas
@/lib/db/client.ts dengan mengimpor seluruh definisi tabel skema 22 :
TypeScript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
const client = new Client({
connectionString: process.env.DATABASE_URL,
});
```

await client.connect();
export const db = drizzle(client, { schema }); [22]
● **Langkah 3:** Bangun implementasi modul peladen _Next.js Server Action_ pada berkas
@/app/actions/ai-tutor.ts guna memproses interaksi bimbingan belajar cerdas secara
aman 1 :
TypeScript
"use server"; [2]
import { GoogleGenAI } from '@google/genai'; [19]
import { db } from '@/lib/db/client'; [22]
import { ai_interaction_logs } from '@/lib/db/schema';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); [19]
export async function tanyakanAsistenPintar(userId: string, pertanyaanSiswa: string,
konteksMateri: string) {
const waktuMulai = Date.now();
// Penyusunan prompt terstruktur secara berurutan demi mengaktifkan penghematan
implicit caching
const respon = await ai.models.generateContent({
model: 'gemini-2.5-flash'[21]
contents: }[11, 18, 21]
{ role: 'user', parts: }
],
config: { maxOutputTokens: 400 } [18]
});
const durasiLatensi = Date.now() - waktuMulai;
const metadataToken = respon.usageMetadata; [21]
// Pencatatan log analitik penggunaan token ke skema analitik terpisah
await db.insert(ai_interaction_logs).values({
userId,
promptTokens: metadataToken?.promptTokenCount?? 0,
completion_tokens: metadataToken?.candidatesTokenCount?? 0,
total_tokens: metadataToken?.totalTokenCount?? 0,
cached_tokens: metadataToken?.cachedContentTokenCount?? 0[11]
latencyMs: durasiLatensi,
workflowTag: 'student_tutor_chat' [12]
});


```
return respon.text;
}
```
### 2. Panduan Operasional Basis Data Bagi Administrator (Admin Guide)

```
● Langkah 1: Jalankan pembatasan hak keamanan ( privilege access control ) di tingkat
database dengan membagi pengguna administratif ke dalam peran kelompok kerja yang
spesifik 6 :
SQL
-- Membuat grup peran pengajar
CREATE ROLE lms_instructor_group NOSUPERUSER NOCREATEDB
NOCREATEROLE INHERIT; [7]
-- Memberikan hak akses penggunaan skema akademik lms_core
GRANT USAGE ON SCHEMA lms_core TO lms_instructor_group; [6]
-- Memberikan hak manipulasi data materi kurikulum secara eksklusif kepada instruktur
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA lms_core
TO lms_instructor_group; [6]
● Langkah 2: Lakukan pemantauan efisiensi pemanfaatan teknologi implicit caching
kecerdasan buatan secara berkala untuk mengaudit pengeluaran anggaran token 11 :
SQL
SELECT workflow_tag,
sum(prompt_tokens) AS total_token_masuk,
sum(cached_tokens) AS total_token_berhasil_cache[11]
(sum(cached_tokens)::float / nullif(sum(prompt_tokens), 0)) * 100 AS
rasio_efisiensi_cache_persen
FROM lms_analytics.ai_interaction_logs
GROUP BY workflow_tag; [12]
● Langkah 3: Evaluasi kondisi tabel operasional untuk mengidentifikasi adanya indikasi
degradasi kecepatan baca akibat ketiadaan indeks relasional 9 :
SQL
SELECT relname AS nama_tabel,
CASE WHEN seq_scan > COALESCE(idx_scan, 0) THEN 'REKOMENDASI:
Evaluasi Pemasangan Indeks Baru'
ELSE 'STATUS: Kinerja Optimal' END AS rekomendasi_tindakan
FROM pg_stat_user_tables
WHERE schemaname = 'lms_core'
ORDER BY (seq_scan - COALESCE(idx_scan, 0)) DESC LIMIT 5; [9]
```
### 3. Panduan Siklus Alur Sistem Bagi Pengguna Akhir (User Guide)


```
● Langkah 1: Alur Registrasi Akun dan Otentikasi Sistem Siswa atau pengajar baru
mengunjungi halaman antarmuka pendaftaran di rute URL /register.^4 Formulir pendaftaran
meminta input nama, alamat email aktif, dan kata sandi.^8 Setelah pengguna menekan
tombol submisi, sistem belakang mengamankan kata sandi menggunakan algoritma
hashing, mencatat entitas baru ke tabel lms_core.users, lalu mengarahkan pengguna
secara otomatis ke halaman /login.^8
● Langkah 2: Proses Otentikasi dan Pengalihan Ruang Kerja Berbasis Peran (Role
Redirection) Pengguna memasukkan kredensial email pada halaman /login.^4 Setelah
proses otentikasi divalidasi oleh sistem server Next.js, komponen tata letak utama
(app/(dashboard)/layout.tsx) membaca kolom role pengguna secara riil.^4 Jika pengguna
terdaftar dengan peran pengajar ( instructor ), antarmuka dialihkan secara instan menuju
rute panel manajemen kurikulum di (dashboard)/instructor/curriculum.^10 Bagi pengguna
dengan peran siswa ( student ), layar dialihkan menuju rute ruang belajar utama di
(dashboard)/student/courses.^10
● Langkah 3: Interaksi Ruang Belajar Berbantuan Asisten Cerdas AI Siswa memilih
salah satu judul pelatihan aktif pada dasbor belajar mereka.^10 Pemilihan modul memicu
pemuatan komponen utama components/features/course-player untuk menyajikan materi
video beserta berkas referensi pendukung yang bersumber dari tabel
lms_core.resources.^8 Jika siswa mengalami kendala pemahaman materi, mereka dapat
berinteraksi langsung melalui panel asisten pintar components/features/ai-tutor di sisi
kanan layar.^8 Pertanyaan siswa diproses secara aman di sisi server melalui mekanisme
Server Action , dan jawaban dikembalikan dalam bentuk teks mengalir ( streaming text
response ) secara waktu nyata tanpa memperlambat navigasi antarmuka utama LMS.^1
```
#### Karya yang dikutip

#### 1. Enterprise Patterns with the Next.js App Router - Medium, diakses Mei 13, 2026,

#### https://medium.com/@vasanthancomrads/enterprise-patterns-with-the-next-js-app

#### -router-ff4ca0ef04c

#### 2. Next.js Project Structure 2026: Scalable Full-Stack Template, diakses Mei 13,

#### 2026, https://www.groovyweb.co/blog/nextjs-project-structure-full-stack

#### 3. Architecting Large-Scale Next.js Applications (Folder Structure, Patterns, Best

#### Practices), diakses Mei 13, 2026,

#### https://dev.to/addwebsolutionpvtltd/architecting-large-scale-nextjs-applications-fold

#### er-structure-patterns-best-practices-2dpj

#### 4. Next js project structure: Master the setup for scalable Next.js apps - Magic UI,

#### diakses Mei 13, 2026, https://magicui.design/blog/next-js-project-structure

#### 5. Getting Started: Project Structure | Next.js, diakses Mei 13, 2026,

#### https://nextjs.org/docs/app/getting-started/project-structure

#### 6. PostgreSQL 17 Administration: Mastering Schemas, Databases, and Roles -

#### Medium, diakses Mei 13, 2026,

#### https://medium.com/@jramcloud1/postgresql-17-administration-mastering-schema

#### s-databases-and-roles-aa1166037ddf


#### 7. Add login roles to PostgreSQL—ArcGIS Pro | Documentation, diakses Mei 13,

#### 2026,

#### https://pro.arcgis.com/en/pro-app/latest/help/data/geodatabases/manage-postgres

#### ql/add-users-postgresql.htm

#### 8. Learning Management System Database Structure and Schema, diakses Mei 13,

#### 2026,

#### https://databasesample.com/database/learning-management-system-database

#### 9. Optimize Postgres query performance - Neon Docs, diakses Mei 13, 2026,

#### https://neon.com/docs/postgresql/query-performance

#### 10. LMS Database Schema Overview | PDF - Scribd, diakses Mei 13, 2026,

#### https://www.scribd.com/document/829434544/LMS-LLD

#### 11. Context caching overview | Gemini Enterprise Agent Platform | Google Cloud

#### Documentation, diakses Mei 13, 2026,

#### https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-ca

#### che/context-cache-overview

#### 12. GPT-4o vs Claude vs Gemini: Token Cost Benchmark 2026 - Branch8, diakses

#### Mei 13, 2026,

#### https://branch8.com/posts/llm-token-efficiency-cost-benchmarking-apac-workflows

#### 13. Advice on partitioning PostgreSQL 17 tables for rapidly growing application -

#### Reddit, diakses Mei 13, 2026,

#### https://www.reddit.com/r/PostgreSQL/comments/1oj5vre/advice_on_partitioning_p

#### ostgresql_17_tables_for/

#### 14. How to Tune PostgreSQL for High Write Throughput - OneUptime, diakses Mei

#### 13, 2026,

#### https://oneuptime.com/blog/post/2026-01-27-high-write-throughput-postgresql/vie

#### w

#### 15. Neon Postgres Review: Serverless PostgreSQL That Actually Scales to Zero -

#### Medium, diakses Mei 13, 2026,

#### https://medium.com/@philmcc/neon-postgres-review-serverless-postgresql-that-a

#### ctually-scales-to-zero-ee14d4e109ba

#### 16. Everyone gets faster writes: We turned off FPW's in Neon, diakses Mei 13, 2026,

#### https://neon.com/blog/turning-off-fpw-for-faster-writes

#### 17. Roadmap - Neon Docs, diakses Mei 13, 2026,

#### https://neon.com/docs/introduction/roadmap

#### 18. How to Use Token-Efficient Prompt Engineering - OneUptime, diakses Mei 13,

#### 2026,

#### https://oneuptime.com/blog/post/2026-02-17-how-to-implement-token-efficient-pro

#### mpt-engineering-for-gemini-long-context-applications/view

#### 19. Stop wasting money on AI: 10 ways to cut token usage - LogRocket Blog, diakses

#### Mei 13, 2026,

#### https://blog.logrocket.com/stop-wasting-ai-tokens-10-ways-to-reduce-usage/

#### 20. Environment variables - Vercel, diakses Mei 13, 2026,

#### https://vercel.com/docs/environment-variables

#### 21. Context caching - Interactions API | Google AI for Developers, diakses Mei 13,

#### 2026, https://ai.google.dev/gemini-api/docs/interactions/caching


#### 22. Vercel with Neon Postgres, diakses Mei 13, 2026,

#### https://vercel.com/templates/next.js/vercel-with-neon-postgres

#### 23. Connect Vercel and Neon manually - Neon Docs, diakses Mei 13, 2026,

#### https://neon.com/docs/guides/vercel-manual


