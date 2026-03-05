-- Migración: Corrección de Permisos del Sistema de Equipos
-- Descripción: Agregar permisos en inglés para el módulo de equipos
-- que coincidan con los nombres usados en las rutas del backend
-- Fecha: 2026-03-05
-- Autor: Sistema de Gestión de Casos

BEGIN;

-- ============================================
-- PROBLEMA: Las rutas usan teams.* pero la BD tiene equipos.*
-- SOLUCIÓN: Crear permisos duplicados en inglés
-- ============================================

-- Limpiar permisos existentes que puedan estar duplicados
-- (solo los de módulo 'teams' en inglés)
DELETE FROM role_permissions WHERE "permissionId" IN (
    SELECT id FROM permissions WHERE module = 'teams'
);

DELETE FROM permissions WHERE module = 'teams';

-- ============================================
-- PERMISOS COMPLETOS DEL MÓDULO TEAMS (EN INGLÉS)
-- ============================================

INSERT INTO permissions (id, name, description, module, action, scope, "isActive", "createdAt", "updatedAt") VALUES

-- ============================================
-- PERMISOS PARA VER EQUIPOS
-- ============================================
(gen_random_uuid(), 'teams.view.own', 'Ver mis equipos (donde soy miembro)', 'teams', 'view', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.view.team', 'Ver equipos relacionados', 'teams', 'view', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.view.all', 'Ver todos los equipos', 'teams', 'view', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA CREAR EQUIPOS
-- ============================================
(gen_random_uuid(), 'teams.create.own', 'Crear equipos propios', 'teams', 'create', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.create.team', 'Crear equipos para mi área', 'teams', 'create', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.create.all', 'Crear cualquier equipo', 'teams', 'create', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA EDITAR EQUIPOS
-- ============================================
(gen_random_uuid(), 'teams.edit.own', 'Editar equipos que gestiono', 'teams', 'edit', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.edit.team', 'Editar equipos de mi área', 'teams', 'edit', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.edit.all', 'Editar cualquier equipo', 'teams', 'edit', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA ELIMINAR EQUIPOS
-- ============================================
(gen_random_uuid(), 'teams.delete.own', 'Eliminar equipos que gestiono', 'teams', 'delete', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.delete.team', 'Eliminar equipos de mi área', 'teams', 'delete', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.delete.all', 'Eliminar cualquier equipo', 'teams', 'delete', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA GESTIONAR MIEMBROS
-- ============================================
(gen_random_uuid(), 'teams.manage.members.own', 'Gestionar miembros de mis equipos', 'teams', 'manage.members', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.members.team', 'Gestionar miembros de equipos del área', 'teams', 'manage.members', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.manage.members.all', 'Gestionar miembros de cualquier equipo', 'teams', 'manage.members', 'all', true, NOW(), NOW()),

-- Permiso genérico para compatibilidad con rutas actuales
(gen_random_uuid(), 'teams.manage.members', 'Gestionar miembros (compatibilidad)', 'teams', 'manage', 'members', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA CAMBIAR ROLES EN EQUIPOS
-- ============================================
(gen_random_uuid(), 'teams.role.change.own', 'Cambiar roles en mis equipos', 'teams', 'role.change', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.role.change.team', 'Cambiar roles en equipos del área', 'teams', 'role.change', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.role.change.all', 'Cambiar roles en cualquier equipo', 'teams', 'role.change', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA VER ESTADÍSTICAS
-- ============================================
(gen_random_uuid(), 'teams.stats.view.own', 'Ver estadísticas de mis equipos', 'teams', 'stats.view', 'own', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.stats.view.team', 'Ver estadísticas de equipos del área', 'teams', 'stats.view', 'team', true, NOW(), NOW()),
(gen_random_uuid(), 'teams.stats.view.all', 'Ver estadísticas de todos los equipos', 'teams', 'stats.view', 'all', true, NOW(), NOW())

ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = true,
    "updatedAt" = NOW();

-- ============================================
-- ASIGNACIÓN DE PERMISOS A ROLES
-- ============================================

DO $$
DECLARE
    admin_role_id UUID;
    supervisor_role_id UUID;
    analista_role_id UUID;
    usuario_role_id UUID;
BEGIN
    -- Obtener IDs de roles existentes
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrador' LIMIT 1;
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'Supervisor' LIMIT 1;
    SELECT id INTO analista_role_id FROM roles WHERE name ILIKE '%analista%' LIMIT 1;
    SELECT id INTO usuario_role_id FROM roles WHERE name = 'Usuario' LIMIT 1;

    -- ============================================
    -- PERMISOS PARA ADMINISTRADOR (acceso completo)
    -- ============================================
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
        SELECT admin_role_id, p.id, NOW()
        FROM permissions p
        WHERE p.module = 'teams' AND p."isActive" = true
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Administrador';
    ELSE
        RAISE NOTICE 'Rol Administrador no encontrado';
    END IF;

    -- ============================================
    -- PERMISOS PARA SUPERVISOR (gestión de sus equipos)
    -- ============================================
    IF supervisor_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
        SELECT supervisor_role_id, p.id, NOW()
        FROM permissions p
        WHERE p.module = 'teams' 
        AND p."isActive" = true
        AND p.name IN (
            -- Ver todos los equipos
            'teams.view.own',
            'teams.view.team',
            'teams.view.all',
            -- Editar equipos que gestiona
            'teams.edit.own',
            'teams.edit.team',
            -- Gestionar miembros de sus equipos
            'teams.manage.members.own',
            'teams.manage.members.team',
            'teams.manage.members',
            -- Cambiar roles en sus equipos
            'teams.role.change.own',
            'teams.role.change.team',
            -- Ver estadísticas
            'teams.stats.view.own',
            'teams.stats.view.team',
            'teams.stats.view.all'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Supervisor';
    ELSE
        RAISE NOTICE 'Rol Supervisor no encontrado';
    END IF;

    -- ============================================
    -- PERMISOS PARA ANALISTA (ver y participar)
    -- ============================================
    IF analista_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
        SELECT analista_role_id, p.id, NOW()
        FROM permissions p
        WHERE p.module = 'teams' 
        AND p."isActive" = true
        AND p.name IN (
            -- Ver equipos donde es miembro
            'teams.view.own',
            'teams.view.team',
            -- Ver estadísticas de sus equipos
            'teams.stats.view.own'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Analista';
    ELSE
        RAISE NOTICE 'Rol Analista no encontrado';
    END IF;

    -- ============================================
    -- PERMISOS PARA USUARIO (solo visualización básica)
    -- ============================================
    IF usuario_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
        SELECT usuario_role_id, p.id, NOW()
        FROM permissions p
        WHERE p.module = 'teams' 
        AND p."isActive" = true
        AND p.name IN (
            -- Solo ver sus equipos
            'teams.view.own',
            -- Ver estadísticas básicas
            'teams.stats.view.own'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Usuario';
    ELSE
        RAISE NOTICE 'Rol Usuario no encontrado';
    END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================

SELECT 
    '=== PERMISOS DE TEAMS CREADOS ===' as info;

SELECT 
    name,
    description,
    scope
FROM permissions 
WHERE module = 'teams' AND "isActive" = true
ORDER BY action, scope;

SELECT 
    '=== ASIGNACIÓN POR ROL ===' as info;

SELECT 
    r.name as rol,
    COUNT(rp."permissionId") as permisos_teams
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id AND p.module = 'teams'
GROUP BY r.name
ORDER BY permisos_teams DESC;
