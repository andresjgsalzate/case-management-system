-- =========================================
-- SCRIPT DE DIAGNÓSTICO PRE-MIGRACIÓN
-- Ejecutar ANTES de aplicar fix_production_critical_issues.sql
-- =========================================

-- 1. VERIFICAR ESTADO ACTUAL DEL ENUM audit_logs_action_enum
SELECT 
    'DIAGNÓSTICO: Estado actual del enum audit_logs_action_enum' as info;

SELECT 
    enumlabel as valores_existentes,
    enumsortorder as orden
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

-- Verificar si los valores problemáticos existen
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LOGIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum'))
        THEN '✓ LOGIN existe en el enum'
        ELSE '✗ LOGIN NO EXISTE - NECESITA SER AGREGADO'
    END as login_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LOGOUT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum'))
        THEN '✓ LOGOUT existe en el enum' 
        ELSE '✗ LOGOUT NO EXISTE - NECESITA SER AGREGADO'
    END as logout_status;

-- 2. VERIFICAR PERMISOS DE MÉTRICAS EXISTENTES
SELECT 
    'DIAGNÓSTICO: Permisos de métricas existentes' as info;

SELECT 
    module,
    action, 
    scope,
    COUNT(*) as cantidad
FROM permissions 
WHERE module IN ('metrics', 'dashboard')
GROUP BY module, action, scope
ORDER BY module, action, scope;

-- 3. VERIFICAR PERMISOS DEL ROL "Analista de Aplicaciones"
SELECT 
    'DIAGNÓSTICO: Permisos actuales del Analista de Aplicaciones' as info;

SELECT 
    r.name as rol,
    p.module,
    p.action,
    p.scope,
    COUNT(*) as permisos_count
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones'
  AND p.module IN ('metrics', 'dashboard', 'cases')
GROUP BY r.name, p.module, p.action, p.scope
ORDER BY p.module, p.action, p.scope;

-- 4. VERIFICAR PERMISOS FALTANTES ESPECÍFICOS
SELECT 
    'DIAGNÓSTICO: Permisos faltantes críticos' as info;

SELECT 
    missing_permission,
    CASE 
        WHEN EXISTS (SELECT 1 FROM permissions WHERE name = missing_permission)
        THEN '✓ Existe en permissions'
        ELSE '✗ NO EXISTE - NECESITA CREARSE'
    END as permission_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM roles r 
            JOIN role_permissions rp ON r.id = rp."roleId"
            JOIN permissions p ON rp."permissionId" = p.id
            WHERE r.name = 'Analista de Aplicaciones' 
            AND p.name = missing_permission
        )
        THEN '✓ Asignado al rol'
        ELSE '✗ NO ASIGNADO AL ROL'
    END as assignment_status
FROM (VALUES 
    ('metrics.cases.read.own'),
    ('metrics.status.read.own'),
    ('metrics.applications.read.own'),
    ('metrics.time.read.own'),
    ('metrics.general.read.own'),
    ('dashboard.read.own')
) as missing(missing_permission);

-- 5. VERIFICAR LOGS DE AUDITORÍA PROBLEMÁTICOS
SELECT 
    'DIAGNÓSTICO: Logs de auditoría con errores recientes' as info;

-- Buscar errores relacionados con LOGIN en los logs de aplicación
-- (Esta query no funcionará si la tabla no existe debido al error de enum)
SELECT 
    'Verificando si existen logs con action LOGIN que causen problemas...' as info;

-- 6. VERIFICAR USUARIO ESPECÍFICO DEL ERROR
SELECT 
    'DIAGNÓSTICO: Usuario con problemas de permisos' as info;

SELECT 
    up.id,
    up."fullName",
    up.email,
    r.name as role_name,
    COUNT(DISTINCT p.id) as total_permissions,
    COUNT(DISTINCT CASE WHEN p.module = 'metrics' THEN p.id END) as metrics_permissions
FROM user_profiles up
LEFT JOIN roles r ON up."roleId" = r.id
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE up.email = 'hjurgensen@todosistemassti.co'
GROUP BY up.id, up."fullName", up.email, r.name;

-- Mostrar los permisos específicos de métricas que tiene el usuario
SELECT 
    'Permisos específicos de métricas del usuario:' as info,
    p.name as permiso_actual,
    p.action,
    p.scope
FROM user_profiles up
JOIN roles r ON up."roleId" = r.id
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE up.email = 'hjurgensen@todosistemassti.co'
  AND p.module = 'metrics'
ORDER BY p.name;

-- 7. RESUMEN DEL DIAGNÓSTICO
SELECT 
    'RESUMEN DEL DIAGNÓSTICO:' as titulo,
    'Ejecutar fix_production_critical_issues.sql para solucionar problemas' as accion_requerida;