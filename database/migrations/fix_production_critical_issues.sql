-- =========================================
-- MIGRACIÓN URGENTE: SOLUCIONAR ERRORES DE PRODUCCIÓN
-- Fecha: 2025-12-16
-- Descripción: Solucionan problemas críticos del enum audit_logs_action y permisos de métricas
-- =========================================

-- 1. ARREGLAR EL ENUM audit_logs_action_enum
-- Agregar el valor 'LOGIN' al enum si no existe

DO $$
BEGIN
    -- Verificar si LOGIN ya existe en el enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'LOGIN' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        -- Agregar LOGIN al enum
        ALTER TYPE audit_logs_action_enum ADD VALUE IF NOT EXISTS 'LOGIN';
        RAISE NOTICE 'Valor LOGIN agregado al enum audit_logs_action_enum';
    ELSE
        RAISE NOTICE 'El valor LOGIN ya existe en audit_logs_action_enum';
    END IF;

    -- Verificar si LOGOUT ya existe en el enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'LOGOUT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        -- Agregar LOGOUT al enum
        ALTER TYPE audit_logs_action_enum ADD VALUE IF NOT EXISTS 'LOGOUT';
        RAISE NOTICE 'Valor LOGOUT agregado al enum audit_logs_action_enum';
    ELSE
        RAISE NOTICE 'El valor LOGOUT ya existe en audit_logs_action_enum';
    END IF;

    -- Verificar si LOGOUT_ALL ya existe en el enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'LOGOUT_ALL' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        -- Agregar LOGOUT_ALL al enum
        ALTER TYPE audit_logs_action_enum ADD VALUE IF NOT EXISTS 'LOGOUT_ALL';
        RAISE NOTICE 'Valor LOGOUT_ALL agregado al enum audit_logs_action_enum';
    ELSE
        RAISE NOTICE 'El valor LOGOUT_ALL ya existe en audit_logs_action_enum';
    END IF;

    -- Verificar si FORCE_LOGOUT ya existe en el enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'FORCE_LOGOUT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        -- Agregar FORCE_LOGOUT al enum
        ALTER TYPE audit_logs_action_enum ADD VALUE IF NOT EXISTS 'FORCE_LOGOUT';
        RAISE NOTICE 'Valor FORCE_LOGOUT agregado al enum audit_logs_action_enum';
    ELSE
        RAISE NOTICE 'El valor FORCE_LOGOUT ya existe en audit_logs_action_enum';
    END IF;
END
$$;

-- 2. CREAR PERMISOS FALTANTES PARA MÉTRICAS
-- Insertar permisos que faltan según el controlador DashboardMetricsController

INSERT INTO permissions (name, description, module, action, scope) VALUES
-- Permisos de métricas faltantes
('metrics.cases.read.own', 'Ver métricas de casos propios', 'metrics', 'read', 'own'),
('metrics.cases.read.team', 'Ver métricas de casos del equipo', 'metrics', 'read', 'team'),
('metrics.cases.read.all', 'Ver métricas de todos los casos', 'metrics', 'read', 'all'),

('metrics.time.read.own', 'Ver métricas de tiempo propias', 'metrics', 'read', 'own'),
('metrics.time.read.team', 'Ver métricas de tiempo del equipo', 'metrics', 'read', 'team'), 
('metrics.time.read.all', 'Ver métricas de tiempo de todos', 'metrics', 'read', 'all'),

('metrics.general.read.own', 'Ver métricas generales propias', 'metrics', 'read', 'own'),
('metrics.general.read.team', 'Ver métricas generales del equipo', 'metrics', 'read', 'team'),
('metrics.general.read.all', 'Ver métricas generales de todos', 'metrics', 'read', 'all'),

('metrics.status.read.own', 'Ver métricas de estados propios', 'metrics', 'read', 'own'),
('metrics.status.read.team', 'Ver métricas de estados del equipo', 'metrics', 'read', 'team'),
('metrics.status.read.all', 'Ver métricas de estados de todos', 'metrics', 'read', 'all'),

('metrics.applications.read.own', 'Ver métricas de aplicaciones propias', 'metrics', 'read', 'own'),
('metrics.applications.read.team', 'Ver métricas de aplicaciones del equipo', 'metrics', 'read', 'team'), 
('metrics.applications.read.all', 'Ver métricas de aplicaciones de todos', 'metrics', 'read', 'all'),

