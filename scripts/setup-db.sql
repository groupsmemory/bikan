-- BIKAN NeonDB Initial Setup
-- ────────────────────────────
-- Jalankan script ini SEKALI di NeonDB SQL Editor
-- sebelum menjalankan drizzle migrations.
-- 
-- Langkah:
-- 1. Buka NeonDB Dashboard → SQL Editor
-- 2. Paste seluruh isi file ini
-- 3. Klik "Run"

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ims_core;
CREATE SCHEMA IF NOT EXISTS ims_analytics;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
    CREATE TYPE ims_core.user_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ims_core.completion_status AS ENUM ('active', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Verify
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('ims_core', 'ims_analytics');
