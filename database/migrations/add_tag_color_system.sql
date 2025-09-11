-- Migración para agregar sistema de colores y categorías a etiquetas
-- Fecha: 2025-09-10
-- Descripción: Agrega columnas para color, categoría, descripción, contador de uso y estado activo

BEGIN;

-- Crear tipo ENUM para las categorías
DO $$ BEGIN
    CREATE TYPE tag_category_enum AS ENUM ('priority', 'technical', 'type', 'technology', 'module', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar nuevas columnas a la tabla knowledge_document_tags
ALTER TABLE knowledge_document_tags 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS category tag_category_enum DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger a la tabla
DROP TRIGGER IF EXISTS update_knowledge_document_tags_updated_at ON knowledge_document_tags;
CREATE TRIGGER update_knowledge_document_tags_updated_at 
    BEFORE UPDATE ON knowledge_document_tags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Actualizar etiquetas existentes con valores predeterminados
UPDATE knowledge_document_tags SET
    color = CASE 
        WHEN tag_name LIKE '%error%' OR tag_name LIKE '%bug%' THEN '#EF4444'
        WHEN tag_name LIKE '%react%' OR tag_name LIKE '%js%' THEN '#3B82F6'
        WHEN tag_name LIKE '%backend%' OR tag_name LIKE '%api%' THEN '#10B981'
        WHEN tag_name LIKE '%frontend%' OR tag_name LIKE '%ui%' THEN '#8B5CF6'
        ELSE '#6B7280'
    END,
    category = CASE 
        WHEN tag_name LIKE '%error%' OR tag_name LIKE '%bug%' OR tag_name LIKE '%fix%' THEN 'priority'::tag_category_enum
        WHEN tag_name LIKE '%react%' OR tag_name LIKE '%js%' OR tag_name LIKE '%css%' THEN 'technology'::tag_category_enum
        WHEN tag_name LIKE '%backend%' OR tag_name LIKE '%frontend%' OR tag_name LIKE '%api%' THEN 'technical'::tag_category_enum
        WHEN tag_name LIKE '%user%' OR tag_name LIKE '%admin%' OR tag_name LIKE '%auth%' THEN 'module'::tag_category_enum
        ELSE 'custom'::tag_category_enum
    END,
    description = 'Etiqueta migrada del sistema anterior'
WHERE color IS NULL OR category IS NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_category ON knowledge_document_tags(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_usage_count ON knowledge_document_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_is_active ON knowledge_document_tags(is_active);

-- Actualizar contador de uso para etiquetas existentes
UPDATE knowledge_document_tags SET usage_count = (
    SELECT COUNT(*)
    FROM knowledge_document_tags kt2
    WHERE kt2.tag_name = knowledge_document_tags.tag_name
    AND kt2.document_id IS NOT NULL
)
WHERE document_id IS NULL;

COMMIT;
