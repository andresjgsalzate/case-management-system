-- =========================================================================
-- MIGRACIÓN: ESTANDARIZACIÓN DE PERMISOS
-- =========================================================================
-- Objetivo: Estandarizar todos los permisos usando:
-- - Módulos en inglés
-- - Acciones estándar: view, create, edit, delete
-- - Formato: module.action.scope
-- =========================================================================

BEGIN;

-- 1. CASOS (casos -> cases)
UPDATE permissions SET 
    module = 'cases',
    action = 'view',
    name = REPLACE(name, 'casos.ver.', 'cases.view.')
WHERE module = 'casos' AND action = 'ver';

UPDATE permissions SET 
    module = 'cases',
    action = 'create', 
    name = REPLACE(name, 'casos.crear.', 'cases.create.')
WHERE module = 'casos' AND action = 'crear';

UPDATE permissions SET 
    module = 'cases',
    action = 'edit',
    name = REPLACE(name, 'casos.editar.', 'cases.edit.')
WHERE module = 'casos' AND action = 'editar';

UPDATE permissions SET 
    module = 'cases',
    action = 'delete',
    name = REPLACE(name, 'casos.eliminar.', 'cases.delete.')
WHERE module = 'casos' AND action = 'eliminar';

UPDATE permissions SET 
    module = 'cases',
    action = 'assign',
    name = REPLACE(name, 'casos.asignar.', 'cases.assign.')
WHERE module = 'casos' AND action = 'asignar';

-- 2. TODOS (todos -> todos, cambiar acciones)
UPDATE permissions SET 
    action = 'view',
    name = REPLACE(name, 'todos.ver.', 'todos.view.')
WHERE module = 'todos' AND action = 'ver';

UPDATE permissions SET 
    action = 'create',
    name = REPLACE(name, 'todos.crear.', 'todos.create.')
WHERE module = 'todos' AND action = 'crear';

UPDATE permissions SET 
    action = 'edit',
    name = REPLACE(name, 'todos.editar.', 'todos.edit.')
WHERE module = 'todos' AND action = 'editar';

UPDATE permissions SET 
    action = 'delete',
    name = REPLACE(name, 'todos.eliminar.', 'todos.delete.')
WHERE module = 'todos' AND action = 'eliminar';

UPDATE permissions SET 
    action = 'assign',
    name = REPLACE(name, 'todos.asignar.', 'todos.assign.')
WHERE module = 'todos' AND action = 'asignar';

-- 3. NOTAS (notas -> notes)
UPDATE permissions SET 
    module = 'notes',
    action = 'view',
    name = REPLACE(name, 'notas.ver.', 'notes.view.')
WHERE module = 'notas' AND action = 'ver';

UPDATE permissions SET 
    module = 'notes',
    action = 'create',
    name = REPLACE(name, 'notas.crear.', 'notes.create.')
WHERE module = 'notas' AND action = 'crear';

UPDATE permissions SET 
    module = 'notes',
    action = 'edit',
    name = REPLACE(name, 'notas.editar.', 'notes.edit.')
WHERE module = 'notas' AND action = 'editar';

UPDATE permissions SET 
    module = 'notes',
    action = 'delete',
    name = REPLACE(name, 'notas.eliminar.', 'notes.delete.')
WHERE module = 'notas' AND action = 'eliminar';

-- 4. DISPOSICIONES (disposiciones -> dispositions)
UPDATE permissions SET 
    module = 'dispositions',
    action = 'view',
    name = REPLACE(name, 'disposiciones.ver.', 'dispositions.view.')
WHERE module = 'disposiciones' AND action = 'ver';

UPDATE permissions SET 
    module = 'dispositions',
    action = 'create',
    name = REPLACE(name, 'disposiciones.crear.', 'dispositions.create.')
WHERE module = 'disposiciones' AND action = 'crear';

UPDATE permissions SET 
    module = 'dispositions',
    action = 'edit',
    name = REPLACE(name, 'disposiciones.editar.', 'dispositions.edit.')
WHERE module = 'disposiciones' AND action = 'editar';

UPDATE permissions SET 
    module = 'dispositions',
    action = 'delete',
    name = REPLACE(name, 'disposiciones.eliminar.', 'dispositions.delete.')
WHERE module = 'disposiciones' AND action = 'eliminar';

-- 5. CONTROL DE CASOS (control-casos -> case_control)
UPDATE permissions SET 
    module = 'case_control',
    action = 'view',
    name = REPLACE(name, 'control-casos.ver.', 'case_control.view.')
