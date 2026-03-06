-- ============================================
-- MIGRACIÓN DE PRODUCCIÓN: Corrección Sistema de Permisos y Triggers
-- Fecha: 2026-03-05 (actualizado 2026-03-06)
-- Descripción: 
--   1. Crear permisos de teams en inglés
--   2. Crear permisos faltantes (admin.todo_priorities, teams.manage.members)
--   3. Asignar permisos a roles específicos
--   4. Limpiar permisos del rol Usuario
--   5. Eliminar duplicados en role_permissions
--   6. Eliminar triggers con snake_case (incompatibles con TypeORM camelCase)
--   7. Sincronizar managerId en tabla teams
-- ============================================

BEGIN;

-- ============================================
-- PASO 0: ELIMINAR TRIGGERS INCOMPATIBLES CON TypeORM
-- Los triggers usaban snake_case (updated_at, user_id, team_id)
-- pero TypeORM usa camelCase (updatedAt, userId, teamId)
-- TypeORM maneja automáticamente los campos updatedAt
-- ============================================

-- Eliminar trigger de team_members (causaba error: record "new" has no field "updated_at")
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

-- Eliminar trigger de teams (mismo problema)
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;

-- Nota: La función update_updated_at_column() puede seguir existiendo
-- para otras tablas que no usen TypeORM, pero estos triggers específicos
-- son incompatibles con las entidades de TypeORM

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
-- PASO 6: SINCRONIZAR managerId EN TABLA TEAMS
-- Algunos equipos tienen miembros con role='manager' pero
-- el campo managerId en la tabla teams está vacío
-- ============================================

UPDATE teams 
SET "managerId" = tm."userId"
FROM team_members tm 
WHERE teams.id = tm."teamId" 
  AND tm.role = 'manager' 
  AND tm."isActive" = true 
  AND teams."managerId" IS NULL;

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
    trigger_team_members BOOLEAN;
    trigger_teams BOOLEAN;
    teams_without_manager INTEGER;
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
    
    -- Verificar triggers eliminados
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_members_updated_at'
    ) INTO trigger_team_members;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_teams_updated_at'
    ) INTO trigger_teams;
    
    -- Verificar equipos con miembros manager pero sin managerId
    SELECT COUNT(*) INTO teams_without_manager
    FROM teams t
    WHERE t."managerId" IS NULL
      AND EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm."teamId" = t.id 
          AND tm.role = 'manager' 
          AND tm."isActive" = true
      );
    
    RAISE NOTICE '=== VERIFICACIÓN DE MIGRACIÓN ===';
    RAISE NOTICE 'Permisos Administrador: %', admin_perms;
    RAISE NOTICE 'Permisos Analista: %', analista_perms;
    RAISE NOTICE 'Permisos Usuario: % (debe ser 0)', usuario_perms;
    RAISE NOTICE 'Permisos de teams en BD: %', teams_perms;
    RAISE NOTICE 'Duplicados restantes: % (debe ser 0)', duplicates;
    RAISE NOTICE 'Trigger team_members existe: % (debe ser false)', trigger_team_members;
    RAISE NOTICE 'Trigger teams existe: % (debe ser false)', trigger_teams;
    RAISE NOTICE 'Equipos sin managerId sincronizado: % (debe ser 0)', teams_without_manager;
    
    -- Validar condiciones críticas
    IF usuario_perms > 0 THEN
        RAISE EXCEPTION 'ERROR: El rol Usuario aún tiene permisos asignados';
    END IF;
    
    IF duplicates > 0 THEN
        RAISE EXCEPTION 'ERROR: Aún existen duplicados en role_permissions';
    END IF;
    
    IF trigger_team_members THEN
        RAISE EXCEPTION 'ERROR: El trigger update_team_members_updated_at no fue eliminado';
    END IF;
    
    IF trigger_teams THEN
        RAISE EXCEPTION 'ERROR: El trigger update_teams_updated_at no fue eliminado';
    END IF;
    
    IF teams_without_manager > 0 THEN
        RAISE WARNING 'ADVERTENCIA: Hay % equipos con miembros manager pero sin managerId', teams_without_manager;
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

-- Verificar que los triggers fueron eliminados:
-- SELECT tgname FROM pg_trigger 
-- WHERE tgname IN ('update_team_members_updated_at', 'update_teams_updated_at');

-- Ver equipos con su manager sincronizado:
-- SELECT t.name as team_name, t."managerId", u."fullName" as manager_name
-- FROM teams t
-- LEFT JOIN user_profiles u ON t."managerId" = u.id
-- ORDER BY t.name;

-- Ver estructura de columnas de team_members (verificar camelCase):
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'team_members' 
-- ORDER BY ordinal_position;
