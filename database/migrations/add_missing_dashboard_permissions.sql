-- =========================================
-- MIGRACIÓN: PERMISOS FALTANTES PARA DASHBOARD
-- Fecha: 2024-09-19
-- Descripción: Agregar permisos faltantes de scope 'own' para el dashboard
-- =========================================

-- Insertar permisos faltantes con scope 'own'
INSERT INTO permissions (name, description, module, action, scope) VALUES

-- Métricas generales - scope own
('metrics.general.read.own', 'Ver métricas generales propias', 'metrics', 'read', 'own'),

-- Métricas de estados - scope own
('metrics.status.read.own', 'Ver métricas de estados propios', 'metrics', 'read', 'own'),

-- Métricas de aplicaciones - scope own
('metrics.applications.read.own', 'Ver métricas de aplicaciones propias', 'metrics', 'read', 'own'),

-- Métricas de rendimiento - scope own  
('metrics.performance.read.own', 'Ver métricas de rendimiento propias', 'metrics', 'read', 'own')

ON CONFLICT (name) DO NOTHING;

-- Asignar permisos 'own' a todos los roles (Usuario, Supervisor, Administrador)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE p.name IN (
    'metrics.general.read.own',
    'metrics.status.read.own', 
    'metrics.applications.read.own',
    'metrics.performance.read.own'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Verificar que los permisos se insertaron correctamente
SELECT 
    'Permisos faltantes agregados:' as status,
    COUNT(*) as total_new_permissions
FROM permissions 
WHERE module = 'metrics' 
  AND scope = 'own'
  AND name IN (
    'metrics.general.read.own',
    'metrics.status.read.own', 
    'metrics.applications.read.own',
    'metrics.performance.read.own'
  );

-- Verificar asignación de permisos por rol
SELECT 
    r.name as role_name,
    COUNT(rp."permissionId") as total_own_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'metrics' AND p.scope = 'own'
GROUP BY r.name
ORDER BY r.name;