-- ============================================
-- Migración: Agregar rol "Usuario" para nuevos registros
-- Fecha: 2026-03-05
-- Descripción: Crea el rol Usuario que se asigna automáticamente
--              a los usuarios que se registran en el sistema.
--              Este rol NO tiene permisos asignados por defecto,
--              un administrador debe asignar los permisos manualmente.
-- ============================================

-- Insertar rol Usuario por defecto (sin permisos)
INSERT INTO roles (id, name, description, "isActive")
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Usuario',
    'Rol por defecto para usuarios registrados. Sin permisos asignados hasta que un administrador los configure.',
    true
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- Nota: Este rol intencionalmente NO tiene permisos asignados.
-- El flujo esperado es:
-- 1. Usuario se registra -> Se le asigna rol "Usuario"
-- 2. Usuario ve pantalla indicando que debe contactar administrador
-- 3. Administrador asigna permisos según las necesidades
