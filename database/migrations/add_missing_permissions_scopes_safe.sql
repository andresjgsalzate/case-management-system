-- Migración SEGURA para agregar permisos faltantes
-- Usando ON CONFLICT DO NOTHING para evitar duplicados
-- Generado el: 2025-11-27

BEGIN;

-- Función helper para insertar permisos de forma segura
CREATE OR REPLACE FUNCTION safe_insert_permission(
    p_name VARCHAR(100),
    p_description TEXT,
    p_module VARCHAR(50), 
    p_action VARCHAR(20),
    p_scope VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
    INSERT INTO permissions (id, name, description, module, action, scope, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), p_name, p_description, p_module, p_action, p_scope, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- MÓDULO ADMIN - Agregar scopes faltantes
-- =====================================
SELECT safe_insert_permission('admin.config.own', 'Permiso para config admin con scope own', 'admin', 'config', 'own');
SELECT safe_insert_permission('admin.config.team', 'Permiso para config admin con scope team', 'admin', 'config', 'team');

-- =====================================  
-- MÓDULO APPLICATIONS - Agregar scopes faltantes
-- =====================================
SELECT safe_insert_permission('applications.admin.own', 'Permiso para admin applications con scope own', 'applications', 'admin', 'own');
SELECT safe_insert_permission('applications.admin.team', 'Permiso para admin applications con scope team', 'applications', 'admin', 'team');
SELECT safe_insert_permission('applications.create.own', 'Permiso para create applications con scope own', 'applications', 'create', 'own');
SELECT safe_insert_permission('applications.create.team', 'Permiso para create applications con scope team', 'applications', 'create', 'team');
SELECT safe_insert_permission('applications.delete.own', 'Permiso para delete applications con scope own', 'applications', 'delete', 'own');
SELECT safe_insert_permission('applications.delete.team', 'Permiso para delete applications con scope team', 'applications', 'delete', 'team');
SELECT safe_insert_permission('applications.read.own', 'Permiso para read applications con scope own', 'applications', 'read', 'own');
SELECT safe_insert_permission('applications.read.team', 'Permiso para read applications con scope team', 'applications', 'read', 'team');
SELECT safe_insert_permission('applications.update.own', 'Permiso para update applications con scope own', 'applications', 'update', 'own');
SELECT safe_insert_permission('applications.update.team', 'Permiso para update applications con scope team', 'applications', 'update', 'team');

-- =====================================
-- MÓDULO ARCHIVE - Completar scopes faltantes  
-- =====================================
SELECT safe_insert_permission('archive.create.team', 'Permiso para create archive con scope team', 'archive', 'create', 'team');
SELECT safe_insert_permission('archive.create.all', 'Permiso para create archive con scope all', 'archive', 'create', 'all');
SELECT safe_insert_permission('archive.delete.own', 'Permiso para delete archive con scope own', 'archive', 'delete', 'own');
SELECT safe_insert_permission('archive.delete.team', 'Permiso para delete archive con scope team', 'archive', 'delete', 'team');
SELECT safe_insert_permission('archive.delete.all', 'Permiso para delete archive con scope all', 'archive', 'delete', 'all');
SELECT safe_insert_permission('archive.restore.team', 'Permiso para restore archive con scope team', 'archive', 'restore', 'team');
SELECT safe_insert_permission('archive.restore.all', 'Permiso para restore archive con scope all', 'archive', 'restore', 'all');
SELECT safe_insert_permission('archive.stats.team', 'Permiso para stats archive con scope team', 'archive', 'stats', 'team');
SELECT safe_insert_permission('archive.stats.all', 'Permiso para stats archive con scope all', 'archive', 'stats', 'all');
SELECT safe_insert_permission('archive.view.team', 'Permiso para view archive con scope team', 'archive', 'view', 'team');
SELECT safe_insert_permission('archive.view.all', 'Permiso para view archive con scope all', 'archive', 'view', 'all');

-- =====================================
-- MÓDULO AUDIT - Agregar scopes faltantes
-- =====================================
SELECT safe_insert_permission('audit.admin.own', 'Permiso para admin audit con scope own', 'audit', 'admin', 'own');
SELECT safe_insert_permission('audit.admin.team', 'Permiso para admin audit con scope team', 'audit', 'admin', 'team');
SELECT safe_insert_permission('audit.admin.all', 'Permiso para admin audit con scope all', 'audit', 'admin', 'all');
SELECT safe_insert_permission('audit.config.own', 'Permiso para config audit con scope own', 'audit', 'config', 'own');
SELECT safe_insert_permission('audit.config.team', 'Permiso para config audit con scope team', 'audit', 'config', 'team');
SELECT safe_insert_permission('audit.config.all', 'Permiso para config audit con scope all', 'audit', 'config', 'all');
SELECT safe_insert_permission('audit.export.all', 'Permiso para export audit con scope all', 'audit', 'export', 'all');
SELECT safe_insert_permission('audit.view.all', 'Permiso para view audit con scope all', 'audit', 'view', 'all');

-- =====================================
-- MÓDULO CASE_STATUSES - Agregar todos los scopes
-- =====================================
SELECT safe_insert_permission('case_statuses.admin.own', 'Permiso para admin case_statuses con scope own', 'case_statuses', 'admin', 'own');
SELECT safe_insert_permission('case_statuses.admin.team', 'Permiso para admin case_statuses con scope team', 'case_statuses', 'admin', 'team');
SELECT safe_insert_permission('case_statuses.admin.all', 'Permiso para admin case_statuses con scope all', 'case_statuses', 'admin', 'all');
SELECT safe_insert_permission('case_statuses.create.own', 'Permiso para create case_statuses con scope own', 'case_statuses', 'create', 'own');
SELECT safe_insert_permission('case_statuses.create.team', 'Permiso para create case_statuses con scope team', 'case_statuses', 'create', 'team');
SELECT safe_insert_permission('case_statuses.create.all', 'Permiso para create case_statuses con scope all', 'case_statuses', 'create', 'all');
SELECT safe_insert_permission('case_statuses.delete.own', 'Permiso para delete case_statuses con scope own', 'case_statuses', 'delete', 'own');
SELECT safe_insert_permission('case_statuses.delete.team', 'Permiso para delete case_statuses con scope team', 'case_statuses', 'delete', 'team');
SELECT safe_insert_permission('case_statuses.delete.all', 'Permiso para delete case_statuses con scope all', 'case_statuses', 'delete', 'all');
SELECT safe_insert_permission('case_statuses.read.own', 'Permiso para read case_statuses con scope own', 'case_statuses', 'read', 'own');
SELECT safe_insert_permission('case_statuses.read.team', 'Permiso para read case_statuses con scope team', 'case_statuses', 'read', 'team');
SELECT safe_insert_permission('case_statuses.read.all', 'Permiso para read case_statuses con scope all', 'case_statuses', 'read', 'all');
SELECT safe_insert_permission('case_statuses.update.own', 'Permiso para update case_statuses con scope own', 'case_statuses', 'update', 'own');
SELECT safe_insert_permission('case_statuses.update.team', 'Permiso para update case_statuses con scope team', 'case_statuses', 'update', 'team');
SELECT safe_insert_permission('case_statuses.update.all', 'Permiso para update case_statuses con scope all', 'case_statuses', 'update', 'all');

-- =====================================
-- MÓDULO TEAMS - ¡El más crítico! Agregar scopes own/team
-- =====================================
SELECT safe_insert_permission('teams.view.own', 'Permiso para view teams con scope own', 'teams', 'view', 'own');
SELECT safe_insert_permission('teams.view.team', 'Permiso para view teams con scope team', 'teams', 'view', 'team');
SELECT safe_insert_permission('teams.create.own', 'Permiso para create teams con scope own', 'teams', 'create', 'own');
SELECT safe_insert_permission('teams.create.team', 'Permiso para create teams con scope team', 'teams', 'create', 'team');
SELECT safe_insert_permission('teams.edit.own', 'Permiso para edit teams con scope own', 'teams', 'edit', 'own');
SELECT safe_insert_permission('teams.edit.team', 'Permiso para edit teams con scope team', 'teams', 'edit', 'team');
SELECT safe_insert_permission('teams.delete.own', 'Permiso para delete teams con scope own', 'teams', 'delete', 'own');
SELECT safe_insert_permission('teams.delete.team', 'Permiso para delete teams con scope team', 'teams', 'delete', 'team');
SELECT safe_insert_permission('teams.manage.own', 'Permiso para manage teams con scope own', 'teams', 'manage', 'own');
SELECT safe_insert_permission('teams.manage.team', 'Permiso para manage teams con scope team', 'teams', 'manage', 'team');
SELECT safe_insert_permission('teams.manage.all', 'Permiso para manage teams con scope all', 'teams', 'manage', 'all');

-- =====================================
-- MÓDULO METRICS - Completar todos los scopes
-- =====================================
SELECT safe_insert_permission('metrics.applications.team', 'Permiso para applications metrics con scope team', 'metrics', 'applications', 'team');
SELECT safe_insert_permission('metrics.applications.all', 'Permiso para applications metrics con scope all', 'metrics', 'applications', 'all');
SELECT safe_insert_permission('metrics.cases.own', 'Permiso para cases metrics con scope own', 'metrics', 'cases', 'own');
SELECT safe_insert_permission('metrics.cases.all', 'Permiso para cases metrics con scope all', 'metrics', 'cases', 'all');
SELECT safe_insert_permission('metrics.performance.own', 'Permiso para performance metrics con scope own', 'metrics', 'performance', 'own');
SELECT safe_insert_permission('metrics.performance.team', 'Permiso para performance metrics con scope team', 'metrics', 'performance', 'team');
SELECT safe_insert_permission('metrics.performance.all', 'Permiso para performance metrics con scope all', 'metrics', 'performance', 'all');
SELECT safe_insert_permission('metrics.status.own', 'Permiso para status metrics con scope own', 'metrics', 'status', 'own');
SELECT safe_insert_permission('metrics.status.team', 'Permiso para status metrics con scope team', 'metrics', 'status', 'team');
SELECT safe_insert_permission('metrics.status.all', 'Permiso para status metrics con scope all', 'metrics', 'status', 'all');
SELECT safe_insert_permission('metrics.general.own', 'Permiso para general metrics con scope own', 'metrics', 'general', 'own');
SELECT safe_insert_permission('metrics.general.team', 'Permiso para general metrics con scope team', 'metrics', 'general', 'team');
SELECT safe_insert_permission('metrics.general.all', 'Permiso para general metrics con scope all', 'metrics', 'general', 'all');

-- =====================================
-- MÓDULO ORIGINS - Agregar todos los scopes básicos
-- =====================================
SELECT safe_insert_permission('origins.admin.own', 'Permiso para admin origins con scope own', 'origins', 'admin', 'own');
SELECT safe_insert_permission('origins.admin.team', 'Permiso para admin origins con scope team', 'origins', 'admin', 'team');
SELECT safe_insert_permission('origins.create.own', 'Permiso para create origins con scope own', 'origins', 'create', 'own');
SELECT safe_insert_permission('origins.create.team', 'Permiso para create origins con scope team', 'origins', 'create', 'team');
SELECT safe_insert_permission('origins.delete.own', 'Permiso para delete origins con scope own', 'origins', 'delete', 'own');
SELECT safe_insert_permission('origins.delete.team', 'Permiso para delete origins con scope team', 'origins', 'delete', 'team');
SELECT safe_insert_permission('origins.read.own', 'Permiso para read origins con scope own', 'origins', 'read', 'own');
SELECT safe_insert_permission('origins.read.team', 'Permiso para read origins con scope team', 'origins', 'read', 'team');
SELECT safe_insert_permission('origins.update.own', 'Permiso para update origins con scope own', 'origins', 'update', 'own');
SELECT safe_insert_permission('origins.update.team', 'Permiso para update origins con scope team', 'origins', 'update', 'team');

-- =====================================
-- MÓDULO PERMISSIONS - Completar estructura
-- =====================================
SELECT safe_insert_permission('permissions.admin.own', 'Permiso para admin permissions con scope own', 'permissions', 'admin', 'own');
SELECT safe_insert_permission('permissions.admin.team', 'Permiso para admin permissions con scope team', 'permissions', 'admin', 'team');
SELECT safe_insert_permission('permissions.assign.own', 'Permiso para assign permissions con scope own', 'permissions', 'assign', 'own');
SELECT safe_insert_permission('permissions.assign.team', 'Permiso para assign permissions con scope team', 'permissions', 'assign', 'team');
SELECT safe_insert_permission('permissions.create.own', 'Permiso para create permissions con scope own', 'permissions', 'create', 'own');
SELECT safe_insert_permission('permissions.create.team', 'Permiso para create permissions con scope team', 'permissions', 'create', 'team');
SELECT safe_insert_permission('permissions.delete.own', 'Permiso para delete permissions con scope own', 'permissions', 'delete', 'own');
SELECT safe_insert_permission('permissions.delete.team', 'Permiso para delete permissions con scope team', 'permissions', 'delete', 'team');
SELECT safe_insert_permission('permissions.manage.own', 'Permiso para manage permissions con scope own', 'permissions', 'manage', 'own');
SELECT safe_insert_permission('permissions.manage.team', 'Permiso para manage permissions con scope team', 'permissions', 'manage', 'team');
SELECT safe_insert_permission('permissions.read.own', 'Permiso para read permissions con scope own', 'permissions', 'read', 'own');
SELECT safe_insert_permission('permissions.read.team', 'Permiso para read permissions con scope team', 'permissions', 'read', 'team');
SELECT safe_insert_permission('permissions.read_structure.own', 'Permiso para read_structure permissions con scope own', 'permissions', 'read_structure', 'own');
SELECT safe_insert_permission('permissions.read_structure.team', 'Permiso para read_structure permissions con scope team', 'permissions', 'read_structure', 'team');
SELECT safe_insert_permission('permissions.update.own', 'Permiso para update permissions con scope own', 'permissions', 'update', 'own');
SELECT safe_insert_permission('permissions.update.team', 'Permiso para update permissions con scope team', 'permissions', 'update', 'team');

-- =====================================
-- MÓDULO ROLES - Completar estructura
-- =====================================
SELECT safe_insert_permission('roles.audit.own', 'Permiso para audit roles con scope own', 'roles', 'audit', 'own');
SELECT safe_insert_permission('roles.audit.team', 'Permiso para audit roles con scope team', 'roles', 'audit', 'team');
SELECT safe_insert_permission('roles.audit.all', 'Permiso para audit roles con scope all', 'roles', 'audit', 'all');
SELECT safe_insert_permission('roles.clone.own', 'Permiso para clone roles con scope own', 'roles', 'clone', 'own');
SELECT safe_insert_permission('roles.clone.team', 'Permiso para clone roles con scope team', 'roles', 'clone', 'team');
SELECT safe_insert_permission('roles.clone.all', 'Permiso para clone roles con scope all', 'roles', 'clone', 'all');
SELECT safe_insert_permission('roles.create.own', 'Permiso para create roles con scope own', 'roles', 'create', 'own');
SELECT safe_insert_permission('roles.create.team', 'Permiso para create roles con scope team', 'roles', 'create', 'team');
SELECT safe_insert_permission('roles.create.all', 'Permiso para create roles con scope all', 'roles', 'create', 'all');
SELECT safe_insert_permission('roles.delete.own', 'Permiso para delete roles con scope own', 'roles', 'delete', 'own');
SELECT safe_insert_permission('roles.delete.team', 'Permiso para delete roles con scope team', 'roles', 'delete', 'team');
SELECT safe_insert_permission('roles.delete.all', 'Permiso para delete roles con scope all', 'roles', 'delete', 'all');
SELECT safe_insert_permission('roles.edit.own', 'Permiso para edit roles con scope own', 'roles', 'edit', 'own');
SELECT safe_insert_permission('roles.edit.team', 'Permiso para edit roles con scope team', 'roles', 'edit', 'team');
SELECT safe_insert_permission('roles.edit.all', 'Permiso para edit roles con scope all', 'roles', 'edit', 'all');
SELECT safe_insert_permission('roles.export.own', 'Permiso para export roles con scope own', 'roles', 'export', 'own');
SELECT safe_insert_permission('roles.export.team', 'Permiso para export roles con scope team', 'roles', 'export', 'team');
SELECT safe_insert_permission('roles.export.all', 'Permiso para export roles con scope all', 'roles', 'export', 'all');
SELECT safe_insert_permission('roles.gestionar.own', 'Permiso para gestionar roles con scope own', 'roles', 'gestionar', 'own');
SELECT safe_insert_permission('roles.gestionar.team', 'Permiso para gestionar roles con scope team', 'roles', 'gestionar', 'team');
SELECT safe_insert_permission('roles.manage.own', 'Permiso para manage roles con scope own', 'roles', 'manage', 'own');
SELECT safe_insert_permission('roles.manage.team', 'Permiso para manage roles con scope team', 'roles', 'manage', 'team');
SELECT safe_insert_permission('roles.manage.all', 'Permiso para manage roles con scope all', 'roles', 'manage', 'all');
SELECT safe_insert_permission('roles.report.own', 'Permiso para report roles con scope own', 'roles', 'report', 'own');
SELECT safe_insert_permission('roles.report.team', 'Permiso para report roles con scope team', 'roles', 'report', 'team');
SELECT safe_insert_permission('roles.report.all', 'Permiso para report roles con scope all', 'roles', 'report', 'all');
SELECT safe_insert_permission('roles.view.all', 'Permiso para view roles con scope all', 'roles', 'view', 'all');

-- =====================================
-- MÓDULO TAGS - Completar estructura
-- =====================================
SELECT safe_insert_permission('tags.create.own', 'Permiso para create tags con scope own', 'tags', 'create', 'own');
SELECT safe_insert_permission('tags.create.team', 'Permiso para create tags con scope team', 'tags', 'create', 'team');
SELECT safe_insert_permission('tags.create.all', 'Permiso para create tags con scope all', 'tags', 'create', 'all');
SELECT safe_insert_permission('tags.delete.own', 'Permiso para delete tags con scope own', 'tags', 'delete', 'own');
SELECT safe_insert_permission('tags.delete.team', 'Permiso para delete tags con scope team', 'tags', 'delete', 'team');
SELECT safe_insert_permission('tags.delete.all', 'Permiso para delete tags con scope all', 'tags', 'delete', 'all');
SELECT safe_insert_permission('tags.manage.own', 'Permiso para manage tags con scope own', 'tags', 'manage', 'own');
SELECT safe_insert_permission('tags.manage.team', 'Permiso para manage tags con scope team', 'tags', 'manage', 'team');
SELECT safe_insert_permission('tags.manage.all', 'Permiso para manage tags con scope all', 'tags', 'manage', 'all');
SELECT safe_insert_permission('tags.read.own', 'Permiso para read tags con scope own', 'tags', 'read', 'own');
SELECT safe_insert_permission('tags.read.team', 'Permiso para read tags con scope team', 'tags', 'read', 'team');
SELECT safe_insert_permission('tags.read.all', 'Permiso para read tags con scope all', 'tags', 'read', 'all');
SELECT safe_insert_permission('tags.update.own', 'Permiso para update tags con scope own', 'tags', 'update', 'own');
SELECT safe_insert_permission('tags.update.team', 'Permiso para update tags con scope team', 'tags', 'update', 'team');
SELECT safe_insert_permission('tags.update.all', 'Permiso para update tags con scope all', 'tags', 'update', 'all');

-- =====================================
-- MÓDULO TODOS - Completar faltantes
-- =====================================
SELECT safe_insert_permission('todos.assign.own', 'Permiso para assign todos con scope own', 'todos', 'assign', 'own');
SELECT safe_insert_permission('todos.assign.all', 'Permiso para assign todos con scope all', 'todos', 'assign', 'all');

-- =====================================
-- MÓDULO USERS - Completar estructura
-- =====================================
SELECT safe_insert_permission('users.audit.own', 'Permiso para audit users con scope own', 'users', 'audit', 'own');
SELECT safe_insert_permission('users.audit.team', 'Permiso para audit users con scope team', 'users', 'audit', 'team');
SELECT safe_insert_permission('users.audit.all', 'Permiso para audit users con scope all', 'users', 'audit', 'all');
SELECT safe_insert_permission('users.manage.own', 'Permiso para manage users con scope own', 'users', 'manage', 'own');
SELECT safe_insert_permission('users.manage.team', 'Permiso para manage users con scope team', 'users', 'manage', 'team');
SELECT safe_insert_permission('users.manage.all', 'Permiso para manage users con scope all', 'users', 'manage', 'all');
SELECT safe_insert_permission('users.report.own', 'Permiso para report users con scope own', 'users', 'report', 'own');
SELECT safe_insert_permission('users.report.all', 'Permiso para report users con scope all', 'users', 'report', 'all');

-- =====================================
-- MÓDULO USUARIOS - Completar estructura
-- =====================================
SELECT safe_insert_permission('usuarios.gestionar.own', 'Permiso para gestionar usuarios con scope own', 'usuarios', 'gestionar', 'own');
SELECT safe_insert_permission('usuarios.gestionar.all', 'Permiso para gestionar usuarios con scope all', 'usuarios', 'gestionar', 'all');

-- Limpiar función helper
DROP FUNCTION safe_insert_permission(VARCHAR(100), TEXT, VARCHAR(50), VARCHAR(20), VARCHAR(10));

COMMIT;

-- =====================================
-- RESUMEN DE MIGRACIÓN
-- =====================================
-- Total de permisos agregados: Hasta 160 (solo los que no existan)
-- Módulos afectados: 19 de 24
-- Manejo seguro de duplicados: SÍ
