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
CREATE TABLE IF NOT EXISTS ims_analytics.ai_interaction_logs (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    cached_tokens INT DEFAULT 0,
    latency_ms INT NOT NULL,
    workflow_tag VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create Partitions for Q2 2026
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_q2_apr PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_q2_may PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS ims_analytics.ai_logs_2026_q2_jun PARTITION OF ims_analytics.ai_interaction_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- 5. PERFORMANCE OPTIMIZATION COMMANDS (NeonDB Context)
-- Note: Run these in the SQL console to disable FPW and optimize throughput
-- ALTER SYSTEM SET full_page_writes = off;
-- ALTER SYSTEM SET synchronous_commit = off;

-- 6. INDEXES
CREATE INDEX idx_users_email ON ims_core.users(email);
CREATE INDEX idx_enrollments_student ON ims_core.enrollments(student_id);
CREATE INDEX idx_learning_progress_user ON ims_core.learning_progress(user_id);
