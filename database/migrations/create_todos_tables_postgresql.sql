-- =========================================
-- MIGRACIÓN: Tablas de TODOs/Tareas para PostgreSQL
-- Descripción: Sistema completo de gestión de TODOs con control de tiempo
-- =========================================

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de prioridades de TODOs
CREATE TABLE todo_priorities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6B7280',
    level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar prioridades por defecto
INSERT INTO todo_priorities (name, description, color, level, display_order) VALUES 
    ('Muy Baja', 'Prioridad muy baja - puede esperar', '#10B981', 1, 1),
    ('Baja', 'Prioridad baja - no urgente', '#3B82F6', 2, 2),
    ('Media', 'Prioridad media - importante', '#F59E0B', 3, 3),
    ('Alta', 'Prioridad alta - urgente', '#EF4444', 4, 4),
    ('Crítica', 'Prioridad crítica - inmediato', '#DC2626', 5, 5)
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla principal de TODOs
CREATE TABLE todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority_id UUID NOT NULL,
    assigned_user_id UUID,
    created_by_user_id UUID NOT NULL,
    due_date DATE,
    estimated_minutes INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT FK_todos_priority FOREIGN KEY (priority_id) REFERENCES todo_priorities(id),
    CONSTRAINT FK_todos_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todos_created_by FOREIGN KEY (created_by_user_id) REFERENCES user_profiles(id)
);

-- 3. Tabla de control de TODOs
CREATE TABLE todo_control (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    status_id UUID NOT NULL,
    total_time_minutes INTEGER DEFAULT 0,
    timer_start_at TIMESTAMP WITH TIME ZONE,
    is_timer_active BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT FK_todo_control_todo FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_control_user FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todo_control_status FOREIGN KEY (status_id) REFERENCES case_status_control(id)
);

-- 4. Tabla de entradas de tiempo automáticas para TODOs
CREATE TABLE todo_time_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_control_id UUID NOT NULL,
    user_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('automatic', 'manual')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT FK_todo_time_entries_control FOREIGN KEY (todo_control_id) REFERENCES todo_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_time_entries_user FOREIGN KEY (user_id) REFERENCES user_profiles(id)
);

-- 5. Tabla de entradas de tiempo manual para TODOs
CREATE TABLE todo_manual_time_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_control_id UUID NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    CONSTRAINT FK_todo_manual_time_entries_control FOREIGN KEY (todo_control_id) REFERENCES todo_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_todo_manual_time_entries_user FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    CONSTRAINT FK_todo_manual_time_entries_created_by FOREIGN KEY (created_by) REFERENCES user_profiles(id)
);

-- 6. Tabla de TODOs archivados
CREATE TABLE archived_todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_todo_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(100) NOT NULL,
    total_time_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID NOT NULL,
    original_data JSONB, -- JSON data
    control_data JSONB, -- JSON data
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by UUID,
    is_restored BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_reason TEXT,
    CONSTRAINT FK_archived_todos_archived_by FOREIGN KEY (archived_by) REFERENCES user_profiles(id),
    CONSTRAINT FK_archived_todos_restored_by FOREIGN KEY (restored_by) REFERENCES user_profiles(id)
);

-- =========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =========================================

