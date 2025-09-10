-- =====================================================
-- MIGRACIÓN: MÓDULO BASE DE CONOCIMIENTO
-- Fecha: Septiembre 2025
-- Descripción: Tablas independientes para documentación avanzada con BlockNote
-- =====================================================

-- Extensiones necesarias para búsqueda avanzada
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Tipos de documentos parametrizables
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA PRINCIPAL DE DOCUMENTOS DE BASE DE CONOCIMIENTO
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT, -- Contenido de texto plano para búsqueda
  json_content JSONB NOT NULL, -- Contenido BlockNote en formato JSON
  document_type_id UUID REFERENCES document_types(id),
  
  -- Metadatos del documento
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  
  -- Estados del documento
  is_published BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  is_deprecated BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Métricas
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Control de versiones
  version INTEGER DEFAULT 1,
  
  -- Fechas importantes
  published_at TIMESTAMP WITH TIME ZONE,
  deprecated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  last_edited_by UUID REFERENCES user_profiles(id),
  archived_by UUID REFERENCES user_profiles(id),
  replacement_document_id UUID REFERENCES knowledge_documents(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para etiquetas de documentos de conocimiento
CREATE TABLE IF NOT EXISTS knowledge_document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, tag_name)
);

-- Versiones de documentos (para control de versiones)
CREATE TABLE IF NOT EXISTS knowledge_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL, -- Contenido BlockNote en formato JSON
  title VARCHAR(500) NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- Adjuntos de documentos
CREATE TABLE IF NOT EXISTS knowledge_document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Ruta relativa desde uploads/
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'document', 'spreadsheet', 'other')),
  file_hash VARCHAR(64), -- SHA-256 para deduplicación
  thumbnail_path TEXT, -- Ruta de miniatura generada
  processed_path TEXT, -- Ruta de versión procesada/optimizada
  is_embedded BOOLEAN DEFAULT false, -- Si está embebido en el contenido
  upload_session_id UUID, -- ID de sesión de carga
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relaciones entre documentos (para documentos relacionados/reemplazos)
CREATE TABLE IF NOT EXISTS knowledge_document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  child_document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) CHECK (relation_type IN ('related', 'replaces', 'prerequisite', 'follows')) DEFAULT 'related',
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_document_id, child_document_id, relation_type)
);

-- Feedback de usuarios sobre documentos
CREATE TABLE IF NOT EXISTS knowledge_document_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- document_types
CREATE INDEX IF NOT EXISTS idx_document_types_code ON document_types(code);
CREATE INDEX IF NOT EXISTS idx_document_types_active ON document_types(is_active);
CREATE INDEX IF NOT EXISTS idx_document_types_order ON document_types(display_order);

-- knowledge_documents
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_document_type ON knowledge_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_by ON knowledge_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_last_edited_by ON knowledge_documents(last_edited_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_published_at ON knowledge_documents(published_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_published ON knowledge_documents(is_published);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_archived ON knowledge_documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_deprecated ON knowledge_documents(is_deprecated);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_json_content ON knowledge_documents USING GIN(json_content);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_search ON knowledge_documents USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(content, '')));

-- knowledge_document_tags
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_document_id ON knowledge_document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_tag_name ON knowledge_document_tags(tag_name);

-- knowledge_document_versions
CREATE INDEX IF NOT EXISTS idx_knowledge_document_versions_document_id ON knowledge_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_versions_created_by ON knowledge_document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_versions_created_at ON knowledge_document_versions(created_at);

