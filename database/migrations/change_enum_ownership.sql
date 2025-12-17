-- =========================================
-- SCRIPT PARA VERIFICAR Y CAMBIAR OWNERSHIP DEL ENUM
-- Ejecutar como superuser postgres PRIMERO
-- =========================================

-- 1. Verificar el propietario actual del enum
SELECT 
    t.typname as enum_name,
    pg_catalog.pg_get_userbyid(t.typowner) as owner
FROM pg_type t 
WHERE t.typname = 'audit_logs_action_enum';

-- 2. Cambiar propietario del enum a cms_admin para que pueda modificarlo
ALTER TYPE audit_logs_action_enum OWNER TO cms_admin;

-- 3. Verificar el cambio
SELECT 
    t.typname as enum_name,
    pg_catalog.pg_get_userbyid(t.typowner) as new_owner
FROM pg_type t 
WHERE t.typname = 'audit_logs_action_enum';

SELECT 'OWNERSHIP CAMBIADO - Ahora cms_admin puede modificar el enum' as status;