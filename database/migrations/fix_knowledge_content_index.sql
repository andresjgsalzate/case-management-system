-- ============================================================
-- Migración: Eliminar índice problemático en knowledge_documents.content
-- Fecha: 2025-12-20
-- Problema: El índice B-tree en la columna 'content' no puede manejar
--           textos grandes (límite ~2704 bytes en PostgreSQL)
-- Error: "index row size 4184 exceeds btree version 4 maximum 2704"
-- ============================================================

-- Eliminar el índice problemático
DROP INDEX IF EXISTS "IDX_deaa236c281b992ff6fb132f0b";

-- Verificar si hay otros índices en la columna content que puedan causar problemas
DO $$
DECLARE
    idx_record RECORD;
BEGIN
    RAISE NOTICE 'Verificando índices en knowledge_documents...';
    
    FOR idx_record IN 
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'knowledge_documents'
    LOOP
        RAISE NOTICE 'Índice encontrado: % - %', idx_record.indexname, idx_record.indexdef;
    END LOOP;
END $$;

-- Nota: Si necesitas búsqueda de texto completo en el contenido,
-- considera usar un índice GIN con tsvector en lugar de B-tree:
-- 
-- CREATE INDEX idx_knowledge_content_fulltext 
-- ON knowledge_documents 
-- USING GIN (to_tsvector('spanish', content));
--
-- O simplemente confiar en la columna json_content que ya almacena
-- el contenido estructurado y no requiere índice en content.

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
