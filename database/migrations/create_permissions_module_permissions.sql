-- =========================================
-- PERMISOS PARA EL MÓDULO DE GESTIÓN DE PERMISOS
-- =========================================

-- Permisos para gestión de permisos
INSERT INTO permissions (name, description, resource, action, scope, is_active) VALUES
-- Lectura de permisos
('permissions.read_all', 'Ver todos los permisos del sistema', 'permissions', 'read', 'all', true),
('permissions.read_structure', 'Ver estructura de permisos por módulos', 'permissions', 'read_structure', 'all', true),

-- Creación de permisos
('permissions.create_all', 'Crear nuevos permisos', 'permissions', 'create', 'all', true),

-- Actualización de permisos
('permissions.update_all', 'Actualizar permisos existentes', 'permissions', 'update', 'all', true),

-- Eliminación de permisos
('permissions.delete_all', 'Eliminar permisos', 'permissions', 'delete', 'all', true),

-- Gestión de asignaciones
('permissions.assign_roles', 'Asignar permisos a roles', 'permissions', 'assign', 'all', true),
('permissions.manage_assignments', 'Gestionar todas las asignaciones de permisos', 'permissions', 'manage', 'all', true),

-- Administración completa
('permissions.admin_all', 'Administración completa de permisos', 'permissions', 'admin', 'all', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Asignar los nuevos permisos al rol Administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
  AND p.resource = 'permissions'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