-- knowledge_document_attachments
CREATE INDEX IF NOT EXISTS idx_knowledge_document_attachments_document_id ON knowledge_document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_attachments_file_hash ON knowledge_document_attachments(file_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_attachments_upload_session ON knowledge_document_attachments(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_attachments_uploaded_by ON knowledge_document_attachments(uploaded_by);

-- knowledge_document_relations
CREATE INDEX IF NOT EXISTS idx_knowledge_document_relations_parent ON knowledge_document_relations(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_relations_child ON knowledge_document_relations(child_document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_relations_type ON knowledge_document_relations(relation_type);

-- knowledge_document_feedback
CREATE INDEX IF NOT EXISTS idx_knowledge_document_feedback_document_id ON knowledge_document_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_feedback_user_id ON knowledge_document_feedback(user_id);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

-- Función para crear trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_document_types_updated_at ON document_types;
CREATE TRIGGER update_document_types_updated_at 
    BEFORE UPDATE ON document_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at 
    BEFORE UPDATE ON knowledge_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_document_attachments_updated_at ON knowledge_document_attachments;
CREATE TRIGGER update_knowledge_document_attachments_updated_at 
    BEFORE UPDATE ON knowledge_document_attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_document_feedback_updated_at ON knowledge_document_feedback;
CREATE TRIGGER update_knowledge_document_feedback_updated_at 
    BEFORE UPDATE ON knowledge_document_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales para tipos de documentos
INSERT INTO document_types (code, name, description, icon, color, display_order, created_by) 
VALUES 
  ('guide', 'Guía', 'Guías paso a paso', '📖', '#3B82F6', 1, 
   (SELECT id FROM user_profiles WHERE email LIKE '%admin%' LIMIT 1)),
  ('faq', 'FAQ', 'Preguntas frecuentes', '❓', '#EF4444', 2, 
   (SELECT id FROM user_profiles WHERE email LIKE '%admin%' LIMIT 1)),
  ('solution', 'Solución', 'Soluciones a problemas', '💡', '#10B981', 3, 
   (SELECT id FROM user_profiles WHERE email LIKE '%admin%' LIMIT 1)),
  ('template', 'Plantilla', 'Plantillas reutilizables', '📄', '#8B5CF6', 4, 
   (SELECT id FROM user_profiles WHERE email LIKE '%admin%' LIMIT 1)),
  ('procedure', 'Procedimiento', 'Procedimientos operativos', '⚙️', '#F59E0B', 5, 
   (SELECT id FROM user_profiles WHERE email LIKE '%admin%' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- Función para crear nueva versión de documento
CREATE OR REPLACE FUNCTION create_document_version(
    p_note_id UUID,
    p_content JSONB,
    p_title VARCHAR(500),
    p_change_summary TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
BEGIN
    -- Obtener siguiente número de versión
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM document_versions
    WHERE note_id = p_note_id;

    -- Crear nueva versión
    INSERT INTO document_versions (
        note_id, version_number, content, title,
        change_summary, created_by
    ) VALUES (
        p_note_id, v_version_number, p_content, p_title,
        p_change_summary, p_user_id
    ) RETURNING id INTO v_version_id;

    -- Actualizar tabla principal con último contenido
    UPDATE notes
    SET
        json_content = p_content,
        title = p_title,
        last_edited_by = p_user_id,
        version = v_version_number,
        updated_at = NOW()
    WHERE id = p_note_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Función de búsqueda avanzada de documentos
CREATE OR REPLACE FUNCTION search_documents_advanced(
    p_search_term TEXT DEFAULT NULL,
    p_document_types UUID[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_difficulty_range INT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    note_id UUID,
    title VARCHAR(500),
    content TEXT,
    json_content JSONB,
    note_type VARCHAR(50),
    document_type_name VARCHAR(100),
    difficulty_level INTEGER,
    view_count INTEGER,
    helpful_count INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.json_content,
        n.note_type,
        COALESCE(dt.name, 'Sin categoría') as document_type_name,
        n.difficulty_level,
        n.view_count,
        n.helpful_count,
        n.tags,
        n.created_at,
        n.updated_at,
        CASE 
            WHEN p_search_term IS NULL THEN 1.0
            ELSE (
                ts_rank_cd(
                    to_tsvector('spanish', n.title || ' ' || n.content),
                    plainto_tsquery('spanish', p_search_term)
                ) + 
                similarity(n.title, p_search_term) * 0.5
            )::REAL
        END as rank
    FROM notes n
    LEFT JOIN document_types dt ON n.document_type_id = dt.id
    WHERE
        n.is_archived = false
        AND n.is_deprecated = false
        AND n.is_published = true
        AND (p_search_term IS NULL OR (
            to_tsvector('spanish', n.title || ' ' || n.content) @@ plainto_tsquery('spanish', p_search_term)
            OR n.title % p_search_term
        ))
        AND (p_document_types IS NULL OR n.document_type_id = ANY(p_document_types))
        AND (p_tags IS NULL OR n.tags && p_tags)
        AND (p_difficulty_range IS NULL OR n.difficulty_level BETWEEN p_difficulty_range[1] AND p_difficulty_range[2])
        AND (p_user_id IS NULL OR n.created_by = p_user_id)
    ORDER BY rank DESC, n.view_count DESC, n.helpful_count DESC, n.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE document_types IS 'Tipos de documentos parametrizables para categorización';
COMMENT ON TABLE document_versions IS 'Control de versiones para documentos';
COMMENT ON TABLE document_attachments IS 'Archivos adjuntos a documentos';
COMMENT ON TABLE document_relations IS 'Relaciones entre documentos (reemplazos, relacionados, etc.)';
COMMENT ON FUNCTION create_document_version IS 'Crea una nueva versión de documento y actualiza la tabla principal';
COMMENT ON FUNCTION search_documents_advanced IS 'Búsqueda avanzada de documentos con ranking y filtros múltiples';
