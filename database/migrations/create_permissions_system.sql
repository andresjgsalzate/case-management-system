-- =========================================
-- MIGRACIÓN: SISTEMA DE PERMISOS Y ROLES
-- Fecha: 2025-08-29
-- Descripción: Crear sistema de permisos granular compatible con estructura existente
-- =========================================

-- NOTA: La tabla 'roles' ya existe, solo agregamos las tablas faltantes

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    scope VARCHAR(10) NOT NULL CHECK (scope IN ('own', 'team', 'all')),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de relación roles-permisos
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "roleId" UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    "permissionId" UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("roleId", "permissionId")
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions("isActive");
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions("roleId");
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions("permissionId");

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para permissions
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar rol administrador por defecto
INSERT INTO roles (id, name, description, "isActive")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Administrador',
    'Acceso completo al sistema con todos los permisos',
    true
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- Insertar permisos granulares del sistema siguiendo el patrón modulo.accion.scope

-- ============================================
-- MÓDULO: DISPOSICIONES
-- ============================================
INSERT INTO permissions (name, description, module, action, scope, "isActive") VALUES
-- Ver disposiciones
('disposiciones.ver.own', 'Ver disposiciones propias', 'disposiciones', 'ver', 'own', true),
('disposiciones.ver.team', 'Ver disposiciones del equipo', 'disposiciones', 'ver', 'team', true),
('disposiciones.ver.all', 'Ver todas las disposiciones', 'disposiciones', 'ver', 'all', true),

-- Crear disposiciones
('disposiciones.crear.own', 'Crear disposiciones propias', 'disposiciones', 'crear', 'own', true),
('disposiciones.crear.team', 'Crear disposiciones para el equipo', 'disposiciones', 'crear', 'team', true),
('disposiciones.crear.all', 'Crear disposiciones para cualquiera', 'disposiciones', 'crear', 'all', true),

-- Editar disposiciones
('disposiciones.editar.own', 'Editar disposiciones propias', 'disposiciones', 'editar', 'own', true),
('disposiciones.editar.team', 'Editar disposiciones del equipo', 'disposiciones', 'editar', 'team', true),
('disposiciones.editar.all', 'Editar todas las disposiciones', 'disposiciones', 'editar', 'all', true),

-- Eliminar disposiciones
('disposiciones.eliminar.own', 'Eliminar disposiciones propias', 'disposiciones', 'eliminar', 'own', true),
('disposiciones.eliminar.team', 'Eliminar disposiciones del equipo', 'disposiciones', 'eliminar', 'team', true),
('disposiciones.eliminar.all', 'Eliminar todas las disposiciones', 'disposiciones', 'eliminar', 'all', true),

-- ============================================
-- MÓDULO: CASOS
-- ============================================
-- Ver casos
('casos.ver.own', 'Ver casos propios', 'casos', 'ver', 'own', true),
('casos.ver.team', 'Ver casos del equipo', 'casos', 'ver', 'team', true),
('casos.ver.all', 'Ver todos los casos', 'casos', 'ver', 'all', true),

-- Crear casos
('casos.crear.own', 'Crear casos propios', 'casos', 'crear', 'own', true),
('casos.crear.team', 'Crear casos para el equipo', 'casos', 'crear', 'team', true),
('casos.crear.all', 'Crear casos para cualquiera', 'casos', 'crear', 'all', true),

-- Editar casos
('casos.editar.own', 'Editar casos propios', 'casos', 'editar', 'own', true),
('casos.editar.team', 'Editar casos del equipo', 'casos', 'editar', 'team', true),
('casos.editar.all', 'Editar todos los casos', 'casos', 'editar', 'all', true),

-- Eliminar casos
('casos.eliminar.own', 'Eliminar casos propios', 'casos', 'eliminar', 'own', true),
('casos.eliminar.team', 'Eliminar casos del equipo', 'casos', 'eliminar', 'team', true),
('casos.eliminar.all', 'Eliminar todos los casos', 'casos', 'eliminar', 'all', true),

