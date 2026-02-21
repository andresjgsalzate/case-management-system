-- Assign Knowledge Review/Approve Permissions to Roles

-- Get permission IDs for review and approve
-- Administrador gets: knowledge.review.all, knowledge.approve.all
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p.id, NOW()
FROM permissions p
WHERE p.name IN ('knowledge.review.all', 'knowledge.approve.all')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = '00000000-0000-0000-0000-000000000001'::uuid AND rp."permissionId" = p.id
);

-- Analista de Aplicaciones gets: knowledge.review.own
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT '49eee68f-ff93-4c0c-a064-f4a14894c598'::uuid, p.id, NOW()
FROM permissions p
WHERE p.name = 'knowledge.review.own'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = '49eee68f-ff93-4c0c-a064-f4a14894c598'::uuid AND rp."permissionId" = p.id
);

-- Verify role permissions assignment
SELECT r.name as role_name, p.name as permission_name, p.action, p.scope
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions p ON p.id = rp."permissionId"
WHERE p.action IN ('review', 'approve') AND p.module = 'knowledge'
ORDER BY r.name, p.name;
