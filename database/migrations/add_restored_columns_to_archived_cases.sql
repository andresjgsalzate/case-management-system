-- ================================================================
-- MIGRACIÓN: AGREGAR COLUMNAS DE RESTAURACIÓN A ARCHIVED_CASES
-- ================================================================
-- Descripción: Agrega las columnas restored_at, restored_by, e is_restored
--              a la tabla archived_cases si no existen
-- Fecha: 19 de diciembre de 2025
-- Sistema: PostgreSQL
-- ================================================================

-- Agregar columna is_restored si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_cases' AND column_name = 'is_restored'
    ) THEN
        ALTER TABLE archived_cases ADD COLUMN is_restored BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna is_restored agregada a archived_cases';
    ELSE
        RAISE NOTICE 'Columna is_restored ya existe en archived_cases';
    END IF;
END $$;

-- Agregar columna restored_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_cases' AND column_name = 'restored_at'
    ) THEN
        ALTER TABLE archived_cases ADD COLUMN restored_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna restored_at agregada a archived_cases';
    ELSE
        RAISE NOTICE 'Columna restored_at ya existe en archived_cases';
    END IF;
END $$;

-- Agregar columna restored_by si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_cases' AND column_name = 'restored_by'
    ) THEN
        ALTER TABLE archived_cases ADD COLUMN restored_by UUID;
        RAISE NOTICE 'Columna restored_by agregada a archived_cases';
    ELSE
        RAISE NOTICE 'Columna restored_by ya existe en archived_cases';
    END IF;
END $$;

-- Crear índice para is_restored si no existe
CREATE INDEX IF NOT EXISTS idx_archived_cases_is_restored ON archived_cases(is_restored);

-- Crear índice para restored_at si no existe
CREATE INDEX IF NOT EXISTS idx_archived_cases_restored_at ON archived_cases(restored_at);

-- ================================================================
-- TAMBIÉN PARA ARCHIVED_TODOS (por consistencia)
-- ================================================================

-- Agregar columna is_restored si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_todos' AND column_name = 'is_restored'
    ) THEN
        ALTER TABLE archived_todos ADD COLUMN is_restored BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna is_restored agregada a archived_todos';
    ELSE
        RAISE NOTICE 'Columna is_restored ya existe en archived_todos';
    END IF;
END $$;

-- Agregar columna restored_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_todos' AND column_name = 'restored_at'
    ) THEN
        ALTER TABLE archived_todos ADD COLUMN restored_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna restored_at agregada a archived_todos';
    ELSE
        RAISE NOTICE 'Columna restored_at ya existe en archived_todos';
    END IF;
END $$;

-- Agregar columna restored_by si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archived_todos' AND column_name = 'restored_by'
    ) THEN
        ALTER TABLE archived_todos ADD COLUMN restored_by UUID;
        RAISE NOTICE 'Columna restored_by agregada a archived_todos';
    ELSE
        RAISE NOTICE 'Columna restored_by ya existe en archived_todos';
    END IF;
END $$;

-- Crear índice para is_restored si no existe
CREATE INDEX IF NOT EXISTS idx_archived_todos_is_restored ON archived_todos(is_restored);

-- Crear índice para restored_at si no existe
CREATE INDEX IF NOT EXISTS idx_archived_todos_restored_at ON archived_todos(restored_at);

-- ================================================================
-- VERIFICACIÓN
-- ================================================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'archived_cases' 
    AND column_name IN ('is_restored', 'restored_at', 'restored_by');
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ Todas las columnas de restauración existen en archived_cases';
    ELSE
        RAISE WARNING '⚠️ Faltan columnas en archived_cases. Columnas encontradas: %', col_count;
    END IF;
    
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'archived_todos' 
    AND column_name IN ('is_restored', 'restored_at', 'restored_by');
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ Todas las columnas de restauración existen en archived_todos';
    ELSE
        RAISE WARNING '⚠️ Faltan columnas en archived_todos. Columnas encontradas: %', col_count;
    END IF;
END $$;
