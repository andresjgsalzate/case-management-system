-- Asignar permisos de etiquetas a los roles existentes
-- Script de migración para asignar permisos de etiquetas a roles

-- Los administradores obtienen todos los permisos
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
AND p.name IN ('tags.read', 'tags.create', 'tags.update', 'tags.delete', 'tags.manage')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

-- Los moderadores y supervisores obtienen permisos de lectura, creación y actualización
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Moderador', 'Supervisor')
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
WHERE r.name = 'Usuario'
AND p.name = 'tags.read'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
);

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
