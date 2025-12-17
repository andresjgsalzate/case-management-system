-- ===============================================
-- ESTANDARIZACIÓN DE PERMISOS - SOLO INGLÉS
-- ===============================================
-- Este script elimina permisos duplicados y estandariza todos los permisos al formato:
-- module.action.scope (inglés únicamente)

BEGIN;

-- 1. LIMPIAR PERMISOS DUPLICADOS DE METRICS
-- Solo mantener metrics.read.own, metrics.read.team, metrics.read.all (genéricos)
DELETE FROM role_permissions 
WHERE "permissionId" IN (
    SELECT id FROM permissions 
    WHERE name IN (
        'metrics.cases.read.own', 'metrics.time.read.own', 'metrics.general.read.own',
        'metrics.users.read.own', 'metrics.status.read.own', 'metrics.performance.read.own',
        'metrics.applications.read.own', 'metrics.cases.read.all', 'metrics.time.read.all', 
        'metrics.general.read.all', 'metrics.users.read.all', 'metrics.status.read.all', 
        'metrics.performance.read.all', 'metrics.applications.read.all',
        'metrics.cases.read.team', 'metrics.time.read.team', 'metrics.general.read.team',
        'metrics.users.read.team', 'metrics.status.read.team', 'metrics.performance.read.team',
        'metrics.applications.read.team'
    )
);

DELETE FROM permissions 
WHERE name IN (
    'metrics.cases.read.own', 'metrics.time.read.own', 'metrics.general.read.own',
    'metrics.users.read.own', 'metrics.status.read.own', 'metrics.performance.read.own',
    'metrics.applications.read.own', 'metrics.cases.read.all', 'metrics.time.read.all', 
    'metrics.general.read.all', 'metrics.users.read.all', 'metrics.status.read.all', 
    'metrics.performance.read.all', 'metrics.applications.read.all',
    'metrics.cases.read.team', 'metrics.time.read.team', 'metrics.general.read.team',
    'metrics.users.read.team', 'metrics.status.read.team', 'metrics.performance.read.team',
    'metrics.applications.read.team'
);

-- 2. CREAR PERMISOS BÁSICOS FALTANTES
-- Asegurar que tenemos permisos básicos de navegación
INSERT INTO permissions (name, description, module, action, scope, "isActive")
VALUES 
    ('cases.view.own', 'View own cases', 'cases', 'view', 'own', true),
    ('cases.view.team', 'View team cases', 'cases', 'view', 'team', true),
    ('cases.view.all', 'View all cases', 'cases', 'view', 'all', true),
    ('todos.view.own', 'View own todos', 'todos', 'view', 'own', true),
    ('todos.view.team', 'View team todos', 'todos', 'view', 'team', true), 
    ('todos.view.all', 'View all todos', 'todos', 'view', 'all', true),
    ('notes.view.own', 'View own notes', 'notes', 'view', 'own', true),
    ('notes.view.team', 'View team notes', 'notes', 'view', 'team', true),
    ('notes.view.all', 'View all notes', 'notes', 'view', 'all', true),
    ('dispositions.view.own', 'View own dispositions', 'dispositions', 'view', 'own', true),
    ('dispositions.view.team', 'View team dispositions', 'dispositions', 'view', 'team', true),
    ('dispositions.view.all', 'View all dispositions', 'dispositions', 'view', 'all', true),
    ('dashboard.view.own', 'View own dashboard', 'dashboard', 'view', 'own', true),
    ('dashboard.view.team', 'View team dashboard', 'dashboard', 'view', 'team', true),
    ('dashboard.view.all', 'View all dashboards', 'dashboard', 'view', 'all', true),
    ('knowledge.view.own', 'View own knowledge', 'knowledge', 'view', 'own', true),
    ('knowledge.view.team', 'View team knowledge', 'knowledge', 'view', 'team', true),
    ('knowledge.view.all', 'View all knowledge', 'knowledge', 'view', 'all', true),
    ('archive.view.own', 'View own archive', 'archive', 'view', 'own', true),
    ('archive.view.team', 'View team archive', 'archive', 'view', 'team', true),
    ('archive.view.all', 'View all archive', 'archive', 'view', 'all', true)
