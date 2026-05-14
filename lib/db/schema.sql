-- BIKAN LMS 2026 - NeonDB DDL Schema
-- Optimized for High Write Throughput

-- Global Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHEMAS
CREATE SCHEMA IF NOT EXISTS ims_core;
CREATE SCHEMA IF NOT EXISTS ims_analytics;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE ims_core.user_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ims_core.completion_status AS ENUM ('active', 'completed', 'dropped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CORE TABLES (ims_core)
CREATE TABLE IF NOT EXISTS ims_core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role ims_core.user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ims_core.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES ims_core.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ims_core.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES ims_core.courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES ims_core.users(id) ON DELETE CASCADE,
    status ims_core.completion_status DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS ims_core.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES ims_core.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'video', 'pdf', 'canvas'
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ims_core.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES ims_core.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    config JSONB NOT NULL, -- Mastery thresholds, IRT params
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ims_core.learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES ims_core.users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES ims_core.resources(id) ON DELETE CASCADE,
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ANALYTICS TABLES WITH PARTITIONING (ims_analytics)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Range Partitioning Strategy for ai_interaction_logs
-- ─────────────────────────────────────────────────────────────────────────────
-- Justifikasi (dari PRD & Panduan Infrastruktur):
-- • Tabel ini akan menerima INSERT masif dari setiap interaksi AI siswa
-- • Range Partitioning per bulan membatasi scan hanya pada partisi aktif
-- • Archiving data lama: DROP TABLE partisi lama (instan, tanpa row-lock)
-- • NeonDB: FPW off + async commit = 5x write throughput
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ims_analytics.ai_interaction_logs (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    total_tokens INT NOT NULL,
    cached_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL,
    workflow_tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ─── Monthly Partitions: Q2 2026 (April - Juni) ───
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m04 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m05 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m06 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

-- ─── Monthly Partitions: Q3 2026 (Juli - September) ───
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m07 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m08 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m09 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- ─── Monthly Partitions: Q4 2026 (Oktober - Desember) ───
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m10 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m11 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_m12 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- ─── Monthly Partitions: Q1 2027 (Januari - Maret) ───
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2027_m01 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-02-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2027_m02 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2027-02-01 00:00:00+00') TO ('2027-03-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2027_m03 PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2027-03-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- ─── Default Partition: Safety net untuk data di luar range yang didefinisikan ───
-- Mencegah INSERT failure jika partisi bulan baru belum dibuat
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_default PARTITION OF ims_analytics.ai_interaction_logs
    DEFAULT;

-- ─── Indexes pada tabel partisi (otomatis terpropagasi ke semua partisi) ───
-- Index untuk query audit efisiensi cache per workflow_tag
CREATE INDEX IF NOT EXISTS idx_ai_logs_workflow_tag
    ON ims_analytics.ai_interaction_logs (workflow_tag, created_at DESC);

-- Index untuk query per-user interaction history
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id
    ON ims_analytics.ai_interaction_logs (user_id, created_at DESC);

-- Index untuk monitoring latency outliers
CREATE INDEX IF NOT EXISTS idx_ai_logs_latency
    ON ims_analytics.ai_interaction_logs (latency_ms DESC)
    WHERE latency_ms > 1500;

-- 5. PERFORMANCE OPTIMIZATION (NeonDB-Specific)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Konfigurasi ini dijalankan SEKALI di SQL console NeonDB saat provisioning.
-- JANGAN jalankan di migration script biasa.
-- ═══════════════════════════════════════════════════════════════════════════════
-- ALTER SYSTEM SET full_page_writes = off;          -- NeonDB: Aman karena WAL → Safekeepers (5x write throughput)
-- ALTER SYSTEM SET synchronous_commit = off;        -- Async commit: 3-5x write speed, max 200ms data loss on crash
-- ALTER SYSTEM SET wal_buffers = '64MB';            -- Buffer WAL sebelum flush ke Safekeeper
-- ALTER SYSTEM SET wal_compression = zstd;          -- Kompresi WAL untuk hemat bandwidth
-- ALTER SYSTEM SET checkpoint_timeout = '15min';    -- Perpanjang interval checkpoint (ratakan I/O)
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9; -- Sebarkan I/O 90% durasi checkpoint

-- 6. INDEXES (ims_core)
CREATE INDEX IF NOT EXISTS idx_users_email ON ims_core.users(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON ims_core.enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_resource ON ims_core.learning_progress(user_id, resource_id);

-- Partial index: hanya enrollment aktif (hemat write overhead)
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON ims_core.enrollments(created_at)
    WHERE status = 'active';

-- 7. UTILITY QUERIES (untuk monitoring berkala)
-- ─────────────────────────────────────────────────────────────────────────────
-- Audit efisiensi cache AI per workflow:
--   SELECT workflow_tag,
--          SUM(prompt_tokens) AS total_prompt,
--          SUM(cached_tokens) AS total_cached,
--          ROUND((SUM(cached_tokens)::numeric / NULLIF(SUM(prompt_tokens), 0)) * 100, 2) AS cache_hit_pct
--   FROM ims_analytics.ai_interaction_logs
--   WHERE created_at >= NOW() - INTERVAL '7 days'
--   GROUP BY workflow_tag;
--
-- Archiving partisi lama (instan, tanpa row-lock):
--   ALTER TABLE ims_analytics.ai_interaction_logs DETACH PARTITION ims_analytics.ai_logs_2026_m04;
--   DROP TABLE ims_analytics.ai_logs_2026_m04;
--
-- Membuat partisi bulan baru (jalankan via cron/scheduled job):
--   CREATE TABLE ims_analytics.ai_logs_2027_m04 PARTITION OF ims_analytics.ai_interaction_logs
--       FOR VALUES FROM ('2027-04-01 00:00:00+00') TO ('2027-05-01 00:00:00+00');
