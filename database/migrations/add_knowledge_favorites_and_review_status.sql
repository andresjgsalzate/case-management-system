-- Migration: Add Favorites System and Review Status for Knowledge Documents
-- Date: 2026-02-21
-- Features: 
--   1. Favorites system for knowledge documents
--   2. Review status workflow (draft -> pending_review -> published)
--   3. Permissions for review approval

-- ==========================================
-- 1. KNOWLEDGE DOCUMENT FAVORITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS knowledge_document_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique favorite per user/document
    CONSTRAINT unique_user_document_favorite UNIQUE (document_id, user_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_document_id ON knowledge_document_favorites(document_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON knowledge_document_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON knowledge_document_favorites(created_at DESC);

-- ==========================================
-- 2. REVIEW STATUS COLUMN
-- ==========================================
-- Add review_status column to knowledge_documents
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_documents' AND column_name = 'review_status'
    ) THEN
        ALTER TABLE knowledge_documents 
        ADD COLUMN review_status VARCHAR(20) DEFAULT 'draft';
    END IF;
END $$;

-- Add reviewed_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_documents' AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE knowledge_documents 
        ADD COLUMN reviewed_by UUID REFERENCES user_profiles(id);
    END IF;
END $$;

-- Add reviewed_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_documents' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE knowledge_documents 
        ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add review_notes column for reviewer comments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_documents' AND column_name = 'review_notes'
    ) THEN
        ALTER TABLE knowledge_documents 
        ADD COLUMN review_notes TEXT;
    END IF;
END $$;

-- Index for review status queries
CREATE INDEX IF NOT EXISTS idx_knowledge_review_status ON knowledge_documents(review_status);

-- ==========================================
-- 3. PERMISSIONS FOR REVIEW WORKFLOW
-- ==========================================
-- Insert review permissions
INSERT INTO permissions (id, code, name, description, module, scope, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'knowledge.review.own',
    'Revisar documentos propios',
    'Permite enviar documentos propios a revisión',
    'knowledge',
    'own',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'knowledge.review.own');

INSERT INTO permissions (id, code, name, description, module, scope, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'knowledge.review.team',
    'Revisar documentos del equipo',
    'Permite enviar documentos del equipo a revisión',
    'knowledge',
    'team',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'knowledge.review.team');

INSERT INTO permissions (id, code, name, description, module, scope, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'knowledge.review.all',
    'Revisar todos los documentos',
    'Permite enviar cualquier documento a revisión',
    'knowledge',
    'all',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'knowledge.review.all');

-- Approve/Reject permissions (only for reviewers)
INSERT INTO permissions (id, code, name, description, module, scope, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'knowledge.approve.team',
    'Aprobar documentos del equipo',
    'Permite aprobar o rechazar documentos del equipo pendientes de revisión',
    'knowledge',
    'team',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'knowledge.approve.team');

INSERT INTO permissions (id, code, name, description, module, scope, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'knowledge.approve.all',
    'Aprobar todos los documentos',
    'Permite aprobar o rechazar cualquier documento pendiente de revisión',
    'knowledge',
    'all',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'knowledge.approve.all');

-- ==========================================
-- 4. ASSIGN REVIEW PERMISSIONS TO EXISTING ROLES
-- ==========================================
-- Admin gets all permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin' 
AND p.code IN ('knowledge.review.all', 'knowledge.approve.all')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Supervisor gets team permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'supervisor' 
AND p.code IN ('knowledge.review.team', 'knowledge.approve.team')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Analista gets own review permission
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'analista' 
AND p.code = 'knowledge.review.own'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- ==========================================
-- 5. UPDATE EXISTING DOCUMENTS
-- ==========================================
-- Set existing published documents to 'published' status
UPDATE knowledge_documents 
SET review_status = 'published' 
WHERE is_published = true AND (review_status IS NULL OR review_status = 'draft');

-- Set existing draft documents to 'draft' status
UPDATE knowledge_documents 
SET review_status = 'draft' 
WHERE is_published = false AND (review_status IS NULL OR review_status = '');

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added: knowledge_document_favorites table';
    RAISE NOTICE 'Added: review_status, reviewed_by, reviewed_at, review_notes columns';
    RAISE NOTICE 'Added: Review workflow permissions';
END $$;
