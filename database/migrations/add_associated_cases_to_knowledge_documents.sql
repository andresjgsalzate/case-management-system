-- Agregar campo associated_cases a la tabla knowledge_documents
-- Esta migración permite asociar casos específicos con documentos de knowledge base

ALTER TABLE knowledge_documents 
ADD COLUMN associated_cases JSONB DEFAULT '[]'::jsonb;

-- Crear índice para mejorar las consultas sobre casos asociados
CREATE INDEX idx_knowledge_documents_associated_cases 
ON knowledge_documents USING gin (associated_cases);

-- Comentario para documentar la columna
COMMENT ON COLUMN knowledge_documents.associated_cases 
IS 'Array de IDs de casos asociados con este documento de knowledge base';