-- Asignar casos
('casos.asignar.team', 'Asignar casos a miembros del equipo', 'casos', 'asignar', 'team', true),
('casos.asignar.all', 'Asignar casos a cualquier usuario', 'casos', 'asignar', 'all', true),

-- ============================================
-- MÓDULO: TODOS (TAREAS)
-- ============================================
-- Ver todos
('todos.ver.own', 'Ver tareas propias', 'todos', 'ver', 'own', true),
('todos.ver.team', 'Ver tareas del equipo', 'todos', 'ver', 'team', true),
('todos.ver.all', 'Ver todas las tareas', 'todos', 'ver', 'all', true),

-- Crear todos
('todos.crear.own', 'Crear tareas propias', 'todos', 'crear', 'own', true),
('todos.crear.team', 'Crear tareas para el equipo', 'todos', 'crear', 'team', true),
('todos.crear.all', 'Crear tareas para cualquiera', 'todos', 'crear', 'all', true),

-- Editar todos
('todos.editar.own', 'Editar tareas propias', 'todos', 'editar', 'own', true),
('todos.editar.team', 'Editar tareas del equipo', 'todos', 'editar', 'team', true),
('todos.editar.all', 'Editar todas las tareas', 'todos', 'editar', 'all', true),

-- Eliminar todos
('todos.eliminar.own', 'Eliminar tareas propias', 'todos', 'eliminar', 'own', true),
('todos.eliminar.team', 'Eliminar tareas del equipo', 'todos', 'eliminar', 'team', true),
('todos.eliminar.all', 'Eliminar todas las tareas', 'todos', 'eliminar', 'all', true),

-- Asignar todos
('todos.asignar.team', 'Asignar tareas a miembros del equipo', 'todos', 'asignar', 'team', true),
('todos.asignar.all', 'Asignar tareas a cualquier usuario', 'todos', 'asignar', 'all', true),

-- ============================================
-- MÓDULO: CONTROL DE CASOS
-- ============================================
-- Ver control de casos
('control-casos.ver.own', 'Ver control de casos propios', 'control-casos', 'ver', 'own', true),
('control-casos.ver.team', 'Ver control de casos del equipo', 'control-casos', 'ver', 'team', true),
('control-casos.ver.all', 'Ver todo el control de casos', 'control-casos', 'ver', 'all', true),

-- Gestionar control de casos
('control-casos.gestionar.own', 'Gestionar control de casos propios', 'control-casos', 'gestionar', 'own', true),
('control-casos.gestionar.team', 'Gestionar control de casos del equipo', 'control-casos', 'gestionar', 'team', true),
('control-casos.gestionar.all', 'Gestionar todo el control de casos', 'control-casos', 'gestionar', 'all', true),

-- ============================================
-- MÓDULO: NOTAS
-- ============================================
-- Ver notas
('notas.ver.own', 'Ver notas propias', 'notas', 'ver', 'own', true),
('notas.ver.team', 'Ver notas del equipo', 'notas', 'ver', 'team', true),
('notas.ver.all', 'Ver todas las notas', 'notas', 'ver', 'all', true),

-- Crear notas
('notas.crear.own', 'Crear notas propias', 'notas', 'crear', 'own', true),
('notas.crear.team', 'Crear notas para el equipo', 'notas', 'crear', 'team', true),
('notas.crear.all', 'Crear notas para cualquiera', 'notas', 'crear', 'all', true),

-- Editar notas
('notas.editar.own', 'Editar notas propias', 'notas', 'editar', 'own', true),
('notas.editar.team', 'Editar notas del equipo', 'notas', 'editar', 'team', true),
('notas.editar.all', 'Editar todas las notas', 'notas', 'editar', 'all', true),

-- Eliminar notas
('notas.eliminar.own', 'Eliminar notas propias', 'notas', 'eliminar', 'own', true),
('notas.eliminar.team', 'Eliminar notas del equipo', 'notas', 'eliminar', 'team', true),
('notas.eliminar.all', 'Eliminar todas las notas', 'notas', 'eliminar', 'all', true),

