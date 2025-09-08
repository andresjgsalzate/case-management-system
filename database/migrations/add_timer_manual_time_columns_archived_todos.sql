-- Agregar columnas para tiempo de timer y tiempo manual en archived_todos
-- Fecha: 2025-09-07
-- Descripción: Añadir columnas timer_time_minutes y manual_time_minutes para separar tipos de tiempo

ALTER TABLE archived_todos 
ADD COLUMN timer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN manual_time_minutes INTEGER DEFAULT 0;

-- Agregar comentarios para claridad
COMMENT ON COLUMN archived_todos.timer_time_minutes IS 'Tiempo acumulado de entradas de timer en minutos';
COMMENT ON COLUMN archived_todos.manual_time_minutes IS 'Tiempo acumulado de entradas manuales en minutos';
