-- ============================================================
-- pgvector Setup for Missing Person RAG System
-- ============================================================
-- Run this SQL in your PostgreSQL database (Supabase SQL Editor)
-- to enable vector similarity search capabilities.
-- ============================================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the vector_store table with native vector column
--    The embedding dimension is 768 (text-embedding-004 output size)
CREATE TABLE IF NOT EXISTS vector_store (
    id BIGSERIAL PRIMARY KEY,
    missing_person_id BIGINT NOT NULL UNIQUE REFERENCES missing_persons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create an index for fast approximate nearest neighbor search
--    Uses cosine distance (most common for text embeddings)
CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
    ON vector_store
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 4. Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_vector_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to call the function on row update
DROP TRIGGER IF EXISTS trigger_vector_store_updated_at ON vector_store;
CREATE TRIGGER trigger_vector_store_updated_at
    BEFORE UPDATE ON vector_store
    FOR EACH ROW
    EXECUTE FUNCTION update_vector_store_updated_at();