-- ============================================
-- MÓDULO: USUARIOS
-- ============================================
-- Ver usuarios
('usuarios.ver.own', 'Ver perfil propio', 'usuarios', 'ver', 'own', true),
('usuarios.ver.team', 'Ver usuarios del equipo', 'usuarios', 'ver', 'team', true),
('usuarios.ver.all', 'Ver todos los usuarios', 'usuarios', 'ver', 'all', true),

-- Gestionar usuarios
('usuarios.gestionar.team', 'Gestionar usuarios del equipo', 'usuarios', 'gestionar', 'team', true),
('usuarios.gestionar.all', 'Gestionar todos los usuarios', 'usuarios', 'gestionar', 'all', true),

-- ============================================
-- MÓDULO: ROLES Y PERMISOS
-- ============================================
-- Gestionar roles
('roles.gestionar.all', 'Gestionar roles y permisos del sistema', 'roles', 'gestionar', 'all', true),

-- ============================================
-- MÓDULO: DASHBOARD
-- ============================================
-- Ver dashboard
('dashboard.ver.own', 'Ver dashboard personal', 'dashboard', 'ver', 'own', true),
('dashboard.ver.team', 'Ver dashboard del equipo', 'dashboard', 'ver', 'team', true),
('dashboard.ver.all', 'Ver dashboard completo', 'dashboard', 'ver', 'all', true),

-- ============================================
-- MÓDULO: REPORTES
-- ============================================
-- Generar reportes
('reportes.generar.own', 'Generar reportes propios', 'reportes', 'generar', 'own', true),
('reportes.generar.team', 'Generar reportes del equipo', 'reportes', 'generar', 'team', true),
('reportes.generar.all', 'Generar todos los reportes', 'reportes', 'generar', 'all', true),

-- ============================================
-- MÓDULO: TIEMPO
-- ============================================
-- Ver control de tiempo
('tiempo.ver.own', 'Ver control de tiempo propio', 'tiempo', 'ver', 'own', true),
('tiempo.ver.team', 'Ver control de tiempo del equipo', 'tiempo', 'ver', 'team', true),
('tiempo.ver.all', 'Ver todo el control de tiempo', 'tiempo', 'ver', 'all', true),

-- Gestionar control de tiempo
('tiempo.gestionar.own', 'Gestionar control de tiempo propio', 'tiempo', 'gestionar', 'own', true),
('tiempo.gestionar.team', 'Gestionar control de tiempo del equipo', 'tiempo', 'gestionar', 'team', true),
('tiempo.gestionar.all', 'Gestionar todo el control de tiempo', 'tiempo', 'gestionar', 'all', true)

ON CONFLICT (name) DO NOTHING;

-- Asignar TODOS los permisos al rol Administrador
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    '00000000-0000-0000-0000-000000000001',
    p.id
FROM permissions p
WHERE p."isActive" = true
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE permissions IS 'Tabla de permisos granulares del sistema con estructura modulo.accion.scope';
COMMENT ON TABLE role_permissions IS 'Tabla de relación muchos a muchos entre roles y permisos';
COMMENT ON COLUMN permissions.name IS 'Nombre único del permiso en formato modulo.accion.scope';
COMMENT ON COLUMN permissions.module IS 'Módulo del sistema (disposiciones, casos, todos, etc.)';
COMMENT ON COLUMN permissions.action IS 'Acción que se puede realizar (ver, crear, editar, eliminar, gestionar, asignar)';
COMMENT ON COLUMN permissions.scope IS 'Alcance del permiso: own (propio), team (equipo), all (todos)';

-- Verificar que todo se creó correctamente
SELECT 'Migración completada exitosamente' AS status,
       (SELECT COUNT(*) FROM permissions) AS total_permisos,
       (SELECT COUNT(*) FROM role_permissions WHERE "roleId" = '00000000-0000-0000-0000-000000000001') AS permisos_admin,
       (SELECT name FROM roles WHERE id = '00000000-0000-0000-0000-000000000001') AS rol_admin;
