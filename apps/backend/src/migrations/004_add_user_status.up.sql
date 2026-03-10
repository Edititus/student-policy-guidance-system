-- Migration 004: Add status column to users table
-- Replaces the boolean 'active' with a proper state machine

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending_approval', 'active', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add status column (default 'active' so all existing users remain active)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';

-- Index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Backfill: deactivated users (active = false) become 'suspended'
UPDATE users SET status = 'suspended' WHERE active = false AND status = 'active';
