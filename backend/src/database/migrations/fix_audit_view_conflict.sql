-- Migración para solucionar el conflicto con la vista audit_logs_with_changes
-- Esta migración elimina la vista que causa el conflicto y permite que TypeORM recree las entidades

-- Primero, eliminar la vista que depende de la columna change_type
DROP VIEW IF EXISTS audit_logs_with_changes CASCADE;

-- También eliminar cualquier otra vista o función que pueda depender de las tablas de auditoría
DROP VIEW IF EXISTS vw_audit_logs_with_changes CASCADE;
DROP VIEW IF EXISTS view_audit_logs_with_changes CASCADE;

-- Verificar si existen índices o restricciones adicionales que puedan causar conflictos
-- TypeORM recreará estos automáticamente según las definiciones en las entidades

COMMIT;
