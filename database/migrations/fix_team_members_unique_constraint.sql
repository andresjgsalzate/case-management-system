-- Migración: Corregir constraint único en team_members
-- Descripción: Eliminar constraint único incorrecto y asegurar que existe el índice parcial correcto
-- Fecha: 2025-01-21
-- Autor: Sistema de Gestión de Casos

-- Eliminar constraint único incorrecto si existe (creado por TypeORM)
-- Este constraint previene cualquier duplicado, incluso inactivos
DROP INDEX IF EXISTS "IDX_unique_team_user_active";
DROP INDEX IF EXISTS "unique_team_user_active";

-- Asegurar que existe el índice único parcial correcto
-- Solo previene duplicados cuando isActive = true
DROP INDEX IF EXISTS unique_team_user_active;
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_user_active
ON team_members("teamId", "userId")
WHERE "isActive" = true;

-- Verificar que el índice se creó correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'team_members' 
        AND indexname = 'unique_team_user_active'
    ) THEN
        RAISE EXCEPTION 'Error: No se pudo crear el índice único parcial unique_team_user_active';
    END IF;
    
    RAISE NOTICE 'Índice único parcial unique_team_user_active verificado correctamente';
END $$;

-- Comentario para documentación
COMMENT ON INDEX unique_team_user_active IS 'Índice único parcial que previene membresías duplicadas activas en el mismo equipo';