-- Índices para todos
CREATE INDEX idx_todos_assigned_user ON todos(assigned_user_id);
CREATE INDEX idx_todos_created_by ON todos(created_by_user_id);
CREATE INDEX idx_todos_priority ON todos(priority_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_completed ON todos(is_completed);
CREATE INDEX idx_todos_created_at ON todos(created_at);

-- Índices para control
CREATE INDEX idx_todo_control_todo ON todo_control(todo_id);
CREATE INDEX idx_todo_control_user ON todo_control(user_id);
CREATE INDEX idx_todo_control_status ON todo_control(status_id);
CREATE INDEX idx_todo_control_timer ON todo_control(is_timer_active);

-- Índices para entradas de tiempo
CREATE INDEX idx_todo_time_entries_control ON todo_time_entries(todo_control_id);
CREATE INDEX idx_todo_time_entries_user ON todo_time_entries(user_id);
CREATE INDEX idx_todo_time_entries_start ON todo_time_entries(start_time);

CREATE INDEX idx_todo_manual_time_entries_control ON todo_manual_time_entries(todo_control_id);
CREATE INDEX idx_todo_manual_time_entries_user ON todo_manual_time_entries(user_id);
CREATE INDEX idx_todo_manual_time_entries_date ON todo_manual_time_entries(date);

-- =========================================
-- TRIGGERS PARA ACTUALIZACIONES AUTOMÁTICAS
-- =========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en todos
CREATE TRIGGER trigger_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en todo_control
CREATE TRIGGER trigger_todo_control_updated_at
    BEFORE UPDATE ON todo_control
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular duración automática en entradas de tiempo
CREATE OR REPLACE FUNCTION calculate_todo_time_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular duración automática
CREATE TRIGGER trigger_calculate_todo_time_duration
    BEFORE INSERT OR UPDATE ON todo_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_todo_time_duration();

-- =========================================
-- FUNCIONES UTILITARIAS
-- =========================================

-- Función para obtener tiempo total de un TODO
CREATE OR REPLACE FUNCTION get_todo_total_time(todo_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    automatic_time INTEGER := 0;
    manual_time INTEGER := 0;
    total_time INTEGER := 0;
BEGIN
    -- Tiempo automático
    SELECT COALESCE(SUM(duration_minutes), 0) INTO automatic_time
    FROM todo_time_entries tte
    INNER JOIN todo_control tc ON tc.id = tte.todo_control_id
    WHERE tc.todo_id = todo_id_param;
    
    -- Tiempo manual
    SELECT COALESCE(SUM(duration_minutes), 0) INTO manual_time
    FROM todo_manual_time_entries tmte
    INNER JOIN todo_control tc ON tc.id = tmte.todo_control_id
    WHERE tc.todo_id = todo_id_param;
    
    total_time := automatic_time + manual_time;
    
    RETURN total_time;
END;
$$ LANGUAGE plpgsql;

-- Función para completar un TODO
CREATE OR REPLACE FUNCTION complete_todo(
    todo_id_param UUID,
    user_id_param UUID,
    control_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    todo_exists BOOLEAN := false;
    result JSON;
BEGIN
    -- Verificar que el TODO existe
    SELECT EXISTS (SELECT 1 FROM todos WHERE id = todo_id_param) INTO todo_exists;
    
    IF NOT todo_exists THEN
        RAISE EXCEPTION 'TODO no encontrado';
    END IF;
    
    -- Marcar el TODO como completado
    UPDATE todos SET
        is_completed = true,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = todo_id_param;
    
    -- Actualizar control si se proporciona
    IF control_id_param IS NOT NULL THEN
        UPDATE todo_control SET
            completed_at = NOW(),
            is_timer_active = false,
            timer_start_at = NULL,
            updated_at = NOW()
        WHERE id = control_id_param AND todo_id = todo_id_param;
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'TODO completado exitosamente',
        'todo_id', todo_id_param,
        'completed_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- COMENTARIOS EN TABLAS
-- =========================================

COMMENT ON TABLE todo_priorities IS 'Niveles de prioridad para los TODOs';
COMMENT ON TABLE todos IS 'Tabla principal de TODOs/tareas';
COMMENT ON TABLE todo_control IS 'Control de estado y tiempo de TODOs';
COMMENT ON TABLE todo_time_entries IS 'Registros automáticos de tiempo trabajado';
COMMENT ON TABLE todo_manual_time_entries IS 'Registros manuales de tiempo';
COMMENT ON TABLE archived_todos IS 'TODOs archivados con historial completo';

-- =========================================
-- PERMISOS BÁSICOS (opcional)
-- =========================================

-- Conceder permisos básicos al esquema público
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
