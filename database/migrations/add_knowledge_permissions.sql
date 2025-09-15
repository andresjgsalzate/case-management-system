-- Migración para crear permisos del módulo de base de conocimiento
-- Ejecutar después de tener el sistema de permisos funcionando

-- Insertar permisos para el módulo de base de conocimiento
INSERT INTO permissions (module, action, scope, name, description, "createdAt", "updatedAt")
VALUES 
-- Permisos para documentos de conocimiento
('knowledge', 'read', 'own', 'knowledge.read.own', 'Ver documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'read', 'team', 'knowledge.read.team', 'Ver documentos de conocimiento del equipo', NOW(), NOW()),
('knowledge', 'read', 'all', 'knowledge.read.all', 'Ver todos los documentos de conocimiento', NOW(), NOW()),

('knowledge', 'create', 'own', 'knowledge.create.own', 'Crear documentos de conocimiento', NOW(), NOW()),
('knowledge', 'create', 'team', 'knowledge.create.team', 'Crear documentos para el equipo', NOW(), NOW()),
('knowledge', 'create', 'all', 'knowledge.create.all', 'Crear cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'update', 'own', 'knowledge.update.own', 'Actualizar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'update', 'team', 'knowledge.update.team', 'Actualizar documentos del equipo', NOW(), NOW()),
('knowledge', 'update', 'all', 'knowledge.update.all', 'Actualizar cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'delete', 'own', 'knowledge.delete.own', 'Eliminar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'delete', 'team', 'knowledge.delete.team', 'Eliminar documentos del equipo', NOW(), NOW()),
('knowledge', 'delete', 'all', 'knowledge.delete.all', 'Eliminar cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'publish', 'own', 'knowledge.publish.own', 'Publicar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'publish', 'team', 'knowledge.publish.team', 'Publicar documentos del equipo', NOW(), NOW()),
('knowledge', 'publish', 'all', 'knowledge.publish.all', 'Publicar cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'archive', 'own', 'knowledge.archive.own', 'Archivar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'archive', 'team', 'knowledge.archive.team', 'Archivar documentos del equipo', NOW(), NOW()),
('knowledge', 'archive', 'all', 'knowledge.archive.all', 'Archivar cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'export', 'own', 'knowledge.export.own', 'Exportar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'export', 'team', 'knowledge.export.team', 'Exportar documentos del equipo', NOW(), NOW()),
('knowledge', 'export', 'all', 'knowledge.export.all', 'Exportar cualquier documento de conocimiento', NOW(), NOW()),

('knowledge', 'duplicate', 'own', 'knowledge.duplicate.own', 'Duplicar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'duplicate', 'team', 'knowledge.duplicate.team', 'Duplicar documentos del equipo', NOW(), NOW()),
('knowledge', 'duplicate', 'all', 'knowledge.duplicate.all', 'Duplicar cualquier documento de conocimiento', NOW(), NOW()),

-- Permisos para tipos de documentos
('knowledge_types', 'read', 'all', 'knowledge_types.read.all', 'Ver tipos de documentos de conocimiento', NOW(), NOW()),
('knowledge_types', 'create', 'all', 'knowledge_types.create.all', 'Crear tipos de documentos de conocimiento', NOW(), NOW()),
('knowledge_types', 'update', 'all', 'knowledge_types.update.all', 'Actualizar tipos de documentos de conocimiento', NOW(), NOW()),
('knowledge_types', 'delete', 'all', 'knowledge_types.delete.all', 'Eliminar tipos de documentos de conocimiento', NOW(), NOW()),

-- Permisos para feedback
('knowledge_feedback', 'create', 'own', 'knowledge_feedback.create.own', 'Dar feedback en documentos de conocimiento', NOW(), NOW()),
('knowledge_feedback', 'read', 'all', 'knowledge_feedback.read.all', 'Ver todo el feedback de documentos', NOW(), NOW()),
('knowledge_feedback', 'update', 'own', 'knowledge_feedback.update.own', 'Actualizar mi feedback', NOW(), NOW()),
('knowledge_feedback', 'delete', 'own', 'knowledge_feedback.delete.own', 'Eliminar mi feedback', NOW(), NOW())

ON CONFLICT (name) DO NOTHING;
