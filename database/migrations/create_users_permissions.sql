-- =========================================
-- PERMISOS DEL MÓDULO DE USUARIOS
-- Fecha: 2025-08-29
-- Descripción: Crear permisos específicos para gestión de usuarios
-- =========================================

-- Insertar permisos para el módulo de Usuarios
INSERT INTO permissions (name, description, module, action, scope) VALUES
-- Permisos de visualización
('users:view:own', 'Ver su propio perfil de usuario', 'users', 'view', 'own'),
('users:view:team', 'Ver usuarios del mismo equipo', 'users', 'view', 'team'),
('users:view:all', 'Ver todos los usuarios del sistema', 'users', 'view', 'all'),

-- Permisos de creación
('users:create:own', 'Crear su propio perfil (registro)', 'users', 'create', 'own'),
('users:create:team', 'Crear usuarios para el equipo', 'users', 'create', 'team'),
('users:create:all', 'Crear cualquier usuario en el sistema', 'users', 'create', 'all'),

-- Permisos de edición
('users:edit:own', 'Editar su propio perfil', 'users', 'edit', 'own'),
('users:edit:team', 'Editar usuarios del mismo equipo', 'users', 'edit', 'team'),
('users:edit:all', 'Editar cualquier usuario del sistema', 'users', 'edit', 'all'),

-- Permisos de eliminación
('users:delete:own', 'Eliminar su propio perfil', 'users', 'delete', 'own'),
('users:delete:team', 'Eliminar usuarios del mismo equipo', 'users', 'delete', 'team'),
('users:delete:all', 'Eliminar cualquier usuario del sistema', 'users', 'delete', 'all'),

-- Permisos especiales de gestión de usuarios
('users:manage:passwords', 'Gestionar contraseñas de usuarios', 'users', 'manage', 'all'),
('users:manage:roles', 'Asignar y cambiar roles de usuarios', 'users', 'manage', 'all'),
('users:manage:status', 'Activar/desactivar usuarios', 'users', 'manage', 'all'),
('users:manage:permissions', 'Gestionar permisos específicos de usuarios', 'users', 'manage', 'all'),

-- Permisos de reportes y auditoría
('users:report:team', 'Ver reportes de usuarios del equipo', 'users', 'report', 'team'),
('users:report:all', 'Ver reportes de todos los usuarios', 'users', 'report', 'all'),
('users:audit:all', 'Ver auditoría de cambios en usuarios', 'users', 'audit', 'all')

ON CONFLICT (name) DO NOTHING;

-- Asignar permisos básicos al rol Usuario
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Usuario' 
AND p.name IN (
    'users:view:own',
    'users:edit:own'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Asignar permisos de supervisión al rol Supervisor
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Supervisor' 
AND p.name IN (
    'users:view:own',
    'users:view:team',
    'users:edit:own',
    'users:edit:team',
    'users:create:team',
    'users:manage:status',
    'users:report:team'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Asignar permisos completos al rol Administrador
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Administrador' 
AND p.module = 'users'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Verificar los permisos insertados
SELECT 
    p.name,
    p.description,
    p.module,
    p.action,
    p.scope
FROM permissions p 
WHERE p.module = 'users'
ORDER BY p.action, p.scope;
