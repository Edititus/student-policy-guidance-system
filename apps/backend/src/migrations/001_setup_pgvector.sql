-- Migration: Setup pgvector extension and convert embedding column
-- Run this manually in PostgreSQL before starting the app after updating models

-- Step 1: Enable pgvector extension (requires superuser or db owner)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add a new vector column (we'll migrate data then drop old column)
-- First check if the old column exists and has data
DO $$
BEGIN
    -- Check if policy_embeddings table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'policy_embeddings') THEN
        -- Check if embedding column is still FLOAT[] (old type)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'policy_embeddings' 
            AND column_name = 'embedding' 
            AND data_type = 'ARRAY'
        ) THEN
            -- Rename old column
            ALTER TABLE policy_embeddings RENAME COLUMN embedding TO embedding_old;
            
            -- Add new vector column (384 dimensions for all-MiniLM-L6-v2)
            ALTER TABLE policy_embeddings ADD COLUMN embedding vector(384);
            
            -- Migrate existing data (convert FLOAT[] to vector)
            UPDATE policy_embeddings 
            SET embedding = embedding_old::vector(384)
            WHERE embedding_old IS NOT NULL;
            
            -- Drop old column
            ALTER TABLE policy_embeddings DROP COLUMN embedding_old;
            
            RAISE NOTICE 'Successfully migrated embedding column from FLOAT[] to vector(384)';
        ELSE
            RAISE NOTICE 'embedding column already appears to be vector type, skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'policy_embeddings table does not exist yet, will be created with vector type';
    END IF;
END $$;

-- Step 3: Create HNSW index for fast approximate nearest neighbor search
-- HNSW is better for read-heavy workloads (which this is)
DROP INDEX IF EXISTS policy_embeddings_embedding_idx;
CREATE INDEX policy_embeddings_embedding_idx 
ON policy_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Create additional useful indexes
CREATE INDEX IF NOT EXISTS policy_embeddings_policy_id_idx ON policy_embeddings(policy_id);
CREATE INDEX IF NOT EXISTS policy_embeddings_school_id_idx ON policy_embeddings(school_id);

-- Step 5: Analyze table to update statistics
ANALYZE policy_embeddings;

-- Verification query (run after migration)
-- SELECT 
--     column_name, 
--     data_type, 
--     udt_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'policy_embeddings' AND column_name = 'embedding';
