-- =========================================
-- MIGRACIÓN: CORREGIR PERMISOS DE AUDITORÍA - SOLO ADMINISTRADOR
-- Fecha: 2025-09-16
-- Descripción: Remover permisos de auditoría de todos los roles excepto Administrador
-- =========================================

-- Eliminar todos los permisos de auditoría de roles que no sean Administrador
DELETE FROM role_permissions 
WHERE "permissionId" IN (
    SELECT id FROM permissions WHERE module = 'audit'
) 
AND "roleId" NOT IN (
    SELECT id FROM roles WHERE name = 'Administrador'
);

-- Asegurar que el rol Administrador tenga todos los permisos de auditoría
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Administrador' 
  AND p.module = 'audit'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Verificar el resultado
SELECT 
    r.name as rol,
    p.name as permiso,
    p.description as descripcion
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions p ON p.id = rp."permissionId"
WHERE p.module = 'audit'
ORDER BY r.name, p.name;

SELECT 'Permisos de auditoría configurados solo para Administrador' as resultado;
