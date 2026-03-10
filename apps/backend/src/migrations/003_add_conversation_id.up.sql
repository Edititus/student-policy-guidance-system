-- Migration 003: Add conversation_id to queries table for ChatGPT-style threading
ALTER TABLE queries ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS queries_conversation_id_idx ON queries(conversation_id);
