-- Agregar columna is_restored a las tablas de archivado
-- Fecha: 2025-09-07
-- Descripción: Agregar columna para rastrear elementos que han sido restaurados

-- Agregar columna is_restored a archived_cases
ALTER TABLE archived_cases ADD COLUMN IF NOT EXISTS is_restored BOOLEAN DEFAULT FALSE;

-- Agregar columna is_restored a archived_todos  
ALTER TABLE archived_todos ADD COLUMN IF NOT EXISTS is_restored BOOLEAN DEFAULT FALSE;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_archived_cases_is_restored ON archived_cases(is_restored);
CREATE INDEX IF NOT EXISTS idx_archived_todos_is_restored ON archived_todos(is_restored);

-- Comentarios en las columnas
COMMENT ON COLUMN archived_cases.is_restored IS 'Indica si este elemento archivado ha sido restaurado';
COMMENT ON COLUMN archived_todos.is_restored IS 'Indica si este elemento archivado ha sido restaurado';
