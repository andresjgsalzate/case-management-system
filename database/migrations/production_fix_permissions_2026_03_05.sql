-- ============================================
-- MIGRACIÓN DE PRODUCCIÓN: Corrección Sistema de Permisos
-- Fecha: 2026-03-05
-- Descripción: 
--   1. Crear permisos de teams en inglés
--   2. Crear permisos faltantes (admin.todo_priorities, teams.manage.members)
--   3. Asignar permisos a roles específicos
--   4. Limpiar permisos del rol Usuario
--   5. Eliminar duplicados en role_permissions
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: CREAR PERMISOS DE TEAMS EN INGLÉS
-- ============================================

INSERT INTO permissions (id, name, description, module, action, scope, "isActive", "createdAt", "updatedAt") VALUES
-- Permisos para ver equipos
(gen_random_uuid(), 'teams.view.own', 'Ver mis equipos (donde soy miembro)', 'teams', 'view', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.view.team', 'Ver equipos relacionados', 'teams', 'view', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.view.all', 'Ver todos los equipos', 'teams', 'view', 'all', true, NOW(), NOW()),

-- Permisos para crear equipos
(gen_random_uuid(), 'teams.create.own', 'Crear equipos propios', 'teams', 'create', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.create.team', 'Crear equipos para mi área', 'teams', 'create', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.create.all', 'Crear cualquier equipo', 'teams', 'create', 'all', true, NOW(), NOW()),

-- Permisos para editar equipos
(gen_random_uuid(), 'teams.edit.own', 'Editar equipos que gestiono', 'teams', 'edit', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.edit.team', 'Editar equipos de mi área', 'teams', 'edit', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.edit.all', 'Editar cualquier equipo', 'teams', 'edit', 'all', true, NOW(), NOW()),

-- Permisos para eliminar equipos
(gen_random_uuid(), 'teams.delete.own', 'Eliminar equipos que gestiono', 'teams', 'delete', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.delete.team', 'Eliminar equipos de mi área', 'teams', 'delete', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.delete.all', 'Eliminar cualquier equipo', 'teams', 'delete', 'all', true, NOW(), NOW()),

