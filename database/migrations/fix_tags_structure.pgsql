-- Migración para corregir la estructura de etiquetas
-- Crear etiquetas únicas y relaciones many-to-many

BEGIN;

-- 1. Crear tabla de etiquetas únicas (sin relación directa con documentos)
CREATE TABLE IF NOT EXISTS knowledge_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    category VARCHAR(20) DEFAULT 'custom' CHECK (category IN ('priority', 'technical', 'type', 'technology', 'module', 'custom')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de relaciones many-to-many
CREATE TABLE IF NOT EXISTS knowledge_document_tag_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES knowledge_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, tag_id)
);

-- 3. Migrar datos existentes
-- Primero, crear etiquetas únicas basadas en tag_name
INSERT INTO knowledge_tags (tag_name, description, color, category, is_active, created_by, created_at, updated_at)
SELECT DISTINCT 
    tag_name,
    description,
    color,
    category,
    is_active,
    created_by,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM knowledge_document_tags 
GROUP BY tag_name, description, color, category, is_active, created_by
ON CONFLICT (tag_name) DO NOTHING;

-- 4. Crear relaciones basadas en datos existentes
INSERT INTO knowledge_document_tag_relations (document_id, tag_id)
SELECT DISTINCT 
    kdt.document_id,
    kt.id as tag_id
FROM knowledge_document_tags kdt
INNER JOIN knowledge_tags kt ON kt.tag_name = kdt.tag_name
WHERE kdt.document_id IS NOT NULL
ON CONFLICT (document_id, tag_id) DO NOTHING;

-- 5. Agregar campo tags_json a knowledge_documents
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS tags_json JSONB DEFAULT '[]'::jsonb;

-- 6. Actualizar campo tags_json con los IDs de etiquetas
UPDATE knowledge_documents 
SET tags_json = (
    SELECT COALESCE(jsonb_agg(ktr.tag_id), '[]'::jsonb)
    FROM knowledge_document_tag_relations ktr
    WHERE ktr.document_id = knowledge_documents.id
);

-- 7. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_name ON knowledge_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_category ON knowledge_tags(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_active ON knowledge_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tag_relations_document ON knowledge_document_tag_relations(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tag_relations_tag ON knowledge_document_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tags_json ON knowledge_documents USING gin(tags_json);

-- 8. Crear función para actualizar tags_json cuando cambian las relaciones
CREATE OR REPLACE FUNCTION update_document_tags_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar tags_json del documento afectado
    IF TG_OP = 'DELETE' THEN
        UPDATE knowledge_documents 
        SET tags_json = (
            SELECT COALESCE(jsonb_agg(tag_id), '[]'::jsonb)
            FROM knowledge_document_tag_relations
            WHERE document_id = OLD.document_id
        )
        WHERE id = OLD.document_id;
        RETURN OLD;
    ELSE
        UPDATE knowledge_documents 
        SET tags_json = (
            SELECT COALESCE(jsonb_agg(tag_id), '[]'::jsonb)
            FROM knowledge_document_tag_relations
            WHERE document_id = NEW.document_id
        )
        WHERE id = NEW.document_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para mantener sincronizado tags_json
DROP TRIGGER IF EXISTS trigger_update_document_tags_json ON knowledge_document_tag_relations;
CREATE TRIGGER trigger_update_document_tags_json
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_document_tag_relations
    FOR EACH ROW EXECUTE FUNCTION update_document_tags_json();

-- 10. Crear función para obtener etiquetas con conteo de uso
CREATE OR REPLACE FUNCTION get_tags_with_usage_count()
RETURNS TABLE (
    id UUID,
    tag_name VARCHAR(50),
    description TEXT,
    color VARCHAR(7),
    category VARCHAR(20),
    is_active BOOLEAN,
    usage_count BIGINT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kt.id,
        kt.tag_name,
        kt.description,
        kt.color,
        kt.category,
        kt.is_active,
        COUNT(ktr.document_id) as usage_count,
        kt.created_by,
        kt.created_at,
        kt.updated_at
    FROM knowledge_tags kt
    LEFT JOIN knowledge_document_tag_relations ktr ON kt.id = ktr.tag_id
    GROUP BY kt.id, kt.tag_name, kt.description, kt.color, kt.category, kt.is_active, kt.created_by, kt.created_at, kt.updated_at
    ORDER BY usage_count DESC, kt.tag_name ASC;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- NOTA: Después de ejecutar esta migración y verificar que todo funciona correctamente,
-- se puede eliminar la tabla antigua knowledge_document_tags con:
-- DROP TABLE knowledge_document_tags;
