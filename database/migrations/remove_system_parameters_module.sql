-- =============================================
-- Script de eliminación del módulo de parámetros del sistema
-- Fecha: 2025-12-15
-- Descripción: Elimina todas las tablas, permisos y referencias relacionadas con system-parameters
-- =============================================

-- 1. Eliminar permisos relacionados con system-parameters
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions 
    WHERE scope LIKE '%system-parameters%' OR resource LIKE '%system-parameters%'
);

-- 2. Eliminar permisos del módulo system-parameters
DELETE FROM permissions 
WHERE scope LIKE '%system-parameters%' OR resource LIKE '%system-parameters%';

-- 3. Eliminar tabla de auditoría si existe
DROP TABLE IF EXISTS system_parameter_audit CASCADE;

-- 4. Eliminar tabla principal si existe
DROP TABLE IF EXISTS system_parameters CASCADE;

-- 5. Limpiar cualquier referencia en otras tablas (si las hubiera)
-- (Por ahora no hay referencias externas conocidas)

-- Mostrar confirmación
SELECT 'Módulo system-parameters eliminado completamente' AS resultado;