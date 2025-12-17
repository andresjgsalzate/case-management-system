-- ===============================================
-- DEPLOYMENT PARA PRODUCCIÓN - 17 DICIEMBRE 2025
-- ===============================================
-- Este script contiene todas las correcciones y cambios necesarios
-- para resolver los problemas de métricas del dashboard y permisos

-- ADVERTENCIA: Ejecutar en horario de mantenimiento
-- Hacer backup completo antes de ejecutar

BEGIN;

-- ===============================================
-- 1. VERIFICACIONES PREVIAS
-- ===============================================

-- Verificar que estamos en la base de datos correcta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'Base de datos incorrecta - tabla user_profiles no encontrada';
    END IF;
    RAISE NOTICE 'Verificación de base de datos: OK';
END
$$;

-- ===============================================
-- 2. LIMPIEZA DE PERMISOS DUPLICADOS Y OBSOLETOS
-- ===============================================

-- Limpiar permisos duplicados de métricas con formato incorrecto
DELETE FROM role_permissions 
WHERE "permissionId" IN (
    SELECT id FROM permissions 
    WHERE name LIKE 'metrics.%.read.%'
    AND name NOT IN ('metrics.read.own', 'metrics.read.team', 'metrics.read.all')
);

DELETE FROM permissions 
WHERE name LIKE 'metrics.%.read.%'
AND name NOT IN ('metrics.read.own', 'metrics.read.team', 'metrics.read.all');

-- Limpiar permisos con nombres en español o formato obsoleto
DELETE FROM role_permissions 
WHERE "permissionId" IN (
    SELECT id FROM permissions 
    WHERE (name LIKE '%gestión%' OR name LIKE '%administración%' OR name LIKE '%administrar%' 
           OR name LIKE '%crear%' OR name LIKE '%ver%' OR name LIKE '%editar%' 
           OR name LIKE '%eliminar%' OR name LIKE '%leer%')
);

DELETE FROM permissions 
WHERE (name LIKE '%gestión%' OR name LIKE '%administración%' OR name LIKE '%administrar%' 
       OR name LIKE '%crear%' OR name LIKE '%ver%' OR name LIKE '%editar%' 
       OR name LIKE '%eliminar%' OR name LIKE '%leer%');

-- Limpiar permisos con formato incorrecto (doble punto, espacios, etc.)
DELETE FROM role_permissions 
WHERE "permissionId" IN (
    SELECT id FROM permissions 
    WHERE name LIKE '%.%.%.%' OR name LIKE '% %' OR name LIKE '%..%'
);

DELETE FROM permissions 
WHERE name LIKE '%.%.%.%' OR name LIKE '% %' OR name LIKE '%..%';

-- Limpiar permisos duplicados por variaciones de nombre
DELETE FROM role_permissions rp1
WHERE EXISTS (
    SELECT 1 FROM role_permissions rp2 
    JOIN permissions p1 ON rp1."permissionId" = p1.id
    JOIN permissions p2 ON rp2."permissionId" = p2.id
    WHERE rp1."roleId" = rp2."roleId" 
    AND rp1."permissionId" != rp2."permissionId"
    AND (
        (p1.name = 'cases.read.own' AND p2.name = 'cases.view.own') OR
        (p1.name = 'dashboard.read.own' AND p2.name = 'dashboard.view.own') OR
        (p1.name = 'todos.read.own' AND p2.name = 'todos.view.own') OR
        (p1.name = 'notes.read.own' AND p2.name = 'notes.view.own')
    )
    AND p1.id < p2.id  -- Mantener el más reciente
);

-- Asegurar que existen los permisos básicos de métricas
INSERT INTO permissions (name, description, module, action, scope, "isActive")
VALUES 
    ('metrics.read.own', 'View own metrics', 'metrics', 'read', 'own', true),
    ('metrics.read.team', 'View team metrics', 'metrics', 'read', 'team', true),
    ('metrics.read.all', 'View all metrics', 'metrics', 'read', 'all', true),
    ('metrics.users.own', 'View own user metrics', 'metrics', 'users', 'own', true),
    ('metrics.users.team', 'View team user metrics', 'metrics', 'users', 'team', true),
    ('metrics.users.all', 'View all user metrics', 'metrics', 'users', 'all', true)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- 3. ASIGNAR PERMISOS AL ROL ANALISTA DE APLICACIONES
-- ===============================================