WHERE module = 'control-casos' AND action = 'ver';

UPDATE permissions SET 
    module = 'case_control',
    action = 'manage',
    name = REPLACE(name, 'control-casos.gestionar.', 'case_control.manage.')
WHERE module = 'control-casos' AND action = 'gestionar';

-- 6. USUARIOS (usuarios -> users, gestionar -> manage)
UPDATE permissions SET 
    module = 'users',
    action = 'view',
    name = REPLACE(name, 'usuarios.ver.', 'users.view.')
WHERE module = 'usuarios' AND action = 'ver';

UPDATE permissions SET 
    module = 'users',
    action = 'manage',
    name = REPLACE(name, 'usuarios.gestionar.', 'users.manage.')
WHERE module = 'usuarios' AND action = 'gestionar';

-- 7. ROLES (gestionar -> manage)
UPDATE permissions SET 
    action = 'manage',
    name = REPLACE(name, 'roles.gestionar.', 'roles.manage.')
WHERE module = 'roles' AND action = 'gestionar';

-- 8. DASHBOARD (ver -> view)
UPDATE permissions SET 
    action = 'view',
    name = REPLACE(name, 'dashboard.ver.', 'dashboard.view.')
WHERE module = 'dashboard' AND action = 'ver';

-- 9. REPORTES (reportes -> reports, generar -> generate)
UPDATE permissions SET 
    module = 'reports',
    action = 'generate',
    name = REPLACE(name, 'reportes.generar.', 'reports.generate.')
WHERE module = 'reportes' AND action = 'generar';

-- 10. TIEMPO (tiempo -> time, ver -> view, gestionar -> manage)
UPDATE permissions SET 
    module = 'time',
    action = 'view',
    name = REPLACE(name, 'tiempo.ver.', 'time.view.')
WHERE module = 'tiempo' AND action = 'ver';

UPDATE permissions SET 
    module = 'time',
    action = 'manage',
    name = REPLACE(name, 'tiempo.gestionar.', 'time.manage.')
WHERE module = 'tiempo' AND action = 'gestionar';

-- 11. ESTANDARIZAR USUARIOS CON : -> .
UPDATE permissions SET 
    name = REPLACE(REPLACE(name, 'users:', 'users.'), ':', '.')
WHERE module = 'users' AND name LIKE 'users:%';

-- 12. ESTANDARIZAR ROLES CON : -> .
UPDATE permissions SET 
    name = REPLACE(REPLACE(name, 'roles:', 'roles.'), ':', '.')
WHERE module = 'roles' AND name LIKE 'roles:%';

-- 13. AGREGAR PERMISOS FALTANTES PARA KNOWLEDGE EN FORMATO ESTÁNDAR
INSERT INTO permissions (module, action, scope, name, description, "createdAt", "updatedAt")
VALUES 
-- Permisos para exportar knowledge (si no existen)
('knowledge', 'export', 'own', 'knowledge.export.own', 'Exportar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'export', 'team', 'knowledge.export.team', 'Exportar documentos del equipo', NOW(), NOW()),
('knowledge', 'export', 'all', 'knowledge.export.all', 'Exportar cualquier documento de conocimiento', NOW(), NOW()),

-- Permisos para duplicar knowledge (si no existen)
('knowledge', 'duplicate', 'own', 'knowledge.duplicate.own', 'Duplicar documentos de conocimiento propios', NOW(), NOW()),
('knowledge', 'duplicate', 'team', 'knowledge.duplicate.team', 'Duplicar documentos del equipo', NOW(), NOW()),
('knowledge', 'duplicate', 'all', 'knowledge.duplicate.all', 'Duplicar cualquier documento de conocimiento', NOW(), NOW())

ON CONFLICT (name) DO NOTHING;

-- 14. ACTUALIZAR KNOWLEDGE PARA USAR ACCIONES ESTÁNDAR
UPDATE permissions SET 
    action = 'view',
    name = REPLACE(name, 'knowledge.read.', 'knowledge.view.')
WHERE module = 'knowledge' AND action = 'read';

UPDATE permissions SET 
    action = 'edit',
    name = REPLACE(name, 'knowledge.update.', 'knowledge.edit.')
WHERE module = 'knowledge' AND action = 'update';

COMMIT;

-- Verificar resultados
SELECT 
    module,
    action,
    scope,
    name,
    COUNT(*) as count
FROM permissions 
GROUP BY module, action, scope, name
ORDER BY module, action, scope;
