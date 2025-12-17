-- =========================================
-- SCRIPT SUPERUSUARIO: SOLUCIONAR ENUM audit_logs_action_enum
-- Ejecutar como usuario postgres (superuser) 
-- =========================================

-- Agregar valores faltantes al enum audit_logs_action_enum
-- PostgreSQL no soporta IF NOT EXISTS en ADD VALUE, usar solo ADD VALUE
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGIN';
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT';
ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT_ALL';
ALTER TYPE audit_logs_action_enum ADD VALUE 'FORCE_LOGOUT';

-- Verificar valores del enum
SELECT 
    'Valores del enum audit_logs_action_enum:' as info,
    enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

SELECT 'ENUM ARREGLADO - EJECUTAR COMO SUPERUSER POSTGRES' as status;