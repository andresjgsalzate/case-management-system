-- Script para crear permisos de gestión de roles
-- Se ejecuta después de tener la estructura de permisos básica

-- Permisos para gestión de roles
INSERT INTO permissions (id, name, description, is_active) VALUES
-- Permisos de visualización
('e1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6', 'roles:view:own', 'Ver roles propios', true),
('f2b3c4d5-e6f7-8g9h-0i1j-k2l3m4n5o6p7', 'roles:view:team', 'Ver roles del equipo', true),
('a3b4c5d6-f7g8-9h0i-1j2k-l3m4n5o6p7q8', 'roles:view:all', 'Ver todos los roles', true),

-- Permisos de creación
('b4c5d6e7-g8h9-0i1j-2k3l-m4n5o6p7q8r9', 'roles:create:all', 'Crear nuevos roles', true),

-- Permisos de edición
('c5d6e7f8-h9i0-1j2k-3l4m-n5o6p7q8r9s0', 'roles:edit:own', 'Editar roles propios', true),
('d6e7f8g9-i0j1-2k3l-4m5n-o6p7q8r9s0t1', 'roles:edit:team', 'Editar roles del equipo', true),
('e7f8g9h0-j1k2-3l4m-5n6o-p7q8r9s0t1u2', 'roles:edit:all', 'Editar todos los roles', true),

-- Permisos de eliminación
('f8g9h0i1-k2l3-4m5n-6o7p-q8r9s0t1u2v3', 'roles:delete:all', 'Eliminar roles', true),

-- Permisos de gestión avanzada
('g9h0i1j2-l3m4-5n6o-7p8q-r9s0t1u2v3w4', 'roles:manage:permissions', 'Gestionar permisos de roles', true),
('h0i1j2k3-m4n5-6o7p-8q9r-s0t1u2v3w4x5', 'roles:manage:status', 'Cambiar estado de roles', true),
('i1j2k3l4-n5o6-7p8q-9r0s-t1u2v3w4x5y6', 'roles:clone:all', 'Clonar roles', true),

-- Permisos de reportes y auditoría
('j2k3l4m5-o6p7-8q9r-0s1t-u2v3w4x5y6z7', 'roles:report:all', 'Generar reportes de roles', true),
('k3l4m5n6-p7q8-9r0s-1t2u-v3w4x5y6z7a8', 'roles:audit:all', 'Auditar actividad de roles', true)

ON CONFLICT (name) DO NOTHING;

-- Asignar TODOS los permisos de roles al rol de Administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r, permissions p
WHERE r.name = 'Administrador' 
AND p.name LIKE 'roles:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Asignar permisos limitados al rol Supervisor para roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r, permissions p
WHERE r.name = 'Supervisor' 
AND p.name IN (
    'roles:view:all',
    'roles:view:team',
    'roles:report:all'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- El rol Usuario no tiene permisos de gestión de roles por defecto
-- El rol Moderador no tiene permisos de gestión de roles por defecto

-- Verificar los permisos creados
SELECT 
    p.name,
    p.description,
    COUNT(rp.role_id) as assigned_roles
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE p.name LIKE 'roles:%'
GROUP BY p.id, p.name, p.description
ORDER BY p.name;
