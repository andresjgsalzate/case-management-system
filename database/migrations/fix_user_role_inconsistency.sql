-- ===============================================
-- Script: Corregir inconsistencia entre roleId y roleName en user_profiles
-- Descripción: Este script sincroniza el roleId y roleName para todos los usuarios
--              asegurando que ambos campos coincidan con el mismo rol de la tabla roles
-- Fecha: 2026-05-13
-- ===============================================

-- Paso 1: Verificar los usuarios con inconsistencia (solo para diagnóstico)
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM user_profiles up
    LEFT JOIN roles r ON up."roleId" = r.id
    WHERE up."roleId" IS NOT NULL 
      AND (r.name IS NULL OR r.name != up."roleName");
    
    RAISE NOTICE 'Usuarios con inconsistencia encontrados: %', inconsistent_count;
END $$;

-- Paso 2: Actualizar roleId basándose en roleName cuando el roleId no corresponde
UPDATE user_profiles up
SET "roleId" = r.id,
    "updatedAt" = CURRENT_TIMESTAMP
FROM roles r
WHERE up."roleName" = r.name
  AND (up."roleId" IS NULL OR up."roleId" != r.id);

-- Paso 3: Actualizar roleName basándose en roleId cuando el roleId existe pero el nombre no coincide
UPDATE user_profiles up
SET "roleName" = r.name,
    "updatedAt" = CURRENT_TIMESTAMP
FROM roles r
WHERE up."roleId" = r.id
  AND up."roleName" != r.name;

-- Paso 4: Para usuarios sin roleId pero con roleName, asignar el roleId correcto
UPDATE user_profiles up
SET "roleId" = r.id,
    "updatedAt" = CURRENT_TIMESTAMP
FROM roles r
WHERE up."roleId" IS NULL
  AND up."roleName" = r.name;

-- Paso 5: Para usuarios con roleId pero sin roleName, asignar el roleName correcto
UPDATE user_profiles up
SET "roleName" = r.name,
    "updatedAt" = CURRENT_TIMESTAMP
FROM roles r
WHERE up."roleId" = r.id
  AND (up."roleName" IS NULL OR up."roleName" = '');

-- Paso 6: Verificar resultados
DO $$
DECLARE
    fixed_count INTEGER;
    remaining_issues INTEGER;
BEGIN
    -- Contar registros ahora sincronizados
    SELECT COUNT(*) INTO fixed_count
    FROM user_profiles up
    INNER JOIN roles r ON up."roleId" = r.id
    WHERE up."roleName" = r.name;
    
    -- Contar registros que aún tienen problemas
    SELECT COUNT(*) INTO remaining_issues
    FROM user_profiles up
    LEFT JOIN roles r ON up."roleId" = r.id
    WHERE up."roleId" IS NOT NULL 
      AND (r.name IS NULL OR r.name != up."roleName");
    
    RAISE NOTICE 'Usuarios corregidos exitosamente: %', fixed_count;
    RAISE NOTICE 'Usuarios con problemas restantes: %', remaining_issues;
    
    IF remaining_issues > 0 THEN
        RAISE WARNING 'Aún hay % usuarios con inconsistencias. Revisar manualmente.', remaining_issues;
    ELSE
        RAISE NOTICE '✓ Todos los usuarios tienen roleId y roleName sincronizados correctamente.';
    END IF;
END $$;

-- Paso 7: Mostrar usuarios específicos que fueron corregidos (para auditoría)
SELECT 
    up.id,
    up.email,
    up."fullName",
    up."roleId",
    up."roleName" as current_role_name,
    r.name as role_table_name,
    CASE 
        WHEN up."roleName" = r.name THEN 'Sincronizado ✓'
        ELSE 'Inconsistente ✗'
    END as status
FROM user_profiles up
LEFT JOIN roles r ON up."roleId" = r.id
ORDER BY up."updatedAt" DESC
LIMIT 50;

-- Verificación específica para el usuario mencionado
SELECT 
    up.id,
    up.email,
    up."fullName",
    up."roleId",
    up."roleName" as user_role_name,
    r.id as role_id_from_table,
    r.name as role_name_from_table,
    CASE 
        WHEN up."roleId" = r.id AND up."roleName" = r.name THEN 'CORRECTO ✓'
        ELSE 'INCONSISTENTE ✗'
    END as verification_status
FROM user_profiles up
LEFT JOIN roles r ON up."roleId" = r.id
WHERE up.email = 'henry.jurgensen@alpopular.com.co';
