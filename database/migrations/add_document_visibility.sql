-- Migration: Add Document Visibility and Access Control
-- Description: Adds visibility field and access control lists to knowledge documents
-- Date: 2026-02-21

-- Add visibility column with default 'public' for existing documents
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' NOT NULL;

-- Add visible_to_users JSONB array for custom user access
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visible_to_users JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add visible_to_teams JSONB array for team-based access
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visible_to_teams JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Create index on visibility for faster filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visibility 
ON knowledge_documents(visibility);

-- Create composite index for owner + visibility queries
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_by_visibility 
ON knowledge_documents(created_by, visibility);

-- Create GIN indexes for JSONB arrays (for containment queries)
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visible_to_users 
ON knowledge_documents USING GIN (visible_to_users);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visible_to_teams 
ON knowledge_documents USING GIN (visible_to_teams);

-- Add check constraint to ensure valid visibility values
ALTER TABLE knowledge_documents 
DROP CONSTRAINT IF EXISTS chk_knowledge_documents_visibility;

ALTER TABLE knowledge_documents 
ADD CONSTRAINT chk_knowledge_documents_visibility 
CHECK (visibility IN ('public', 'private', 'team', 'custom'));

-- Comment on columns for documentation
COMMENT ON COLUMN knowledge_documents.visibility IS 'Document visibility: public (everyone), private (author only), team (author teams), custom (specific users/teams)';
COMMENT ON COLUMN knowledge_documents.visible_to_users IS 'Array of user UUIDs with explicit access when visibility is custom';
COMMENT ON COLUMN knowledge_documents.visible_to_teams IS 'Array of team UUIDs with access when visibility is team or custom';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'knowledge_documents' 
AND column_name IN ('visibility', 'visible_to_users', 'visible_to_teams')
ORDER BY column_name;
