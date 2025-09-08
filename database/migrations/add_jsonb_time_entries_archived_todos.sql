-- Agregar campos JSONB para timer_entries y manual_time_entries a archived_todos
-- para replicar el funcionamiento exitoso de archived_cases
-- Fecha: 2025-09-07
-- Descripción: Añadir campos JSONB para almacenar arrays de entradas de tiempo

ALTER TABLE archived_todos 
ADD COLUMN timer_entries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN manual_time_entries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN metadata JSONB DEFAULT NULL;

-- Agregar comentarios para claridad
COMMENT ON COLUMN archived_todos.timer_entries IS 'Array JSONB de entradas de cronómetro automático';
COMMENT ON COLUMN archived_todos.manual_time_entries IS 'Array JSONB de entradas de tiempo manual';
COMMENT ON COLUMN archived_todos.metadata IS 'Metadatos adicionales del TODO archivado';

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_archived_todos_timer_entries ON archived_todos USING GIN (timer_entries);
CREATE INDEX IF NOT EXISTS idx_archived_todos_manual_time_entries ON archived_todos USING GIN (manual_time_entries);
CREATE INDEX IF NOT EXISTS idx_archived_todos_metadata ON archived_todos USING GIN (metadata);
