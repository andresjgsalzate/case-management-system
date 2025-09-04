-- =========================================
-- MIGRACIÓN: PERMISOS PARA DASHBOARD
-- Fecha: 2025-09-03
-- Descripción: Agregar permisos específicos para el módulo de dashboard
-- =========================================

-- Insertar permisos específicos para el dashboard
INSERT INTO permissions (name, description, module, action, scope) VALUES

-- Dashboard - Lectura de métricas propias
('dashboard.read.own', 'Ver métricas propias del dashboard', 'dashboard', 'read', 'own'),

-- Dashboard - Lectura de métricas del equipo  
('dashboard.read.team', 'Ver métricas del equipo en el dashboard', 'dashboard', 'read', 'team'),

-- Dashboard - Lectura de todas las métricas
('dashboard.read.all', 'Ver todas las métricas del dashboard', 'dashboard', 'read', 'all'),

-- Dashboard - Exportar métricas
('dashboard.export.team', 'Exportar métricas del equipo', 'dashboard', 'export', 'team'),
('dashboard.export.all', 'Exportar todas las métricas', 'dashboard', 'export', 'all'),

-- Dashboard - Gestionar métricas
('dashboard.manage.all', 'Gestionar configuración de métricas', 'dashboard', 'manage', 'all'),

-- Métricas de tiempo - permisos específicos
('metrics.time.read.own', 'Ver métricas de tiempo propias', 'metrics', 'read', 'own'),
('metrics.time.read.team', 'Ver métricas de tiempo del equipo', 'metrics', 'read', 'team'),
('metrics.time.read.all', 'Ver todas las métricas de tiempo', 'metrics', 'read', 'all'),

-- Métricas de usuarios
('metrics.users.read.team', 'Ver métricas de usuarios del equipo', 'metrics', 'read', 'team'),
('metrics.users.read.all', 'Ver métricas de todos los usuarios', 'metrics', 'read', 'all'),

-- Métricas de casos
('metrics.cases.read.own', 'Ver métricas de casos propios', 'metrics', 'read', 'own'),
('metrics.cases.read.team', 'Ver métricas de casos del equipo', 'metrics', 'read', 'team'),
('metrics.cases.read.all', 'Ver métricas de todos los casos', 'metrics', 'read', 'all'),

-- Métricas de estados
('metrics.status.read.team', 'Ver métricas por estado del equipo', 'metrics', 'read', 'team'),
('metrics.status.read.all', 'Ver métricas por estado de todos', 'metrics', 'read', 'all'),

-- Métricas de aplicaciones
('metrics.applications.read.team', 'Ver métricas de aplicaciones del equipo', 'metrics', 'read', 'team'),
('metrics.applications.read.all', 'Ver métricas de todas las aplicaciones', 'metrics', 'read', 'all'),

-- Métricas de TODOs
('metrics.todos.read.own', 'Ver métricas de TODOs propios', 'metrics', 'read', 'own'),
('metrics.todos.read.team', 'Ver métricas de TODOs del equipo', 'metrics', 'read', 'team'),
('metrics.todos.read.all', 'Ver métricas de todos los TODOs', 'metrics', 'read', 'all')

ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles existentes

-- ROL ADMINISTRADOR: Todos los permisos
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Administrador' 
  AND p.module IN ('dashboard', 'metrics')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ROL SUPERVISOR: Permisos de equipo y algunos específicos
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Supervisor' 
  AND p.name IN (
    'dashboard.read.own',
    'dashboard.read.team', 
    'dashboard.export.team',
    'metrics.time.read.own',
    'metrics.time.read.team',
    'metrics.users.read.team',
    'metrics.cases.read.own',
    'metrics.cases.read.team',
    'metrics.status.read.team',
    'metrics.applications.read.team',
    'metrics.todos.read.own',
    'metrics.todos.read.team'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ROL USUARIO: Solo permisos propios
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Usuario' 
  AND p.name IN (
    'dashboard.read.own',
    'metrics.time.read.own',
    'metrics.cases.read.own',
    'metrics.todos.read.own'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Crear vista para facilitar consultas de permisos por usuario
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u."fullName",
    r.name as role_name,
    p.name as permission_name,
    p.description as permission_description,
    p.module,
    p.action,
    p.scope
FROM users u
JOIN roles r ON u."roleId" = r.id
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p."isActive" = true;

-- Crear función para verificar permisos de usuario
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id_param UUID,
    module_param VARCHAR(50),
    action_param VARCHAR(20),
    scope_param VARCHAR(10) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN DEFAULT FALSE;
BEGIN
    SELECT COUNT(*) > 0 INTO has_permission
    FROM user_permissions up
    WHERE up.user_id = user_id_param
      AND up.module = module_param
      AND up.action = action_param
      AND (scope_param IS NULL OR up.scope = scope_param OR up.scope = 'all');
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener permisos de dashboard de un usuario
CREATE OR REPLACE FUNCTION get_user_dashboard_permissions(user_id_param UUID)
RETURNS TABLE(
    can_read_own BOOLEAN,
    can_read_team BOOLEAN,
    can_read_all BOOLEAN,
    can_export_metrics BOOLEAN,
    can_manage_metrics BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        user_has_permission(user_id_param, 'dashboard', 'read', 'own') as can_read_own,
        user_has_permission(user_id_param, 'dashboard', 'read', 'team') as can_read_team,
        user_has_permission(user_id_param, 'dashboard', 'read', 'all') as can_read_all,
        user_has_permission(user_id_param, 'dashboard', 'export') as can_export_metrics,
        user_has_permission(user_id_param, 'dashboard', 'manage') as can_manage_metrics;
END;
$$ LANGUAGE plpgsql;

-- Verificar que los permisos se insertaron correctamente
SELECT 
    'Permisos de Dashboard creados:' as status,
    COUNT(*) as total_permissions
FROM permissions 
WHERE module IN ('dashboard', 'metrics');

-- Verificar asignación de permisos por rol
SELECT 
    r.name as role_name,
    COUNT(rp."permissionId") as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module IN ('dashboard', 'metrics') OR p.module IS NULL
GROUP BY r.name
ORDER BY r.name;
