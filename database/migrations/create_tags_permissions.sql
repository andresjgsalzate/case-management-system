-- Crear permisos para el sistema de etiquetas
-- Script de migración para agregar permisos de etiquetas

-- Insertar permisos para el sistema de etiquetas
INSERT INTO permissions (name, description, module, action, scope, "createdAt", "updatedAt") VALUES
('tags.read', 'Permite ver y listar etiquetas del sistema', 'tags', 'read', 'all', NOW(), NOW()),
('tags.create', 'Permite crear nuevas etiquetas', 'tags', 'create', 'all', NOW(), NOW()),
('tags.update', 'Permite modificar etiquetas existentes', 'tags', 'update', 'all', NOW(), NOW()),
('tags.delete', 'Permite eliminar etiquetas del sistema', 'tags', 'delete', 'all', NOW(), NOW()),
('tags.manage', 'Acceso completo al sistema de gestión de etiquetas', 'tags', 'manage', 'all', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos básicos de etiquetas a roles existentes
-- Los administradores obtienen todos los permisos
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN ('tags.read', 'tags.create', 'tags.update', 'tags.delete', 'tags.manage')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Los editores obtienen permisos de lectura, creación y actualización
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('editor', 'moderator')
AND p.name IN ('tags.read', 'tags.create', 'tags.update')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Los usuarios normales obtienen solo permisos de lectura
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('user', 'viewer')
AND p.name = 'tags.read'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Verificar que los permisos se crearon correctamente
SELECT 
  p.name,
  p.module,
  p.action,
  p.description
FROM permissions p
WHERE p.name LIKE 'tags.%'
ORDER BY p.name;

-- Verificar asignaciones de permisos por rol
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.name LIKE 'tags.%'
ORDER BY r.name, p.name;
