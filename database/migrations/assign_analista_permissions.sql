-- Asignar permisos al rol "Analista de Aplicaciones"
-- Este rol debe poder gestionar sus propios casos, notas, TODOs y ver métricas propias

DO $$
DECLARE
    analista_role_id UUID;
    perm_id UUID;
BEGIN
    -- Obtener el ID del rol "Analista de Aplicaciones"
    SELECT id INTO analista_role_id 
    FROM roles 
    WHERE name = 'Analista de Aplicaciones';
    
    IF analista_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol "Analista de Aplicaciones" no encontrado';
    END IF;
    
    RAISE NOTICE 'Asignando permisos al rol: Analista de Aplicaciones (ID: %)', analista_role_id;
    
    -- Permisos para CASOS (own scope)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'cases' 
        AND scope = 'own' 
        AND action IN ('view', 'create', 'edit', 'update', 'delete')
    LOOP
        INSERT INTO role_permissions ("roleId", "permissionId") 
        VALUES (analista_role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Permisos para NOTAS (own scope)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'notes' 
        AND scope = 'own' 
        AND action IN ('view', 'create', 'edit', 'update', 'delete')
    LOOP
        INSERT INTO role_permissions ("roleId", "permissionId") 
        VALUES (analista_role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Permisos para TODOS (own scope)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'todos' 
        AND scope = 'own' 
        AND action IN ('view', 'create', 'edit', 'update', 'delete')
    LOOP
        INSERT INTO role_permissions ("roleId", "permissionId") 
        VALUES (analista_role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Permisos para DASHBOARD/MÉTRICAS (own scope)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'dashboard' 
        AND scope = 'own' 
        AND action IN ('view', 'read')
    LOOP
        INSERT INTO role_permissions ("roleId", "permissionId") 
        VALUES (analista_role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Permisos adicionales que podría necesitar
    -- Permiso para ver base de conocimientos (lectura)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'knowledge' 
        AND scope = 'own' 
        AND action IN ('read', 'view')
    LOOP
        INSERT INTO role_permissions ("roleId", "permissionId") 
        VALUES (analista_role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Permisos asignados exitosamente';
END
$$;

-- Verificar los permisos asignados
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.module,
    p.action,
    p.scope,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones'
ORDER BY p.module, p.action, p.scope;