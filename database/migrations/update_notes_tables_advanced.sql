-- =================================================================
-- MIGRACIÓN: ACTUALIZACIÓN DE TABLA NOTES - FUNCIONALIDADES AVANZADAS
-- =================================================================
-- Descripción: Agrega campos avanzados al sistema de notas
-- Versión: 2.0
-- Fecha: 29 de agosto de 2025
-- =================================================================

-- Agregar nuevos campos a la tabla notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) DEFAULT 'note' NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS complexity_notes TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS prerequisites TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS estimated_solution_time INTEGER; -- minutos
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deprecation_reason TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS replacement_note_id UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS last_reviewed_by UUID;

-- Agregar comentarios para documentación
COMMENT ON COLUMN notes.note_type IS 'Tipo de nota: note, solution, guide, faq, template, procedure';
COMMENT ON COLUMN notes.priority IS 'Prioridad: low, medium, high, urgent';
COMMENT ON COLUMN notes.difficulty_level IS 'Nivel de dificultad del 1 al 5';
COMMENT ON COLUMN notes.view_count IS 'Número de visualizaciones';
COMMENT ON COLUMN notes.helpful_count IS 'Número de votos útiles';
COMMENT ON COLUMN notes.not_helpful_count IS 'Número de votos no útiles';
COMMENT ON COLUMN notes.estimated_solution_time IS 'Tiempo estimado de solución en minutos';

-- Agregar restricciones (constraints)
ALTER TABLE notes ADD CONSTRAINT check_difficulty_level 
  CHECK (difficulty_level >= 1 AND difficulty_level <= 5);

ALTER TABLE notes ADD CONSTRAINT check_note_type 
  CHECK (note_type IN ('note', 'solution', 'guide', 'faq', 'template', 'procedure'));

ALTER TABLE notes ADD CONSTRAINT check_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE notes ADD CONSTRAINT check_view_count_positive 
  CHECK (view_count >= 0);

ALTER TABLE notes ADD CONSTRAINT check_helpful_count_positive 
  CHECK (helpful_count >= 0);

ALTER TABLE notes ADD CONSTRAINT check_not_helpful_count_positive 
  CHECK (not_helpful_count >= 0);

ALTER TABLE notes ADD CONSTRAINT check_version_positive 
  CHECK (version >= 1);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON notes(priority);