('metrics.performance.read.own', 'Ver métricas de rendimiento propias', 'metrics', 'read', 'own'),
('metrics.performance.read.team', 'Ver métricas de rendimiento del equipo', 'metrics', 'read', 'team'),
('metrics.performance.read.all', 'Ver métricas de rendimiento de todos', 'metrics', 'read', 'all'),

('metrics.users.read.own', 'Ver métricas de usuarios propias', 'metrics', 'read', 'own'),
('metrics.users.read.team', 'Ver métricas de usuarios del equipo', 'metrics', 'read', 'team'),
('metrics.users.read.all', 'Ver métricas de usuarios de todos', 'metrics', 'read', 'all'),

-- Permisos de dashboard genérico
('dashboard.read.own', 'Acceder al dashboard propio', 'dashboard', 'read', 'own'),
('dashboard.read.team', 'Acceder al dashboard del equipo', 'dashboard', 'read', 'team'),
('dashboard.read.all', 'Acceder a todos los dashboards', 'dashboard', 'read', 'all')

ON CONFLICT (name) DO NOTHING;

-- 3. ASIGNAR PERMISOS AL ROL "Analista de Aplicaciones"
-- Primero obtenemos el ID del rol "Analista de Aplicaciones"

DO $$
DECLARE
    analista_role_id UUID;
    supervisor_role_id UUID;
    admin_role_id UUID;
    perm_record RECORD;
BEGIN
    -- Obtener IDs de los roles
    SELECT id INTO analista_role_id FROM roles WHERE name = 'Analista de Aplicaciones';
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'Supervisor';  
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrador';

    IF analista_role_id IS NULL THEN
        RAISE NOTICE 'No se encontró el rol "Analista de Aplicaciones"';
    ELSE
        RAISE NOTICE 'Rol "Analista de Aplicaciones" encontrado: %', analista_role_id;
        
        -- Asignar permisos "own" al Analista de Aplicaciones
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT analista_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'metrics.cases.read.own',
            'metrics.time.read.own', 
            'metrics.general.read.own',
            'metrics.status.read.own',
            'metrics.applications.read.own',
            'metrics.performance.read.own',
            'metrics.users.read.own',
            'dashboard.read.own'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos "own" asignados al Analista de Aplicaciones';
    END IF;

    -- Asignar permisos "team" al Supervisor
    IF supervisor_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT supervisor_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'metrics.cases.read.team',
            'metrics.time.read.team', 
            'metrics.general.read.team',
            'metrics.status.read.team',
            'metrics.applications.read.team',
            'metrics.performance.read.team',
            'metrics.users.read.team',
            'dashboard.read.team'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos "team" asignados al Supervisor';
    END IF;

    -- Asignar permisos "all" al Administrador
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT admin_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'metrics.cases.read.all',
            'metrics.time.read.all', 
            'metrics.general.read.all',
            'metrics.status.read.all',
            'metrics.applications.read.all',
            'metrics.performance.read.all',
            'metrics.users.read.all',
            'dashboard.read.all'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos "all" asignados al Administrador';
    END IF;
END
$$;

-- 4. VERIFICACIONES FINALES
-- Mostrar estado actual del enum
SELECT 
    'Valores actuales del enum audit_logs_action_enum:' as info,
    enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

-- Verificar permisos de métricas por rol
SELECT 
    r.name as rol,
    COUNT(DISTINCT p.id) as total_permisos_metrics,
    string_agg(DISTINCT p.scope, ', ') as scopes_disponibles
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'metrics'
GROUP BY r.id, r.name
ORDER BY r.name;

-- Verificar permisos específicos del rol Analista de Aplicaciones
SELECT 
    'Permisos de métricas del Analista de Aplicaciones:' as info,
    p.name as permiso,
    p.description as descripcion
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones' 
  AND p.module IN ('metrics', 'dashboard')
ORDER BY p.module, p.name;

-- Listo para aplicar en producción
SELECT 'MIGRACIÓN COMPLETADA - READY PARA PRODUCCIÓN' as status;