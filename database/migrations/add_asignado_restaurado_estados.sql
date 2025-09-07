-- Migración para agregar estados ASIGNADO y RESTAURADO al enum EstadoCase
-- Fecha: 7 de septiembre de 2025

-- Agregar los nuevos valores al enum cases_estado_enum
ALTER TYPE cases_estado_enum ADD VALUE IF NOT EXISTS 'asignado';
ALTER TYPE cases_estado_enum ADD VALUE IF NOT EXISTS 'restaurado';

-- Comentario sobre los nuevos estados
COMMENT ON TYPE cases_estado_enum IS 'Estados de los casos: nuevo, asignado, en_progreso, pendiente, resuelto, cerrado, cancelado, restaurado';

-- Opcional: Actualizar casos existentes que puedan beneficiarse de estos estados
-- (Ejecutar solo si es necesario)
-- UPDATE cases SET estado = 'asignado' WHERE assigned_to_id IS NOT NULL AND estado = 'nuevo';