CREATE INDEX IF NOT EXISTS idx_notes_difficulty_level ON notes(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_notes_is_template ON notes(is_template);
CREATE INDEX IF NOT EXISTS idx_notes_is_published ON notes(is_published);
CREATE INDEX IF NOT EXISTS idx_notes_is_deprecated ON notes(is_deprecated);
CREATE INDEX IF NOT EXISTS idx_notes_view_count ON notes(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_notes_helpful_count ON notes(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_notes_version ON notes(version);
CREATE INDEX IF NOT EXISTS idx_notes_last_reviewed_at ON notes(last_reviewed_at);

-- ===== CREAR TABLA PARA ETIQUETAS REUTILIZABLES =====

CREATE TABLE IF NOT EXISTS note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280' NOT NULL, -- Color hex
  category VARCHAR(20) DEFAULT 'custom' NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentarios para note_tags
COMMENT ON TABLE note_tags IS 'Etiquetas reutilizables para notas';
COMMENT ON COLUMN note_tags.category IS 'Categoría: priority, technical, type, technology, module, custom';
COMMENT ON COLUMN note_tags.usage_count IS 'Número de veces que se ha usado esta etiqueta';

-- Restricciones para note_tags
ALTER TABLE note_tags ADD CONSTRAINT check_tag_category 
  CHECK (category IN ('priority', 'technical', 'type', 'technology', 'module', 'custom'));

ALTER TABLE note_tags ADD CONSTRAINT check_tag_usage_count_positive 
  CHECK (usage_count >= 0);

-- Índices para note_tags
CREATE INDEX IF NOT EXISTS idx_note_tags_name ON note_tags(name);
CREATE INDEX IF NOT EXISTS idx_note_tags_category ON note_tags(category);
CREATE INDEX IF NOT EXISTS idx_note_tags_usage_count ON note_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_note_tags_is_active ON note_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_note_tags_created_by ON note_tags(created_by);

-- ===== CREAR TABLA DE RELACIÓN MANY-TO-MANY =====

CREATE TABLE IF NOT EXISTS note_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES note_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Evitar duplicados
  UNIQUE(note_id, tag_id)
);

-- Comentarios para note_tag_assignments
COMMENT ON TABLE note_tag_assignments IS 'Relación many-to-many entre notas y etiquetas';

-- Índices para note_tag_assignments
CREATE INDEX IF NOT EXISTS idx_note_tag_assignments_note_id ON note_tag_assignments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tag_assignments_tag_id ON note_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_note_tag_assignments_assigned_by ON note_tag_assignments(assigned_by);

-- ===== CREAR TABLA PARA FEEDBACK Y RATING =====

CREATE TABLE IF NOT EXISTS note_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  was_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Un usuario solo puede dar feedback una vez por nota
  UNIQUE(note_id, user_id)
);

-- Comentarios para note_feedback
COMMENT ON TABLE note_feedback IS 'Feedback y valoraciones de las notas';
COMMENT ON COLUMN note_feedback.rating IS 'Rating del 1 al 5 (opcional)';
COMMENT ON COLUMN note_feedback.was_helpful IS 'Si la nota fue útil o no';

-- Índices para note_feedback
CREATE INDEX IF NOT EXISTS idx_note_feedback_note_id ON note_feedback(note_id);
CREATE INDEX IF NOT EXISTS idx_note_feedback_user_id ON note_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_note_feedback_was_helpful ON note_feedback(was_helpful);
CREATE INDEX IF NOT EXISTS idx_note_feedback_rating ON note_feedback(rating);

-- ===== FUNCIÓN PARA ACTUALIZAR CONTADORES =====

-- Función para actualizar contadores de etiquetas
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE note_tags 
    SET usage_count = usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE note_tags 
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores de etiquetas
DROP TRIGGER IF EXISTS tr_update_tag_usage_count ON note_tag_assignments;
CREATE TRIGGER tr_update_tag_usage_count
  AFTER INSERT OR DELETE ON note_tag_assignments
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Función para actualizar contadores de feedback
CREATE OR REPLACE FUNCTION update_note_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.was_helpful THEN
      UPDATE notes SET helpful_count = helpful_count + 1 WHERE id = NEW.note_id;
    ELSE
      UPDATE notes SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.note_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el valor de was_helpful
    IF OLD.was_helpful != NEW.was_helpful THEN
      IF NEW.was_helpful THEN
        UPDATE notes 
        SET helpful_count = helpful_count + 1,
            not_helpful_count = GREATEST(not_helpful_count - 1, 0)
        WHERE id = NEW.note_id;
      ELSE
        UPDATE notes 
        SET helpful_count = GREATEST(helpful_count - 1, 0),
            not_helpful_count = not_helpful_count + 1
        WHERE id = NEW.note_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.was_helpful THEN
      UPDATE notes SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.note_id;
    ELSE
      UPDATE notes SET not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE id = OLD.note_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores de feedback
DROP TRIGGER IF EXISTS tr_update_note_feedback_counts ON note_feedback;
CREATE TRIGGER tr_update_note_feedback_counts
  AFTER INSERT OR UPDATE OR DELETE ON note_feedback
  FOR EACH ROW EXECUTE FUNCTION update_note_feedback_counts();

-- ===== FUNCIÓN PARA ACTUALIZAR UPDATED_AT =====

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para note_tags
DROP TRIGGER IF EXISTS tr_note_tags_updated_at ON note_tags;
CREATE TRIGGER tr_note_tags_updated_at
  BEFORE UPDATE ON note_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== INSERTAR ETIQUETAS PREDETERMINADAS =====

INSERT INTO note_tags (name, description, color, category, created_by) 
SELECT 
  unnest(ARRAY['Urgente', 'Importante', 'Normal', 'Bajo']),
  unnest(ARRAY['Requiere atención inmediata', 'Prioridad alta', 'Prioridad normal', 'Prioridad baja']),
  unnest(ARRAY['#EF4444', '#F97316', '#EAB308', '#22C55E']),
  'priority',
  (SELECT id FROM user_profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles)
ON CONFLICT (name) DO NOTHING;

INSERT INTO note_tags (name, description, color, category, created_by) 
SELECT 
  unnest(ARRAY['Frontend', 'Backend', 'Base de Datos', 'API', 'UI/UX', 'DevOps']),
  unnest(ARRAY['Desarrollo frontend', 'Desarrollo backend', 'Gestión de base de datos', 'Desarrollo de APIs', 'Diseño de interfaz', 'Operaciones de desarrollo']),
  unnest(ARRAY['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280']),
  'technical',
  (SELECT id FROM user_profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles)
ON CONFLICT (name) DO NOTHING;

-- ===== ACTUALIZAR ESTADÍSTICAS DE NOTAS =====

CREATE OR REPLACE FUNCTION get_notes_advanced_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_notes', COUNT(*),
    'my_notes', COUNT(*) FILTER (WHERE created_by = p_user_id),
    'assigned_notes', COUNT(*) FILTER (WHERE assigned_to = p_user_id),
    'important_notes', COUNT(*) FILTER (WHERE is_important = true),
    'template_notes', COUNT(*) FILTER (WHERE is_template = true),
    'published_notes', COUNT(*) FILTER (WHERE is_published = true),
    'deprecated_notes', COUNT(*) FILTER (WHERE is_deprecated = true),
    'with_reminders', COUNT(*) FILTER (WHERE reminder_date IS NOT NULL),
    'archived_notes', COUNT(*) FILTER (WHERE is_archived = true),
    'by_type', json_build_object(
      'note', COUNT(*) FILTER (WHERE note_type = 'note'),
      'solution', COUNT(*) FILTER (WHERE note_type = 'solution'),
      'guide', COUNT(*) FILTER (WHERE note_type = 'guide'),
      'faq', COUNT(*) FILTER (WHERE note_type = 'faq'),
      'template', COUNT(*) FILTER (WHERE note_type = 'template'),
      'procedure', COUNT(*) FILTER (WHERE note_type = 'procedure')
    ),
    'by_priority', json_build_object(
      'low', COUNT(*) FILTER (WHERE priority = 'low'),
      'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
      'high', COUNT(*) FILTER (WHERE priority = 'high'),
      'urgent', COUNT(*) FILTER (WHERE priority = 'urgent')
    ),
    'by_difficulty', json_build_object(
      '1', COUNT(*) FILTER (WHERE difficulty_level = 1),
      '2', COUNT(*) FILTER (WHERE difficulty_level = 2),
      '3', COUNT(*) FILTER (WHERE difficulty_level = 3),
      '4', COUNT(*) FILTER (WHERE difficulty_level = 4),
      '5', COUNT(*) FILTER (WHERE difficulty_level = 5)
    ),
    'most_viewed', (
      SELECT json_agg(json_build_object('id', id, 'title', title, 'view_count', view_count))
      FROM (
        SELECT id, title, view_count 
        FROM notes 
        WHERE (created_by = p_user_id OR assigned_to = p_user_id)
          AND view_count > 0
        ORDER BY view_count DESC 
        LIMIT 5
      ) top_viewed
    ),
    'most_helpful', (
      SELECT json_agg(json_build_object('id', id, 'title', title, 'helpful_count', helpful_count))
      FROM (
        SELECT id, title, helpful_count 
        FROM notes 
        WHERE (created_by = p_user_id OR assigned_to = p_user_id)
          AND helpful_count > 0
        ORDER BY helpful_count DESC 
        LIMIT 5
      ) top_helpful
    )
  ) INTO result
  FROM notes
  WHERE created_by = p_user_id OR assigned_to = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comentario final
COMMENT ON FUNCTION get_notes_advanced_stats IS 'Obtiene estadísticas avanzadas de notas para un usuario específico';

SELECT 'Migración de notas avanzadas completada exitosamente' as status;
