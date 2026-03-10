-- Rollback migration 004: Remove status column from users table
ALTER TABLE users DROP COLUMN IF EXISTS status;
DROP TYPE IF EXISTS user_status;
