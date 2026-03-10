-- Phase 2 Migration (DOWN)
-- Roll back audit_logs table and escalation tracking fields on queries

BEGIN;

-- 1) Drop audit_logs table
DROP TABLE IF EXISTS audit_logs;

-- 2) Drop additive query constraints/columns
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_escalated_by_fkey;
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_resolved_by_fkey;

DROP INDEX IF EXISTS queries_escalation_status_idx;
DROP INDEX IF EXISTS queries_escalated_at_idx;

ALTER TABLE queries
  DROP COLUMN IF EXISTS resolution_notes,
  DROP COLUMN IF EXISTS resolved_by,
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS escalated_by,
  DROP COLUMN IF EXISTS escalation_status,
  DROP COLUMN IF EXISTS escalation_reason,
  DROP COLUMN IF EXISTS escalated_at;

-- 3) Drop enum if no longer referenced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_depend d ON d.refobjid = t.oid
    WHERE t.typname = 'query_escalation_status'
      AND d.deptype = 'a'
  ) THEN
    DROP TYPE IF EXISTS query_escalation_status;
  END IF;
END $$;

COMMIT;
