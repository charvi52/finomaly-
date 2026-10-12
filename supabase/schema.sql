-- ==============================================================================
-- Finomaly Database Schema for Supabase (PostgreSQL)
-- ==============================================================================
-- Run this script in your Supabase project's SQL Editor to create the required
-- tables and indexes for behavioral biometrics profile storage and audit logging.

-- 1. Profiles Table: stores enrolled baseline models and consent
CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY,
  baseline jsonb NOT NULL,
  sessions_count int DEFAULT 0,
  consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Audit Logs Table: immutable audit trail of all verification attempts
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  score numeric,
  band text,
  features jsonb,
  flags jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index on user_id and created_at for fast retrieval of the last 20 audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON audit_logs (user_id, created_at DESC);

-- Optional: Enable Row Level Security (RLS) on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: The Finomaly backend uses the Supabase Service Role Key from server routes,
-- which bypasses RLS safely on the server while preventing unauthorized client-side access.
