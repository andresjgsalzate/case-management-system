-- =========================================
-- SOLUCIÓN PARA EL PROBLEMA: Analista de Aplicaciones no puede ver módulo de casos
-- Fecha: 2025-12-17
-- Problema: El rol "Analista de Aplicaciones" tiene permisos de create/update/delete
-- pero le faltan los permisos de VIEW (visualización) que requiere el frontend
-- =========================================

BEGIN;

-- 1. PRIMERO VERIFICAMOS QUE EXISTAN LOS PERMISOS DE VISUALIZACIÓN DE CASOS
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'cases.view.own', 'Ver casos propios', 'cases', 'view', 'own', NOW(), NOW()),
    (gen_random_uuid(), 'cases.view.team', 'Ver casos del equipo', 'cases', 'view', 'team', NOW(), NOW()),
    (gen_random_uuid(), 'cases.view.all', 'Ver todos los casos', 'cases', 'view', 'all', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- También necesitamos permisos para el control de casos
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'case_control.view.own', 'Ver control de casos propios', 'case_control', 'view', 'own', NOW(), NOW()),
    (gen_random_uuid(), 'case_control.view.team', 'Ver control de casos del equipo', 'case_control', 'view', 'team', NOW(), NOW()),
    (gen_random_uuid(), 'case_control.view.all', 'Ver control de todos los casos', 'case_control', 'view', 'all', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. ASIGNAR PERMISOS DE VISUALIZACIÓN AL ROL "Analista de Aplicaciones"
DO $$
DECLARE
    analista_role_id UUID;
    permission_count INTEGER := 0;
BEGIN
    -- Obtener ID del rol "Analista de Aplicaciones"
    SELECT id INTO analista_role_id FROM roles WHERE name = 'Analista de Aplicaciones';
    
    IF analista_role_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el rol "Analista de Aplicaciones"';
    END IF;

    -- Asignar permisos de visualización de casos (scope "own")
    INSERT INTO role_permissions ("roleId", "permissionId")
    SELECT analista_role_id, p.id
    FROM permissions p
    WHERE p.name IN (
        'cases.view.own',
        'case_control.view.own'
    )
    AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp 
        WHERE rp."roleId" = analista_role_id 
        AND rp."permissionId" = p.id
    );
    
    GET DIAGNOSTICS permission_count = ROW_COUNT;
    
    RAISE NOTICE 'Asignados % permisos de visualización al Analista de Aplicaciones', permission_count;
END
$$;

-- 3. VERIFICAR QUE EL ROL TENGA TODOS LOS PERMISOS NECESARIOS PARA CASOS
SELECT 
    'VERIFICACIÓN: Permisos del Analista de Aplicaciones para módulo de casos' as info,
    r.name as rol,
    p.name as permiso,
    p.description as descripcion,
    p.scope as alcance
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones' 
  AND (p.module = 'cases' OR p.module = 'case_control')
ORDER BY p.module, p.action, p.scope;

-- 4. VERIFICAR SI PUEDE ACCEDER AL FRONTEND
SELECT 
    'ESTADO DE ACCESO AL FRONTEND' as verificacion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM roles r
            JOIN role_permissions rp ON r.id = rp."roleId"
            JOIN permissions p ON rp."permissionId" = p.id
            WHERE r.name = 'Analista de Aplicaciones' 
            AND p.name IN ('cases.view.own', 'cases.view.team', 'cases.view.all')
        ) THEN '✅ PUEDE VER MÓDULO DE CASOS'
        ELSE '❌ NO PUEDE VER MÓDULO DE CASOS'
    END as estado_casos,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM roles r
            JOIN role_permissions rp ON r.id = rp."roleId"
            JOIN permissions p ON rp."permissionId" = p.id
            WHERE r.name = 'Analista de Aplicaciones' 
            AND p.name IN ('case_control.view.own', 'case_control.view.team', 'case_control.view.all')
        ) THEN '✅ PUEDE VER CONTROL DE CASOS'
        ELSE '❌ NO PUEDE VER CONTROL DE CASOS'
    END as estado_control;

COMMIT;

-- 5. MENSAJE FINAL
SELECT '🎯 SOLUCIÓN COMPLETADA: El rol "Analista de Aplicaciones" ahora debe poder ver el módulo de control de casos' as resultado;