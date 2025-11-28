-- Migración: Permisos del Sistema de Equipos
-- Descripción: Agregar permisos específicos para gestión de equipos al sistema
-- Fecha: 2025-11-21
-- Autor: Sistema de Gestión de Casos

-- Insertar permisos específicos para el módulo de equipos
-- Seguimos el formato: module.action.scope

INSERT INTO permissions (name, description, module, action, scope, "isActive", "createdAt", "updatedAt") VALUES

-- ============================================
-- PERMISOS PARA VER EQUIPOS
-- ============================================

-- Ver mis equipos (equipos donde soy miembro)
('equipos.ver.own', 'Ver mis equipos', 'equipos', 'ver', 'own', true, NOW(), NOW()),

-- Ver equipos relacionados (equipos de mi área/departamento)
('equipos.ver.team', 'Ver equipos relacionados', 'equipos', 'ver', 'team', true, NOW(), NOW()),

-- Ver todos los equipos del sistema
('equipos.ver.all', 'Ver todos los equipos', 'equipos', 'ver', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA CREAR EQUIPOS
-- ============================================

-- Crear nuevos equipos (generalmente solo administradores)
('equipos.crear.all', 'Crear nuevos equipos', 'equipos', 'crear', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA EDITAR EQUIPOS
-- ============================================

-- Editar equipos que gestiono (como manager)
('equipos.editar.own', 'Editar equipos que gestiono', 'equipos', 'editar', 'own', true, NOW(), NOW()),

-- Editar cualquier equipo del sistema
('equipos.editar.all', 'Editar cualquier equipo', 'equipos', 'editar', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA GESTIONAR MIEMBROS
-- ============================================

-- Gestionar miembros de equipos que lidero
('equipos.miembros.gestionar.own', 'Gestionar miembros de mis equipos', 'equipos', 'miembros', 'own', true, NOW(), NOW()),

-- Gestionar miembros de equipos relacionados
('equipos.miembros.gestionar.team', 'Gestionar miembros de equipos relacionados', 'equipos', 'miembros', 'team', true, NOW(), NOW()),

-- Gestionar miembros de cualquier equipo
('equipos.miembros.gestionar.all', 'Gestionar miembros de cualquier equipo', 'equipos', 'miembros', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA ASIGNAR ROLES EN EQUIPOS
-- ============================================

-- Asignar roles en equipos que gestiono
('equipos.roles.asignar.own', 'Asignar roles en mis equipos', 'equipos', 'roles', 'own', true, NOW(), NOW()),

-- Asignar roles en cualquier equipo
('equipos.roles.asignar.all', 'Asignar roles en cualquier equipo', 'equipos', 'roles', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA ELIMINAR EQUIPOS
-- ============================================

-- Eliminar equipos (acción crítica, generalmente solo administradores)
('equipos.eliminar.all', 'Eliminar equipos', 'equipos', 'eliminar', 'all', true, NOW(), NOW()),

-- ============================================
-- PERMISOS PARA REPORTES Y MÉTRICAS DE EQUIPOS
-- ============================================

-- Ver reportes de mis equipos
('equipos.reportes.ver.own', 'Ver reportes de mis equipos', 'equipos', 'reportes', 'own', true, NOW(), NOW()),

-- Ver reportes de equipos relacionados
('equipos.reportes.ver.team', 'Ver reportes de equipos relacionados', 'equipos', 'reportes', 'team', true, NOW(), NOW()),

-- Ver reportes de todos los equipos
('equipos.reportes.ver.all', 'Ver reportes de todos los equipos', 'equipos', 'reportes', 'all', true, NOW(), NOW())

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ASIGNACIÓN DE PERMISOS A ROLES EXISTENTES
-- ============================================

-- Obtener IDs de roles existentes
DO $$
DECLARE
    admin_role_id UUID;
    supervisor_role_id UUID;
    usuario_role_id UUID;
BEGIN
    -- Obtener ID del rol Administrador
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrador' LIMIT 1;
    
    -- Obtener ID del rol Supervisor
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'Supervisor' LIMIT 1;
    
    -- Obtener ID del rol Usuario
    SELECT id INTO usuario_role_id FROM roles WHERE name = 'Usuario' LIMIT 1;

    -- PERMISOS PARA ADMINISTRADOR (acceso completo a equipos)
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT admin_role_id, p.id
        FROM permissions p
        WHERE p.module = 'equipos'
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Administrador';
    END IF;

    -- PERMISOS PARA SUPERVISOR (gestión limitada)
    IF supervisor_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT supervisor_role_id, p.id
        FROM permissions p
        WHERE p.module = 'equipos' 
        AND p.name IN (
            -- Ver equipos
            'equipos.ver.own',
            'equipos.ver.team',
            'equipos.ver.all',
            -- Gestionar miembros de sus equipos
            'equipos.miembros.gestionar.own',
            'equipos.miembros.gestionar.team',
            -- Asignar roles en sus equipos
            'equipos.roles.asignar.own',
            -- Editar equipos que gestiona
            'equipos.editar.own',
            -- Ver reportes
            'equipos.reportes.ver.own',
            'equipos.reportes.ver.team',
            'equipos.reportes.ver.all'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Supervisor';
    END IF;

    -- PERMISOS PARA USUARIO (solo visualización)
    IF usuario_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT usuario_role_id, p.id
        FROM permissions p
        WHERE p.module = 'equipos' 
        AND p.name IN (
            -- Solo ver sus equipos
            'equipos.ver.own',
            -- Ver reportes de sus equipos
            'equipos.reportes.ver.own'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de equipos asignados al rol Usuario';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================

-- Verificar que todos los permisos se insertaron correctamente
DO $$
DECLARE
    permisos_count INTEGER;
    roles_asignados INTEGER;
BEGIN
    -- Contar permisos del módulo equipos
    SELECT COUNT(*) INTO permisos_count 
    FROM permissions 
    WHERE module = 'equipos';
    
    -- Contar asignaciones de roles para permisos de equipos
    SELECT COUNT(*) INTO roles_asignados
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE p.module = 'equipos';
    
    RAISE NOTICE 'Migración de permisos de equipos completada:';
    RAISE NOTICE '- Permisos creados: %', permisos_count;
    RAISE NOTICE '- Asignaciones de roles: %', roles_asignados;
    
    -- Verificar que se crearon al menos los permisos básicos
    IF permisos_count < 10 THEN
        RAISE EXCEPTION 'Error: No se crearon suficientes permisos de equipos (esperados: >=10, encontrados: %)', permisos_count;
    END IF;
END $$;

-- Mostrar resumen de permisos creados
SELECT 
    module,
    action,
    scope,
    COUNT(*) as cantidad
FROM permissions 
WHERE module = 'equipos'
GROUP BY module, action, scope
ORDER BY action, scope;