-- ============================================================================
-- Migración: Búsqueda Insensible a Acentos
-- Fecha: 2024-12-23
-- Descripción: Habilita la extensión unaccent de PostgreSQL para permitir
--              búsquedas que ignoren acentos y diacríticos.
-- ============================================================================

-- Paso 1: Habilitar la extensión unaccent
-- Esta extensión permite remover acentos de texto para comparaciones
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Paso 2: Crear una función inmutable para búsqueda normalizada
-- La función es IMMUTABLE para poder usarla en índices
CREATE OR REPLACE FUNCTION normalize_search(text) RETURNS text AS $$
  SELECT lower(unaccent(COALESCE($1, '')));
$$ LANGUAGE SQL IMMUTABLE STRICT;

-- Paso 3: Crear índices funcionales para mejorar rendimiento en búsquedas
-- Estos índices aceleran las búsquedas normalizadas

-- Índice para título de documentos de conocimiento
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title_normalized 
  ON knowledge_documents (normalize_search(title));

-- Índice para contenido de documentos de conocimiento  
-- NOTA: No se puede usar B-tree en campos de texto largo (límite ~2704 bytes)
-- Se usa GIN con full-text search para búsquedas en contenido extenso
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_content_fts 
  ON knowledge_documents USING GIN (to_tsvector('spanish', coalesce(content, '')));

-- Índice para nombres de etiquetas
CREATE INDEX IF NOT EXISTS idx_knowledge_document_tags_name_normalized 
  ON knowledge_document_tags (normalize_search(tag_name));

-- Índice para número de caso (si aplica)
CREATE INDEX IF NOT EXISTS idx_cases_numero_caso_normalized 
  ON cases (normalize_search("numeroCaso"));

-- ============================================================================
-- Verificación de la instalación
-- ============================================================================

-- Verificar que unaccent funciona correctamente
DO $$
BEGIN
  -- Test básico de unaccent
  IF unaccent('Migración de Fondos') = 'Migracion de Fondos' THEN
    RAISE NOTICE '✅ Extensión unaccent instalada correctamente';
  ELSE
    RAISE EXCEPTION '❌ La extensión unaccent no funciona correctamente';
  END IF;
  
  -- Test de la función normalize_search
  IF normalize_search('Migración de Fondos') = 'migracion de fondos' THEN
    RAISE NOTICE '✅ Función normalize_search funciona correctamente';
  ELSE
    RAISE EXCEPTION '❌ La función normalize_search no funciona correctamente';
  END IF;
END $$;

-- ============================================================================
-- Ejemplos de uso (comentados)
-- ============================================================================

-- Búsqueda que encontrará "Migración", "Migracion", "migracion", etc:
-- SELECT * FROM knowledge_documents 
-- WHERE normalize_search(title) LIKE normalize_search('%migracion%');

-- O usando unaccent directamente:
-- SELECT * FROM knowledge_documents 
-- WHERE unaccent(lower(title)) LIKE unaccent(lower('%Migración%'));

-- ============================================================================
-- Rollback (si es necesario deshacer los cambios)
-- ============================================================================

-- Para revertir esta migración, ejecutar:
-- DROP INDEX IF EXISTS idx_knowledge_documents_title_normalized;
-- DROP INDEX IF EXISTS idx_knowledge_documents_content_fts;
-- DROP INDEX IF EXISTS idx_knowledge_document_tags_name_normalized;
-- DROP INDEX IF EXISTS idx_cases_numero_caso_normalized;
-- DROP FUNCTION IF EXISTS normalize_search(text);
-- DROP EXTENSION IF EXISTS unaccent;
