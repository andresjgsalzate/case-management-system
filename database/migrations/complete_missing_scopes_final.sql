-- Migración final para completar al 100% los scopes faltantes
-- Generado por validación exhaustiva del 2025-11-27
-- Total de permisos faltantes: 36
-- Estado actual: 71% -> Objetivo: 100%

BEGIN;

-- case_statuses module (2 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'case_statuses.reorder.own',
  'Permiso para reorder case_statuses con scope own',
  'case_statuses',
  'reorder',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'case_statuses.reorder.team',
  'Permiso para reorder case_statuses con scope team',
  'case_statuses',
  'reorder',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- cases module (1 permiso faltante)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'cases.assign.own',
  'Permiso para assign cases con scope own',
  'cases',
  'assign',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- dashboard module (3 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'dashboard.manage.own',
  'Permiso para manage dashboard con scope own',
  'dashboard',
  'manage',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'dashboard.manage.team',
  'Permiso para manage dashboard con scope team',
  'dashboard',
  'manage',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'dashboard.manage.all',
  'Permiso para manage dashboard con scope all',
  'dashboard',
  'manage',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- knowledge module (3 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge.attachments.own',
  'Permiso para attachments knowledge con scope own',
  'knowledge',
  'attachments',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge.attachments.team',
  'Permiso para attachments knowledge con scope team',
  'knowledge',
  'attachments',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge.attachments.all',
  'Permiso para attachments knowledge con scope all',
  'knowledge',
  'attachments',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- knowledge_feedback module (8 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.create.team',
  'Permiso para create knowledge_feedback con scope team',
  'knowledge_feedback',
  'create',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.create.all',
  'Permiso para create knowledge_feedback con scope all',
  'knowledge_feedback',
  'create',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.delete.team',
  'Permiso para delete knowledge_feedback con scope team',
  'knowledge_feedback',
  'delete',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.delete.all',
  'Permiso para delete knowledge_feedback con scope all',
  'knowledge_feedback',
  'delete',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.read.own',
  'Permiso para read knowledge_feedback con scope own',
  'knowledge_feedback',
  'read',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.read.team',
  'Permiso para read knowledge_feedback con scope team',
  'knowledge_feedback',
  'read',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.update.team',
  'Permiso para update knowledge_feedback con scope team',
  'knowledge_feedback',
  'update',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_feedback.update.all',
  'Permiso para update knowledge_feedback con scope all',
  'knowledge_feedback',
  'update',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- knowledge_types module (8 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.create.own',
  'Permiso para create knowledge_types con scope own',
  'knowledge_types',
  'create',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.create.team',
  'Permiso para create knowledge_types con scope team',
  'knowledge_types',
  'create',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.delete.own',
  'Permiso para delete knowledge_types con scope own',
  'knowledge_types',
  'delete',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.delete.team',
  'Permiso para delete knowledge_types con scope team',
  'knowledge_types',
  'delete',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.read.own',
  'Permiso para read knowledge_types con scope own',
  'knowledge_types',
  'read',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.read.team',
  'Permiso para read knowledge_types con scope team',
  'knowledge_types',
  'read',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.update.own',
  'Permiso para update knowledge_types con scope own',
  'knowledge_types',
  'update',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'knowledge_types.update.team',
  'Permiso para update knowledge_types con scope team',
  'knowledge_types',
  'update',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- metrics module (11 permisos faltantes)
INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.applications.own',
  'Permiso para applications metrics con scope own',
  'metrics',
  'applications',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.cases.team',
  'Permiso para cases metrics con scope team',
  'metrics',
  'cases',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.todos.own',
  'Permiso para todos metrics con scope own',
  'metrics',
  'todos',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.todos.team',
  'Permiso para todos metrics con scope team',
  'metrics',
  'todos',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.todos.all',
  'Permiso para todos metrics con scope all',
  'metrics',
  'todos',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.users.own',
  'Permiso para users metrics con scope own',
  'metrics',
  'users',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.users.team',
  'Permiso para users metrics con scope team',
  'metrics',
  'users',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.users.all',
  'Permiso para users metrics con scope all',
  'metrics',
  'users',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.time.own',
  'Permiso para time metrics con scope own',
  'metrics',
  'time',
  'own',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.time.team',
  'Permiso para time metrics con scope team',
  'metrics',
  'time',
  'team',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'metrics.time.all',
  'Permiso para time metrics con scope all',
  'metrics',
  'time',
  'all',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Verificación final
SELECT 
  'Migración completada - Total de permisos:' as status,
  COUNT(*) as total_permissions
FROM permissions;

SELECT 
  'Distribución por scope:' as info,
  scope,
  COUNT(*) as count
FROM permissions 
GROUP BY scope 
ORDER BY scope;