DO $$
DECLARE
    analista_role_id UUID;
    perm_id UUID;
    permission_names TEXT[] := ARRAY[
        'metrics.read.own',
        'metrics.users.own',
        'cases.view.own',
        'cases.create.own',
        'cases.edit.own',
        'cases.update.own', 
        'cases.delete.own',
        'todos.view.own',
        'todos.create.own',
        'todos.edit.own',
        'todos.update.own',
        'todos.delete.own',
        'notes.view.own',
        'notes.create.own',
        'notes.edit.own',
        'notes.update.own',
        'notes.delete.own',
        'dashboard.view.own'
    ];
    perm_name TEXT;
BEGIN
    -- Obtener el ID del rol "Analista de Aplicaciones"
    SELECT id INTO analista_role_id 
    FROM roles 
    WHERE name = 'Analista de Aplicaciones';
    
    IF analista_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol "Analista de Aplicaciones" no encontrado';
    END IF;
    
    RAISE NOTICE 'Asignando permisos al rol: Analista de Aplicaciones (ID: %)', analista_role_id;
    
    -- Asignar cada permiso necesario
    FOREACH perm_name IN ARRAY permission_names
    LOOP
        SELECT id INTO perm_id 
        FROM permissions 
        WHERE name = perm_name;
        
        IF perm_id IS NOT NULL THEN
            INSERT INTO role_permissions ("roleId", "permissionId") 
            VALUES (analista_role_id, perm_id)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Permiso asignado: %', perm_name;
        ELSE
            RAISE WARNING 'Permiso no encontrado: %', perm_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Permisos asignados exitosamente al rol Analista de Aplicaciones';
END
$$;

-- ===============================================
-- 4. ASEGURAR PERMISOS PARA SUPERVISORES
-- ===============================================

DO $$
DECLARE
    supervisor_role_id UUID;
    perm_id UUID;
    permission_names TEXT[] := ARRAY[
        'metrics.read.team',
        'metrics.users.team',
        'cases.view.team',
        'todos.view.team',
        'notes.view.team'
    ];
    perm_name TEXT;
