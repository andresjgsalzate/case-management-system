-- =========================================
-- MIGRACIÓN: SISTEMA DE AUDITORÍA COMPLETO
-- Fecha: 2025-09-16
-- Descripción: Crear sistema completo de auditoría para seguimiento de operaciones CRUD
-- =========================================

-- Extensión para UUID (si no existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA DE REGISTROS DE AUDITORÍA PRINCIPAL
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información del usuario que realizó la acción
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(500),
    user_role VARCHAR(100),
    
    -- Información de la acción
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'ARCHIVE')),
    entity_type VARCHAR(100) NOT NULL, -- cases, todos, users, roles, etc.
    entity_id UUID NOT NULL,
    entity_name VARCHAR(500), -- nombre descriptivo de la entidad (ej: "Caso #123", "Usuario Juan Pérez")
    
    -- Contexto de la operación
    module VARCHAR(50) NOT NULL, -- módulo que realizó la acción
    operation_context JSONB, -- contexto adicional de la operación
    
    -- Información técnica
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. TABLA DE CAMBIOS DETALLADOS POR ENTIDAD
-- ============================================

CREATE TABLE IF NOT EXISTS audit_entity_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID NOT NULL,
    
    -- Información del campo modificado
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- string, number, boolean, json, date, etc.
    
    -- Valores antes y después
    old_value TEXT, -- valor anterior (serializado)
    new_value TEXT, -- valor nuevo (serializado)
    
    -- Metadatos del cambio
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('ADDED', 'MODIFIED', 'REMOVED')),
    is_sensitive BOOLEAN DEFAULT FALSE, -- indica si el campo contiene información sensible
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. RESTRICCIONES DE CLAVE FORÁNEA
-- ============================================

-- Agregar foreign keys después de crear las tablas
ALTER TABLE audit_logs 
ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_user 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE audit_entity_changes 
ADD CONSTRAINT IF NOT EXISTS fk_audit_entity_changes_log 
FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE;

-- ============================================
-- 4. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at);

-- Índices para audit_entity_changes
CREATE INDEX IF NOT EXISTS idx_audit_entity_changes_audit_log_id ON audit_entity_changes(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity_changes_field_name ON audit_entity_changes(field_name);
CREATE INDEX IF NOT EXISTS idx_audit_entity_changes_change_type ON audit_entity_changes(change_type);

-- ============================================
-- 5. PERMISOS DEL SISTEMA DE AUDITORÍA
-- ============================================

-- Insertar permisos de auditoría
INSERT INTO permissions (name, description, module, action, scope, "isActive") VALUES
-- Ver auditorías
('audit.view.own', 'Ver auditorías propias', 'audit', 'view', 'own', true),
('audit.view.team', 'Ver auditorías del equipo', 'audit', 'view', 'team', true),
('audit.view.all', 'Ver todas las auditorías', 'audit', 'view', 'all', true),

-- Administrar auditorías
('audit.admin.all', 'Administrar sistema de auditoría completo', 'audit', 'admin', 'all', true),

-- Exportar auditorías
('audit.export.own', 'Exportar auditorías propias', 'audit', 'export', 'own', true),
('audit.export.team', 'Exportar auditorías del equipo', 'audit', 'export', 'team', true),
('audit.export.all', 'Exportar todas las auditorías', 'audit', 'export', 'all', true),

-- Configurar auditoría
('audit.config.all', 'Configurar parámetros del sistema de auditoría', 'audit', 'config', 'all', true)

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. ASIGNAR PERMISOS A ROLES
-- ============================================

-- ROL ADMINISTRADOR: Todos los permisos de auditoría
-- SOLO LOS ADMINISTRADORES TIENEN ACCESO AL SISTEMA DE AUDITORÍA
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Administrador' 
  AND p.module = 'audit'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ============================================
-- 7. FUNCIONES AUXILIARES PARA AUDITORÍA
-- ============================================

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION clean_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de auditoría
CREATE OR REPLACE FUNCTION get_audit_statistics(from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days')
RETURNS TABLE (
    total_actions BIGINT,
    create_actions BIGINT,
    update_actions BIGINT,
    delete_actions BIGINT,
    unique_users BIGINT,
    unique_entities BIGINT,
    most_active_user TEXT,
    most_modified_entity_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action = 'CREATE') as create_actions,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as update_actions,
        COUNT(*) FILTER (WHERE action = 'DELETE') as delete_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT entity_id) as unique_entities,
        (SELECT user_email FROM audit_logs WHERE created_at >= from_date GROUP BY user_email ORDER BY COUNT(*) DESC LIMIT 1) as most_active_user,
        (SELECT entity_type FROM audit_logs WHERE created_at >= from_date GROUP BY entity_type ORDER BY COUNT(*) DESC LIMIT 1) as most_modified_entity_type
    FROM audit_logs 
    WHERE created_at >= from_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VISTA PARA CONSULTAS OPTIMIZADAS
-- ============================================

CREATE OR REPLACE VIEW audit_logs_with_changes AS
SELECT 
    al.id,
    al.user_id,
    al.user_email,
    al.user_name,
    al.user_role,
    al.action,
    al.entity_type,
    al.entity_id,
    al.entity_name,
    al.module,
    al.operation_context,
    al.ip_address,
    al.user_agent,
    al.created_at,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'field_name', aec.field_name,
                'field_type', aec.field_type,
                'old_value', aec.old_value,
                'new_value', aec.new_value,
                'change_type', aec.change_type,
                'is_sensitive', aec.is_sensitive
            )
        ) FILTER (WHERE aec.id IS NOT NULL), 
        '[]'::json
    ) as changes
FROM audit_logs al
LEFT JOIN audit_entity_changes aec ON al.id = aec.audit_log_id
GROUP BY al.id, al.user_id, al.user_email, al.user_name, al.user_role, 
         al.action, al.entity_type, al.entity_id, al.entity_name, 
         al.module, al.operation_context, al.ip_address, al.user_agent, al.created_at;

-- ============================================
-- 9. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE audit_logs IS 'Registro principal de todas las acciones de auditoría del sistema';
COMMENT ON TABLE audit_entity_changes IS 'Detalle de cambios específicos en cada campo de las entidades auditadas';

COMMENT ON COLUMN audit_logs.action IS 'Tipo de acción realizada: CREATE, UPDATE, DELETE, RESTORE, ARCHIVE';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo de entidad afectada (tabla/modelo)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID de la entidad específica afectada';
COMMENT ON COLUMN audit_logs.module IS 'Módulo del sistema que realizó la acción';
COMMENT ON COLUMN audit_logs.operation_context IS 'Contexto adicional de la operación en formato JSON';

COMMENT ON COLUMN audit_entity_changes.change_type IS 'Tipo de cambio: ADDED (campo añadido), MODIFIED (modificado), REMOVED (eliminado)';
COMMENT ON COLUMN audit_entity_changes.is_sensitive IS 'Indica si el campo contiene información sensible que debe ser protegida';

-- Fin de la migración
SELECT 'Sistema de auditoría creado exitosamente' as resultado;
