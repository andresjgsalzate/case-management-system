-- =========================================
-- SCRIPT PARA cms_admin: AGREGAR VALORES AL ENUM
-- Ejecutar DESPUÉS de cambiar el ownership del enum
-- =========================================

-- Verificar valores actuales del enum
SELECT 
    'Valores actuales del enum:' as info,
    enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

-- Agregar valores nuevos (solo si no existen)
DO $$
BEGIN
    -- LOGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'LOGIN' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGIN';
        RAISE NOTICE 'Agregado: LOGIN';
    ELSE
        RAISE NOTICE 'LOGIN ya existe';
    END IF;

    -- LOGOUT
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'LOGOUT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT';
        RAISE NOTICE 'Agregado: LOGOUT';
    ELSE
        RAISE NOTICE 'LOGOUT ya existe';
    END IF;

    -- LOGOUT_ALL
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'LOGOUT_ALL' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        ALTER TYPE audit_logs_action_enum ADD VALUE 'LOGOUT_ALL';
        RAISE NOTICE 'Agregado: LOGOUT_ALL';
    ELSE
        RAISE NOTICE 'LOGOUT_ALL ya existe';
    END IF;

    -- FORCE_LOGOUT
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'FORCE_LOGOUT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
    ) THEN
        ALTER TYPE audit_logs_action_enum ADD VALUE 'FORCE_LOGOUT';
        RAISE NOTICE 'Agregado: FORCE_LOGOUT';
    ELSE
        RAISE NOTICE 'FORCE_LOGOUT ya existe';
    END IF;
END
$$;

-- Verificar resultado final
SELECT 
    'Valores finales del enum:' as info,
    enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

SELECT 'ENUM ACTUALIZADO CORRECTAMENTE' as status;