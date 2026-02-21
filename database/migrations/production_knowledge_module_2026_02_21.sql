-- =============================================
-- MIGRACIÓN CONSOLIDADA: Módulo Base de Conocimiento
-- Fecha: 2026-02-21
-- Descripción: Sistema de favoritos, estados de revisión, permisos y visibilidad
-- =============================================

BEGIN;

-- =============================================
-- 1. TABLA DE FAVORITOS
-- =============================================
CREATE TABLE IF NOT EXISTS knowledge_document_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_document_favorite UNIQUE (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_document_id ON knowledge_document_favorites(document_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON knowledge_document_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON knowledge_document_favorites(created_at DESC);

-- =============================================
-- 2. COLUMNAS DE ESTADO DE REVISIÓN
-- =============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'review_status') THEN
        ALTER TABLE knowledge_documents ADD COLUMN review_status VARCHAR(20) DEFAULT 'draft';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'reviewed_by') THEN
        ALTER TABLE knowledge_documents ADD COLUMN reviewed_by UUID REFERENCES user_profiles(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'reviewed_at') THEN
        ALTER TABLE knowledge_documents ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'review_notes') THEN
        ALTER TABLE knowledge_documents ADD COLUMN review_notes TEXT;
    END IF;
END $$;

-- Índice para review_status
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_review_status ON knowledge_documents(review_status);

-- =============================================
-- 3. PERMISOS DE REVISIÓN Y APROBACIÓN
-- =============================================
-- Review permissions
INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.own', 'review', 'Revisar documentos propios de la base de conocimiento', 'knowledge', 'own', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.own');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.team', 'review', 'Revisar documentos del equipo de la base de conocimiento', 'knowledge', 'team', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.team');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.all', 'review', 'Revisar todos los documentos de la base de conocimiento', 'knowledge', 'all', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.all');

-- Approve permissions
INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.own', 'approve', 'Aprobar documentos propios de la base de conocimiento', 'knowledge', 'own', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.own');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.team', 'approve', 'Aprobar documentos del equipo de la base de conocimiento', 'knowledge', 'team', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.team');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.all', 'approve', 'Aprobar todos los documentos de la base de conocimiento', 'knowledge', 'all', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.all');

-- =============================================
-- 4. VISIBILIDAD DE DOCUMENTOS
-- =============================================
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' NOT NULL;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visible_to_users JSONB DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS visible_to_teams JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Índices de visibilidad
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visibility ON knowledge_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_by_visibility ON knowledge_documents(created_by, visibility);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visible_to_users ON knowledge_documents USING GIN (visible_to_users);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_visible_to_teams ON knowledge_documents USING GIN (visible_to_teams);

-- Constraint de valores válidos
ALTER TABLE knowledge_documents DROP CONSTRAINT IF EXISTS chk_knowledge_documents_visibility;
ALTER TABLE knowledge_documents ADD CONSTRAINT chk_knowledge_documents_visibility 
CHECK (visibility IN ('public', 'private', 'team', 'custom'));

-- =============================================
-- 5. ASIGNAR PERMISOS A ROLES
-- =============================================
-- Administrador: review.all y approve.all
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
AND p.name IN ('knowledge.review.all', 'knowledge.approve.all')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Supervisor (si existe): review.team y approve.team
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Supervisor'
AND p.name IN ('knowledge.review.team', 'knowledge.approve.team')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Analista de Aplicaciones: review.own
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Analista de Aplicaciones'
AND p.name = 'knowledge.review.own'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- =============================================
-- 6. VERIFICACIÓN FINAL
-- =============================================
SELECT '=== COLUMNAS AGREGADAS ===' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'knowledge_documents' 
AND column_name IN ('visibility', 'visible_to_users', 'visible_to_teams', 'review_status', 'reviewed_by', 'reviewed_at', 'review_notes')
ORDER BY column_name;

SELECT '=== PERMISOS CREADOS ===' as info;
SELECT name, action, scope FROM permissions 
WHERE module = 'knowledge' AND action IN ('review', 'approve')
ORDER BY action, scope;

SELECT '=== PERMISOS ASIGNADOS ===' as info;
SELECT r.name as rol, p.name as permiso
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions p ON p.id = rp."permissionId"
WHERE p.module = 'knowledge' AND p.action IN ('review', 'approve')
ORDER BY r.name, p.name;

SELECT '=== TABLA FAVORITOS ===' as info;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_document_favorites') as tabla_existe;

COMMIT;

-- =============================================
-- MIGRACIÓN COMPLETADA EXITOSAMENTE
-- =============================================
