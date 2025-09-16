-- Migración para agregar campos de éxito de operación a la tabla audit_logs
-- Fecha: 2025-09-16
-- Descripción: Agregar columnas operation_success y error_message para mejor tracking del estado de las operaciones

-- Agregar columna operation_success con valor por defecto true
ALTER TABLE audit_logs 
ADD COLUMN operation_success BOOLEAN NOT NULL DEFAULT true;

-- Agregar columna error_message para almacenar mensajes de error
ALTER TABLE audit_logs 
ADD COLUMN error_message TEXT;

-- Actualizar registros existentes para marcarlos como exitosos por defecto
UPDATE audit_logs 
SET operation_success = true 
WHERE operation_success IS NULL;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN audit_logs.operation_success IS 'Indica si la operación fue exitosa (true) o falló (false)';
COMMENT ON COLUMN audit_logs.error_message IS 'Mensaje de error en caso de que la operación haya fallado';

-- Crear índice en operation_success para consultas de filtrado por estado
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_success ON audit_logs(operation_success);

-- Crear índice compuesto para consultas frecuentes de auditoría con filtro de éxito
CREATE INDEX IF NOT EXISTS idx_audit_logs_success_created_at ON audit_logs(operation_success, created_at DESC);