BEGIN
    -- Obtener el ID del rol "Supervisor"
    SELECT id INTO supervisor_role_id 
    FROM roles 
    WHERE name ILIKE '%supervisor%' OR name ILIKE '%jefe%'
    LIMIT 1;
    
    IF supervisor_role_id IS NOT NULL THEN
        RAISE NOTICE 'Asignando permisos de equipo al rol supervisor (ID: %)', supervisor_role_id;
        
        -- Asignar permisos de equipo
        FOREACH perm_name IN ARRAY permission_names
        LOOP
            SELECT id INTO perm_id 
            FROM permissions 
            WHERE name = perm_name;
            
            IF perm_id IS NOT NULL THEN
                INSERT INTO role_permissions ("roleId", "permissionId") 
                VALUES (supervisor_role_id, perm_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Permisos de equipo asignados al supervisor';
    ELSE
        RAISE NOTICE 'No se encontró rol de supervisor';
    END IF;
END
$$;

-- ===============================================
-- 5. ASEGURAR PERMISOS PARA ADMINISTRADORES
-- ===============================================

DO $$
DECLARE
    admin_role_id UUID;
    perm_id UUID;
BEGIN
    -- Obtener el ID del rol de administrador
    SELECT id INTO admin_role_id 
    FROM roles 
    WHERE name ILIKE '%admin%' OR name = 'CMS Admin'
    LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        RAISE NOTICE 'Asignando permisos completos al administrador (ID: %)', admin_role_id;
        
        -- Asignar todos los permisos de métricas al admin
        FOR perm_id IN 
            SELECT id FROM permissions 
            WHERE name LIKE 'metrics.%' OR name = 'admin.full'
        LOOP
            INSERT INTO role_permissions ("roleId", "permissionId") 
            VALUES (admin_role_id, perm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Permisos completos asignados al administrador';
    ELSE
        RAISE NOTICE 'No se encontró rol de administrador';
    END IF;
END
$$;

-- ===============================================
-- 6. LIMPIEZA ADICIONAL DE DATOS OBSOLETOS
-- ===============================================

-- Limpiar role_permissions huérfanos (sin rol o permiso válido)
DELETE FROM role_permissions 
WHERE "roleId" NOT IN (SELECT id FROM roles WHERE "isActive" = true)
OR "permissionId" NOT IN (SELECT id FROM permissions WHERE "isActive" = true);

-- Limpiar permisos inactivos no utilizados
DELETE FROM permissions 
WHERE "isActive" = false 
AND id NOT IN (SELECT "permissionId" FROM role_permissions);

-- Eliminar sesiones expiradas y datos temporales
DELETE FROM user_sessions 
WHERE "expires_at" < NOW() - INTERVAL '7 days';

-- Limpiar archivos de build antiguos en la aplicación (esto se hará manualmente)
-- Limpiar logs antiguos de debugging (esto se hará manualmente)

-- ===============================================
-- 7. OPTIMIZACIONES DE RENDIMIENTO
-- ===============================================

-- Actualizar estadísticas (REINDEX omitido por permisos)
-- NOTA: REINDEX requiere permisos de superusuario, se puede ejecutar manualmente si es necesario
ANALYZE role_permissions;
ANALYZE permissions;
ANALYZE roles;
ANALYZE user_profiles;

-- ===============================================
-- 8. VERIFICACIONES FINALES
-- ===============================================

-- Verificar que el rol Analista de Aplicaciones tiene los permisos correctos
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count
    FROM roles r
    JOIN role_permissions rp ON r.id = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.name = 'Analista de Aplicaciones'
    AND p.name IN ('metrics.read.own', 'cases.view.own');
    
    IF perm_count >= 2 THEN
        RAISE NOTICE 'Verificación: Rol Analista de Aplicaciones configurado correctamente';
    ELSE
        RAISE WARNING 'Verificación: Faltan permisos en rol Analista de Aplicaciones';
    END IF;
END
$$;

-- Detectar posibles duplicados restantes
SELECT 
    'DUPLICADOS DETECTADOS' as alerta,
    r.name as rol,
    p1.name as permiso1, 
    p2.name as permiso2
FROM role_permissions rp1
JOIN role_permissions rp2 ON rp1."roleId" = rp2."roleId" AND rp1."permissionId" != rp2."permissionId"
JOIN permissions p1 ON rp1."permissionId" = p1.id
JOIN permissions p2 ON rp2."permissionId" = p2.id
JOIN roles r ON rp1."roleId" = r.id
WHERE (p1.module = p2.module AND p1.scope = p2.scope AND p1.action != p2.action AND p1.action IN ('read', 'view') AND p2.action IN ('read', 'view'))
OR (p1.name SIMILAR TO '%\.(create|edit|update)\.%' AND p2.name SIMILAR TO '%\.(create|edit|update)\.%' AND p1.module = p2.module AND p1.scope = p2.scope)
LIMIT 10;

-- Mostrar resumen de permisos por rol
SELECT 
    r.name as role_name,
    COUNT(p.id) as total_permissions,
    COUNT(CASE WHEN p.name LIKE 'metrics.%' THEN 1 END) as metrics_permissions,
    COUNT(CASE WHEN p.name LIKE 'cases.%' THEN 1 END) as cases_permissions,
    COUNT(CASE WHEN p.name LIKE 'dashboard.%' THEN 1 END) as dashboard_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- ===============================================
-- COMMIT FINAL
-- ===============================================

COMMIT;

-- ===============================================
-- INSTRUCCIONES POST-DEPLOYMENT
-- ===============================================

/*
PASOS MANUALES DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. BACKEND:
   - Reiniciar el servidor Node.js
   - Verificar logs: tail -f backend/logs/combined.log
   - Probar endpoint: curl -H "Authorization: Bearer <token>" http://localhost:3000/api/metrics/users/time

2. FRONTEND:
   - Limpiar cache del navegador (Ctrl+Shift+R)
   - Verificar que las métricas del dashboard cargan correctamente
   - Probar login/logout funcionan correctamente

3. MONITOREO:
   - Verificar que no hay errores 500 en dashboard
   - Confirmar que métricas propias se muestran para Analista de Aplicaciones
   - Verificar que usuarios no autorizados no pueden ver métricas de otros

4. ROLLBACK (si es necesario):
   - Restaurar backup de base de datos
   - Revertir cambios en DashboardMetricsController.ts

ARCHIVOS MODIFICADOS EN APLICACIÓN:
- backend/src/controllers/DashboardMetricsController.ts (permisos actualizados)
- frontend/src/services/dashboardMetrics.service.ts (debugging mejorado)
- frontend/src/services/security.service.ts (validación de tokens mejorada)

*/