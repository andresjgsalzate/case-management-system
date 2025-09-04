-- =============================================
-- MÓDULO DE NOTAS - SISTEMA DE GESTIÓN
-- =============================================
-- Descripción: Tablas para el sistema de notas con funcionalidades avanzadas
-- Fecha: 28 de agosto, 2025
-- =============================================

-- Tabla principal de notas
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    case_id UUID,
    created_by UUID NOT NULL,
    assigned_to UUID,
    is_important BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID,
    reminder_date TIMESTAMP WITH TIME ZONE,
    is_reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_notes_case_id FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    CONSTRAINT fk_notes_created_by FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_assigned_to FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_notes_archived_by FOREIGN KEY (archived_by) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_assigned_to ON notes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notes_case_id ON notes(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_is_important ON notes(is_important);
CREATE INDEX IF NOT EXISTS idx_notes_reminder_date ON notes(reminder_date);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

-- Índice para búsqueda de texto completo
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(to_tsvector('spanish', title || ' ' || content));

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_update_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();

-- =============================================
-- FUNCIONES PARA BÚSQUEDA Y ESTADÍSTICAS
-- =============================================

-- Función para búsqueda avanzada de notas
CREATE OR REPLACE FUNCTION search_notes(
    search_term TEXT,
    user_id UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    content TEXT,
    tags TEXT[],
    case_id UUID,
    created_by UUID,
    assigned_to UUID,
    is_important BOOLEAN,
    is_archived BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    case_number VARCHAR,
    creator_name VARCHAR,
    assigned_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.tags,
        n.case_id,
        n.created_by,
        n.assigned_to,
        n.is_important,
        n.is_archived,
        n.created_at,
        n.updated_at,
        c.numero_caso as case_number,
        creator.full_name as creator_name,
        assigned.full_name as assigned_name
    FROM notes n
    LEFT JOIN cases c ON n.case_id = c.id
    LEFT JOIN user_profiles creator ON n.created_by = creator.id
    LEFT JOIN user_profiles assigned ON n.assigned_to = assigned.id
    WHERE 
        (n.created_by = user_id OR n.assigned_to = user_id)
        AND (
            to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', search_term)
            OR n.title ILIKE '%' || search_term || '%'
            OR n.content ILIKE '%' || search_term || '%'
            OR search_term = ANY(n.tags)
        )
        AND n.is_archived = false
    ORDER BY 
        CASE 
            WHEN n.title ILIKE '%' || search_term || '%' THEN 1
            WHEN search_term = ANY(n.tags) THEN 2
            ELSE 3
        END,
        n.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de notas
CREATE OR REPLACE FUNCTION get_notes_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_archived = false
        ),
        'my_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE created_by = user_id AND is_archived = false
        ),
        'assigned_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE assigned_to = user_id AND is_archived = false
        ),
        'important_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_important = true AND is_archived = false
        ),
        'with_reminders', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND reminder_date IS NOT NULL AND is_archived = false
        ),
        'archived_notes', (
            SELECT COUNT(*) FROM notes 
            WHERE (created_by = user_id OR assigned_to = user_id) 
            AND is_archived = true
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DATOS INICIALES DE EJEMPLO
-- =============================================

-- Insertar algunas notas de ejemplo (opcional)
-- INSERT INTO notes (title, content, tags, created_by, is_important) VALUES
-- ('Nota de ejemplo', 'Esta es una nota de ejemplo para el sistema', '{"ejemplo", "sistema"}', (SELECT id FROM user_profiles LIMIT 1), false);

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

COMMENT ON TABLE notes IS 'Tabla principal para el sistema de notas con soporte para casos, asignaciones y recordatorios';
COMMENT ON COLUMN notes.tags IS 'Array de etiquetas para categorización y búsqueda';
COMMENT ON COLUMN notes.case_id IS 'Referencia opcional a un caso relacionado';
COMMENT ON COLUMN notes.reminder_date IS 'Fecha y hora para recordatorio de la nota';
COMMENT ON COLUMN notes.is_important IS 'Marca la nota como importante para destacarla';
COMMENT ON COLUMN notes.is_archived IS 'Indica si la nota está archivada';

-- Fin de script
