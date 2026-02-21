-- Fix Knowledge Base Permissions Migration
-- This script uses the correct column names based on the TypeORM entities

-- Insert review permissions
INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.own', 'review', 'Revisar documentos propios de la base de conocimiento', 'knowledge', 'own', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.own');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.team', 'review', 'Revisar documentos del equipo de la base de conocimiento', 'knowledge', 'team', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.team');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.review.all', 'review', 'Revisar todos los documentos de la base de conocimiento', 'knowledge', 'all', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.review.all');

-- Insert approve permissions
INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.own', 'approve', 'Aprobar documentos propios de la base de conocimiento', 'knowledge', 'own', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.own');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.team', 'approve', 'Aprobar documentos del equipo de la base de conocimiento', 'knowledge', 'team', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.team');

INSERT INTO permissions (name, action, description, module, scope, "isActive", "createdAt", "updatedAt")
SELECT 'knowledge.approve.all', 'approve', 'Aprobar todos los documentos de la base de conocimiento', 'knowledge', 'all', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'knowledge.approve.all');

-- Assign permissions to Administrador role (roleId = 1)
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 1, p.id, NOW()
FROM permissions p
WHERE p.name IN ('knowledge.review.all', 'knowledge.approve.all')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = 1 AND rp."permissionId" = p.id
);

-- Assign permissions to Supervisor role (roleId = 2)
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 2, p.id, NOW()
FROM permissions p
WHERE p.name IN ('knowledge.review.team', 'knowledge.approve.team')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = 2 AND rp."permissionId" = p.id
);

-- Assign permissions to Analista role (roleId = 3)
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 3, p.id, NOW()
FROM permissions p
WHERE p.name IN ('knowledge.review.own')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = 3 AND rp."permissionId" = p.id
);

-- Verify inserted permissions
SELECT name, action, module, scope FROM permissions WHERE action IN ('review', 'approve') AND module = 'knowledge';
