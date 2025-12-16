-- =====================================================
-- CORRECCIÓN URGENTE PARA PRODUCCIÓN: user_profiles trigger
-- Error: record "new" has no field "updated_at"
-- =====================================================

-- El problema ocurre porque:
-- 1. TypeORM usa "updatedAt" (camelCase) en el código
-- 2. Pero PostgreSQL espera "updated_at" (snake_case) por el trigger
-- 3. La entidad fue actualizada para mapear correctamente

-- Verificar si existe el trigger problemático
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'user_profiles'
  AND t.action_statement LIKE '%update_updated_at_column%';

-- Eliminar el trigger problemático si existe
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Mensaje de confirmación
SELECT 'Trigger problemático eliminado. TypeORM manejará updated_at automáticamente.' as resultado;

-- Verificar estructura de la tabla user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('created_at', 'updated_at', 'createdAt', 'updatedAt')
ORDER BY column_name;