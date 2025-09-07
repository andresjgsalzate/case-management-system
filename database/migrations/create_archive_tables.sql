-- ================================================================
-- MIGRACIÓN: SISTEMA DE ARCHIVO
-- ================================================================
-- Descripción: Crea las tablas necesarias para el sistema de archivo
-- Fecha: 5 de septiembre de 2025
-- Sistema: PostgreSQL con sistema de permisos integrado
-- ================================================================

-- ================================================================
-- 1. TABLA DE CASOS ARCHIVADOS
-- ================================================================
CREATE TABLE IF NOT EXISTS archived_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_case_id UUID NOT NULL,
    case_number VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    classification VARCHAR(100) NOT NULL,
    
    -- Usuarios relacionados
    user_id UUID NOT NULL,
    assigned_user_id UUID,
    created_by_user_id UUID NOT NULL,
    
    -- Datos temporales originales
    original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos de archivo
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_by UUID NOT NULL,
    archive_reason TEXT,
    
    -- Datos de restauración
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by UUID,
    is_restored BOOLEAN DEFAULT FALSE,
    
    -- Datos JSON para preservar información completa
    original_data JSONB NOT NULL,
    control_data JSONB NOT NULL,
    
    -- Tiempo total acumulado
    total_time_minutes INTEGER DEFAULT 0,
    
    -- Timestamps de control
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_archived_cases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_archived_cases_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_archived_cases_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_archived_cases_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_archived_cases_restored_by FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para casos archivados
CREATE INDEX IF NOT EXISTS idx_archived_cases_original_case_id ON archived_cases(original_case_id);
CREATE INDEX IF NOT EXISTS idx_archived_cases_case_number ON archived_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_archived_cases_archived_by ON archived_cases(archived_by);
CREATE INDEX IF NOT EXISTS idx_archived_cases_archived_at ON archived_cases(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_cases_is_restored ON archived_cases(is_restored);
CREATE INDEX IF NOT EXISTS idx_archived_cases_classification ON archived_cases(classification);
CREATE INDEX IF NOT EXISTS idx_archived_cases_status ON archived_cases(status);

-- ================================================================
-- 2. TABLA DE TODOS ARCHIVADOS
-- ================================================================
CREATE TABLE IF NOT EXISTS archived_todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_todo_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    
    -- Estado y fechas originales
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Usuarios relacionados
    created_by_user_id UUID NOT NULL,
    assigned_user_id UUID,
    case_id UUID, -- Relación opcional con caso
    
    -- Datos de archivo
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_by UUID NOT NULL,
    archive_reason TEXT,
    
    -- Datos de restauración
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by UUID,
    is_restored BOOLEAN DEFAULT FALSE,
    
    -- Datos JSON para preservar información completa
    original_data JSONB NOT NULL,
    control_data JSONB NOT NULL,
    
    -- Tiempo total acumulado
    total_time_minutes INTEGER DEFAULT 0,
    
    -- Timestamps de control
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_archived_todos_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_archived_todos_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_archived_todos_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_archived_todos_restored_by FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para TODOs archivados
CREATE INDEX IF NOT EXISTS idx_archived_todos_original_todo_id ON archived_todos(original_todo_id);
CREATE INDEX IF NOT EXISTS idx_archived_todos_title ON archived_todos(title);
CREATE INDEX IF NOT EXISTS idx_archived_todos_archived_by ON archived_todos(archived_by);
CREATE INDEX IF NOT EXISTS idx_archived_todos_archived_at ON archived_todos(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_todos_is_restored ON archived_todos(is_restored);
CREATE INDEX IF NOT EXISTS idx_archived_todos_priority ON archived_todos(priority);
CREATE INDEX IF NOT EXISTS idx_archived_todos_category ON archived_todos(category);
CREATE INDEX IF NOT EXISTS idx_archived_todos_case_id ON archived_todos(case_id);

-- ================================================================
-- 3. FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL ARCHIVO
-- ================================================================
CREATE OR REPLACE FUNCTION get_archive_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    total_archived_cases INTEGER;
    total_archived_todos INTEGER;
    total_archived_time_minutes INTEGER;
    archived_this_month INTEGER;
    restored_this_month INTEGER;
    result JSON;
BEGIN
    -- Contar casos archivados (solo los que puede ver el usuario)
    SELECT COUNT(*) INTO total_archived_cases
    FROM archived_cases ac
    WHERE ac.user_id = p_user_id 
       OR ac.assigned_user_id = p_user_id 
       OR ac.archived_by = p_user_id
       OR ac.created_by_user_id = p_user_id;
    
    -- Contar TODOs archivados (solo los que puede ver el usuario)
    SELECT COUNT(*) INTO total_archived_todos
    FROM archived_todos at_
    WHERE at_.created_by_user_id = p_user_id 
       OR at_.assigned_user_id = p_user_id 
       OR at_.archived_by = p_user_id;
    
    -- Tiempo total acumulado
    SELECT 
        COALESCE(SUM(ac.total_time_minutes), 0) + COALESCE(SUM(at_.total_time_minutes), 0)
    INTO total_archived_time_minutes
    FROM archived_cases ac
    FULL OUTER JOIN archived_todos at_ ON FALSE
    WHERE (ac.user_id = p_user_id OR ac.assigned_user_id = p_user_id OR ac.archived_by = p_user_id)
       OR (at_.created_by_user_id = p_user_id OR at_.assigned_user_id = p_user_id OR at_.archived_by = p_user_id);
    
    -- Archivados este mes
    SELECT 
        COUNT(CASE WHEN ac.archived_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) +
        COUNT(CASE WHEN at_.archived_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
    INTO archived_this_month
    FROM archived_cases ac
    FULL OUTER JOIN archived_todos at_ ON FALSE
    WHERE (ac.user_id = p_user_id OR ac.assigned_user_id = p_user_id OR ac.archived_by = p_user_id)
       OR (at_.created_by_user_id = p_user_id OR at_.assigned_user_id = p_user_id OR at_.archived_by = p_user_id);
    
    -- Restaurados este mes
    SELECT 
        COUNT(CASE WHEN ac.restored_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) +
        COUNT(CASE WHEN at_.restored_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
    INTO restored_this_month
    FROM archived_cases ac
    FULL OUTER JOIN archived_todos at_ ON FALSE
    WHERE (ac.user_id = p_user_id OR ac.assigned_user_id = p_user_id OR ac.archived_by = p_user_id)
       OR (at_.created_by_user_id = p_user_id OR at_.assigned_user_id = p_user_id OR at_.archived_by = p_user_id);
    
    -- Construir respuesta JSON
    SELECT json_build_object(
        'totalArchivedCases', COALESCE(total_archived_cases, 0),
        'totalArchivedTodos', COALESCE(total_archived_todos, 0),
        'totalArchivedTimeMinutes', COALESCE(total_archived_time_minutes, 0),
        'archivedThisMonth', COALESCE(archived_this_month, 0),
        'restoredThisMonth', COALESCE(restored_this_month, 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 4. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ================================================================
CREATE OR REPLACE FUNCTION update_archived_cases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_archived_todos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS tr_archived_cases_updated_at ON archived_cases;
CREATE TRIGGER tr_archived_cases_updated_at
    BEFORE UPDATE ON archived_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_archived_cases_timestamp();

DROP TRIGGER IF EXISTS tr_archived_todos_updated_at ON archived_todos;
CREATE TRIGGER tr_archived_todos_updated_at
    BEFORE UPDATE ON archived_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_archived_todos_timestamp();

-- ================================================================
-- 5. PERMISOS PARA EL SISTEMA DE ARCHIVO
-- ================================================================

-- Insertar permisos del módulo archivo si no existen
INSERT INTO permissions (name, description, module, created_at, updated_at) 
VALUES 
    ('archive.view', 'Ver elementos archivados', 'archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('archive.create', 'Archivar elementos', 'archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('archive.restore', 'Restaurar elementos archivados', 'archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('archive.delete', 'Eliminar permanentemente elementos archivados', 'archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('archive.stats', 'Ver estadísticas del archivo', 'archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Otorgar permisos básicos del archivo al rol admin
DO $$
DECLARE
    admin_role_id UUID;
    archive_permission_id UUID;
BEGIN
    -- Obtener ID del rol admin
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        -- Otorgar todos los permisos del archivo al admin
        FOR archive_permission_id IN 
            SELECT id FROM permissions WHERE module = 'archive'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (admin_role_id, archive_permission_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Permisos de archivo otorgados al rol admin';
    END IF;
END $$;

-- Otorgar permisos básicos del archivo al rol user (solo visualización)
DO $$
DECLARE
    user_role_id UUID;
    view_permission_id UUID;
    stats_permission_id UUID;
BEGIN
    -- Obtener ID del rol user
    SELECT id INTO user_role_id FROM roles WHERE name = 'user' LIMIT 1;
    
    IF user_role_id IS NOT NULL THEN
        -- Otorgar permiso de visualización
        SELECT id INTO view_permission_id FROM permissions WHERE name = 'archive.view' LIMIT 1;
        SELECT id INTO stats_permission_id FROM permissions WHERE name = 'archive.stats' LIMIT 1;
        
        IF view_permission_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (user_role_id, view_permission_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        
        IF stats_permission_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (user_role_id, stats_permission_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Permisos básicos de archivo otorgados al rol user';
    END IF;
END $$;

-- ================================================================
-- COMENTARIOS SOBRE LAS TABLAS
-- ================================================================
COMMENT ON TABLE archived_cases IS 'Tabla para almacenar casos archivados con toda su información histórica';
COMMENT ON TABLE archived_todos IS 'Tabla para almacenar TODOs archivados con toda su información histórica';

COMMENT ON COLUMN archived_cases.original_data IS 'JSON con todos los datos originales del caso';
COMMENT ON COLUMN archived_cases.control_data IS 'JSON con datos de control, tiempo y actividad del caso';
COMMENT ON COLUMN archived_todos.original_data IS 'JSON con todos los datos originales del TODO';
COMMENT ON COLUMN archived_todos.control_data IS 'JSON con datos de control, tiempo y actividad del TODO';

COMMENT ON FUNCTION get_archive_stats(UUID) IS 'Obtiene estadísticas del archivo para un usuario específico';

RAISE NOTICE '✅ Migración del sistema de archivo completada exitosamente';