-- Permisos para gestionar miembros
(gen_random_uuid(), 'teams.manage.own', 'Gestionar mis equipos', 'teams', 'manage', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.team', 'Gestionar equipos del área', 'teams', 'manage', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.all', 'Gestionar cualquier equipo', 'teams', 'manage', 'all', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.members', 'Gestionar miembros (compatibilidad)', 'teams', 'manage', 'members', true, NOW(), NOW()),

-- Permisos para gestionar miembros con scope específico
(gen_random_uuid(), 'teams.manage.members.own', 'Gestionar miembros de mis equipos', 'teams', 'manage.members', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.members.team', 'Gestionar miembros de equipos del área', 'teams', 'manage.members', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.members.all', 'Gestionar miembros de cualquier equipo', 'teams', 'manage.members', 'all', true, NOW(), NOW())

ON CONFLICT (name) DO UPDATE SET 
    "isActive" = true, 
    "updatedAt" = NOW();

-- ============================================
-- PASO 2: CREAR PERMISOS FALTANTES (admin.todo_priorities)
-- ============================================

INSERT INTO permissions (id, name, description, module, action, scope, "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'admin.todo_priorities.create', 'Crear prioridades de tareas', 'admin', 'create', 'all', true, NOW(), NOW()),
(gen_random_uuid(), 'admin.todo_priorities.delete', 'Eliminar prioridades de tareas', 'admin', 'delete', 'all', true, NOW(), NOW()),
(gen_random_uuid(), 'admin.todo_priorities.update', 'Actualizar prioridades de tareas', 'admin', 'update', 'all', true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET 
    "isActive" = true, 
    "updatedAt" = NOW();

-- ============================================
-- PASO 3: ASIGNAR PERMISOS A ROLES
-- ============================================

-- 3.1 Asignar TODOS los permisos de teams al Administrador
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Administrador'
  AND p.module = 'teams'
  AND p."isActive" = true
ON CONFLICT DO NOTHING;

-- 3.2 Asignar permisos admin.todo_priorities al Administrador
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Administrador'
  AND p.name IN ('admin.todo_priorities.create', 'admin.todo_priorities.delete', 'admin.todo_priorities.update')
ON CONFLICT DO NOTHING;

-- 3.3 Asignar permisos de teams limitados a Analista de Aplicaciones
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Analista de Aplicaciones'
  AND p.name IN (
    'teams.view.team', 
    'teams.view.own', 
    'teams.manage.team', 
    'teams.manage.own', 
    'teams.manage.members',
    'teams.manage.members.team',
    'teams.manage.members.own'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- PASO 4: LIMPIAR PERMISOS DEL ROL USUARIO
-- (El rol Usuario no debe tener permisos ya que todos
-- los usuarios deben tener un rol específico)
-- ============================================

DELETE FROM role_permissions 
WHERE "roleId" = (SELECT id FROM roles WHERE name = 'Usuario');

-- ============================================
-- PASO 5: ELIMINAR DUPLICADOS EN role_permissions
-- ============================================

DELETE FROM role_permissions a 
USING role_permissions b
WHERE a.id > b.id 
  AND a."roleId" = b."roleId" 
  AND a."permissionId" = b."permissionId";

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
DECLARE
    admin_perms INTEGER;
    analista_perms INTEGER;
    usuario_perms INTEGER;
    teams_perms INTEGER;
    duplicates INTEGER;
BEGIN
    -- Contar permisos por rol
    SELECT COUNT(*) INTO admin_perms FROM role_permissions rp 
    JOIN roles r ON rp."roleId" = r.id WHERE r.name = 'Administrador';
    
    SELECT COUNT(*) INTO analista_perms FROM role_permissions rp 
    JOIN roles r ON rp."roleId" = r.id WHERE r.name = 'Analista de Aplicaciones';
    
    SELECT COUNT(*) INTO usuario_perms FROM role_permissions rp 
    JOIN roles r ON rp."roleId" = r.id WHERE r.name = 'Usuario';
    
    -- Contar permisos de teams
    SELECT COUNT(*) INTO teams_perms FROM permissions WHERE module = 'teams' AND "isActive" = true;
    
    -- Contar duplicados
    SELECT COUNT(*) INTO duplicates FROM (
        SELECT "roleId", "permissionId", COUNT(*) 
        FROM role_permissions 
        GROUP BY "roleId", "permissionId" 
        HAVING COUNT(*) > 1
    ) sub;
    
    RAISE NOTICE '=== VERIFICACIÓN DE MIGRACIÓN ===';
    RAISE NOTICE 'Permisos Administrador: %', admin_perms;
    RAISE NOTICE 'Permisos Analista: %', analista_perms;
    RAISE NOTICE 'Permisos Usuario: % (debe ser 0)', usuario_perms;
    RAISE NOTICE 'Permisos de teams en BD: %', teams_perms;
    RAISE NOTICE 'Duplicados restantes: % (debe ser 0)', duplicates;
    
    -- Validar condiciones críticas
    IF usuario_perms > 0 THEN
        RAISE EXCEPTION 'ERROR: El rol Usuario aún tiene permisos asignados';
    END IF;
    
    IF duplicates > 0 THEN
        RAISE EXCEPTION 'ERROR: Aún existen duplicados en role_permissions';
    END IF;
    
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===';
END $$;

COMMIT;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN POST-MIGRACIÓN
-- (Ejecutar manualmente después del COMMIT)
-- ============================================

-- Ver resumen de permisos por rol:
-- SELECT r.name, COUNT(rp.id) as total_permisos
-- FROM roles r 
-- LEFT JOIN role_permissions rp ON r.id = rp."roleId"
-- GROUP BY r.id, r.name 
-- ORDER BY total_permisos DESC;

-- Ver permisos de teams por rol:
-- SELECT r.name, string_agg(p.name, ', ' ORDER BY p.name) as teams_perms
-- FROM roles r 
-- JOIN role_permissions rp ON r.id = rp."roleId"
-- JOIN permissions p ON rp."permissionId" = p.id
-- WHERE p.module = 'teams'
-- GROUP BY r.id, r.name 
-- ORDER BY r.name;
