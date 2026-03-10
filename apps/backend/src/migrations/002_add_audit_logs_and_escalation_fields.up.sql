-- Phase 2 Migration (UP)
-- Add audit_logs table and escalation tracking fields on queries

BEGIN;

-- 1) Escalation status enum for queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'query_escalation_status') THEN
    CREATE TYPE query_escalation_status AS ENUM ('pending', 'in_review', 'resolved', 'dismissed');
  END IF;
END $$;

-- 2) Additive escalation fields on queries
ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS escalation_status query_escalation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS escalated_by INTEGER NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS resolved_by INTEGER NULL,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'queries_escalated_by_fkey'
      AND table_name = 'queries'
  ) THEN
    ALTER TABLE queries
      ADD CONSTRAINT queries_escalated_by_fkey
      FOREIGN KEY (escalated_by) REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'queries_resolved_by_fkey'
      AND table_name = 'queries'
  ) THEN
    ALTER TABLE queries
      ADD CONSTRAINT queries_resolved_by_fkey
      FOREIGN KEY (resolved_by) REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS queries_escalation_status_idx ON queries(escalation_status);
CREATE INDEX IF NOT EXISTS queries_escalated_at_idx ON queries(escalated_at);

-- 3) Additive audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NULL,
  user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  school_id VARCHAR(100) NULL REFERENCES schools(id) ON DELETE SET NULL,
  ip_address VARCHAR(120) NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_id_idx ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_school_id_idx ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

COMMIT;
