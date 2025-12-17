-- =========================================
-- AGREGAR PERMISOS DE CREACIÓN DE CASOS
-- Fecha: 2025-12-16
-- =========================================

-- 1. AGREGAR PERMISOS DE CREACIÓN DE CASOS
INSERT INTO permissions (name, description, module, action, scope) VALUES
-- Permisos de casos
('cases.create.own', 'Crear casos propios', 'cases', 'create', 'own'),
('cases.create.team', 'Crear casos para el equipo', 'cases', 'create', 'team'),
('cases.create.all', 'Crear casos para todos', 'cases', 'create', 'all'),

-- Permisos de edición de casos
('cases.update.own', 'Editar casos propios', 'cases', 'update', 'own'),
('cases.update.team', 'Editar casos del equipo', 'cases', 'update', 'team'),
('cases.update.all', 'Editar todos los casos', 'cases', 'update', 'all'),

-- Permisos de eliminación de casos
('cases.delete.own', 'Eliminar casos propios', 'cases', 'delete', 'own'),
('cases.delete.team', 'Eliminar casos del equipo', 'cases', 'delete', 'team'),
('cases.delete.all', 'Eliminar todos los casos', 'cases', 'delete', 'all')

ON CONFLICT (name) DO NOTHING;

-- 2. ASIGNAR PERMISOS AL ROL "Analista de Aplicaciones"
DO $$
DECLARE
    analista_role_id UUID;
    supervisor_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Obtener IDs de los roles
    SELECT id INTO analista_role_id FROM roles WHERE name = 'Analista de Aplicaciones';
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'Supervisor';  
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrador';

    IF analista_role_id IS NOT NULL THEN
        -- Asignar permisos "own" al Analista de Aplicaciones
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT analista_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'cases.create.own',
            'cases.update.own',
            'cases.delete.own'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de casos "own" asignados al Analista de Aplicaciones';
    END IF;

    -- Asignar permisos "team" al Supervisor
    IF supervisor_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT supervisor_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'cases.create.team',
            'cases.update.team',
            'cases.delete.team'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de casos "team" asignados al Supervisor';
    END IF;

    -- Asignar permisos "all" al Administrador
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT admin_role_id, p.id
        FROM permissions p
        WHERE p.name IN (
            'cases.create.all',
            'cases.update.all',
            'cases.delete.all'
        )
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
        
        RAISE NOTICE 'Permisos de casos "all" asignados al Administrador';
    END IF;
END
$$;

-- 3. VERIFICACIÓN FINAL
SELECT 
    'Permisos de casos del Analista de Aplicaciones:' as info,
    p.name as permiso,
    p.description as descripcion
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones' 
  AND p.module = 'cases'
ORDER BY p.action, p.scope;

SELECT 'PERMISOS DE CASOS AGREGADOS CORRECTAMENTE' as status;