ON CONFLICT (name) DO NOTHING;

-- 8. ACTUALIZAR DESCRIPCIONES A INGLÉS
UPDATE permissions SET description = 'Create own cases' WHERE name = 'cases.create.own';
UPDATE permissions SET description = 'Create team cases' WHERE name = 'cases.create.team';
UPDATE permissions SET description = 'Create all cases' WHERE name = 'cases.create.all';
UPDATE permissions SET description = 'View own cases' WHERE name = 'cases.view.own';
UPDATE permissions SET description = 'View team cases' WHERE name = 'cases.view.team';
UPDATE permissions SET description = 'View all cases' WHERE name = 'cases.view.all';
UPDATE permissions SET description = 'Update own cases' WHERE name = 'cases.update.own';
UPDATE permissions SET description = 'Update team cases' WHERE name = 'cases.update.team';
UPDATE permissions SET description = 'Update all cases' WHERE name = 'cases.update.all';
UPDATE permissions SET description = 'Delete own cases' WHERE name = 'cases.delete.own';
UPDATE permissions SET description = 'Delete team cases' WHERE name = 'cases.delete.team';
UPDATE permissions SET description = 'Delete all cases' WHERE name = 'cases.delete.all';

UPDATE permissions SET description = 'Create own todos' WHERE name = 'todos.create.own';
UPDATE permissions SET description = 'Create team todos' WHERE name = 'todos.create.team';
UPDATE permissions SET description = 'Create all todos' WHERE name = 'todos.create.all';
UPDATE permissions SET description = 'View own todos' WHERE name = 'todos.view.own';
UPDATE permissions SET description = 'View team todos' WHERE name = 'todos.view.team';
UPDATE permissions SET description = 'View all todos' WHERE name = 'todos.view.all';

UPDATE permissions SET description = 'Create own notes' WHERE name = 'notes.create.own';
UPDATE permissions SET description = 'View own notes' WHERE name = 'notes.view.own';
UPDATE permissions SET description = 'View team notes' WHERE name = 'notes.view.team';
UPDATE permissions SET description = 'View all notes' WHERE name = 'notes.view.all';

UPDATE permissions SET description = 'View own dashboard' WHERE name = 'dashboard.view.own';
UPDATE permissions SET description = 'View team dashboard' WHERE name = 'dashboard.view.team';
UPDATE permissions SET description = 'View all dashboards' WHERE name = 'dashboard.view.all';
UPDATE permissions SET description = 'Read own dashboard' WHERE name = 'dashboard.read.own';
UPDATE permissions SET description = 'Read team dashboard' WHERE name = 'dashboard.read.team';
UPDATE permissions SET description = 'Read all dashboards' WHERE name = 'dashboard.read.all';

UPDATE permissions SET description = 'View own dispositions' WHERE name = 'dispositions.view.own';
UPDATE permissions SET description = 'View team dispositions' WHERE name = 'dispositions.view.team';
UPDATE permissions SET description = 'View all dispositions' WHERE name = 'dispositions.view.all';

UPDATE permissions SET description = 'Read own knowledge documents' WHERE name = 'knowledge.read.own';
UPDATE permissions SET description = 'Read team knowledge documents' WHERE name = 'knowledge.read.team';
UPDATE permissions SET description = 'Read all knowledge documents' WHERE name = 'knowledge.read.all';

-- 9. VERIFICACIÓN FINAL
-- Contar permisos antes y después
DO $$
DECLARE
    permission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO permission_count FROM permissions;
    RAISE NOTICE 'Total permissions after cleanup: %', permission_count;
END $$;

COMMIT;

-- Mostrar un resumen de los permisos finales por módulo
SELECT 
    module,
    action,
    scope,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as permission_names
FROM permissions 
WHERE "isActive" = true
GROUP BY module, action, scope
ORDER BY module, action, scope;