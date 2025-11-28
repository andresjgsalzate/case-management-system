-- Migración: Datos Iniciales del Sistema de Equipos
-- Descripción: Insertar equipos por defecto y configuración inicial
-- Fecha: 2025-11-21
-- Autor: Sistema de Gestión de Casos

-- ============================================
-- INSERTAR EQUIPOS POR DEFECTO
-- ============================================

-- Nota: Usando UUIDs fijos para que sean predecibles en desarrollo
-- En producción, se pueden generar automáticamente

INSERT INTO teams (id, name, code, description, color, "isActive", "createdAt", "updatedAt") VALUES

-- Equipo de Desarrollo
('10000000-0000-0000-0000-000000000001', 
 'Desarrollo', 
 'DEV', 
 'Equipo encargado del desarrollo de software, programación y creación de nuevas funcionalidades del sistema', 
 '#007ACC', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Soporte de Aplicaciones
('10000000-0000-0000-0000-000000000002', 
 'Soporte de Aplicaciones', 
 'SUPP', 
 'Equipo responsable del soporte técnico, mantenimiento de aplicaciones y resolución de incidencias', 
 '#28A745', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Infraestructura
('10000000-0000-0000-0000-000000000003', 
 'Infraestructura', 
 'INFRA', 
 'Equipo encargado de la infraestructura tecnológica, servidores, redes y operaciones de TI', 
 '#DC3545', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Control de Calidad
('10000000-0000-0000-0000-000000000004', 
 'Control de Calidad', 
 'QA', 
 'Equipo de control de calidad, testing, validación y aseguramiento de la calidad del software', 
 '#FFC107', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Análisis de Negocio
('10000000-0000-0000-0000-000000000005', 
 'Análisis de Negocio', 
 'BA', 
 'Equipo de análisis de negocio, requerimientos, documentación y coordinación con stakeholders', 
 '#6F42C1', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Seguridad
('10000000-0000-0000-0000-000000000006', 
 'Seguridad', 
 'SEC', 
 'Equipo especializado en seguridad informática, auditorías y protección de datos', 
 '#FD7E14', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Gestión de Proyectos
('10000000-0000-0000-0000-000000000007', 
 'Gestión de Proyectos', 
 'PM', 
 'Equipo de gestión de proyectos, coordinación, planificación y seguimiento de iniciativas', 
 '#20C997', 
 true, 
 NOW(), 
 NOW()),

-- Equipo de Arquitectura
('10000000-0000-0000-0000-000000000008', 
 'Arquitectura', 
 'ARCH', 
 'Equipo de arquitectura de software, diseño de sistemas y estándares técnicos', 
 '#6610F2', 
 true, 
 NOW(), 
 NOW())

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    "updatedAt" = NOW();

-- ============================================
-- CREAR EQUIPOS ADICIONALES OPCIONALES
-- ============================================

-- Equipo Temporal para usuarios sin asignación específica
INSERT INTO teams (id, name, code, description, color, "isActive", "createdAt", "updatedAt") VALUES
('10000000-0000-0000-0000-000000000099', 
 'Sin Asignar', 
 'UNASSIGN', 
 'Equipo temporal para usuarios que aún no han sido asignados a un equipo específico', 
 '#6C757D', 
 true, 
 NOW(), 
 NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CONFIGURACIÓN INICIAL DE EQUIPOS
-- ============================================

-- Función para asignar automáticamente administradores como managers de equipos clave
DO $$
DECLARE
    admin_user_id UUID;
    team_rec RECORD;
BEGIN
    -- Buscar el primer usuario administrador
    SELECT up.id INTO admin_user_id 
    FROM user_profiles up 
    JOIN roles r ON up."roleId" = r.id 
    WHERE r.name = 'Administrador' 
    AND up."isActive" = true 
    LIMIT 1;

    -- Si existe un administrador, asignarlo como manager de equipos clave
    IF admin_user_id IS NOT NULL THEN
        
        -- Asignar como manager de equipos principales
        UPDATE teams 
        SET "managerId" = admin_user_id, "updatedAt" = NOW()
        WHERE code IN ('DEV', 'INFRA', 'PM') 
        AND "managerId" IS NULL;

        -- Crear membresías automáticas para el administrador en equipos clave
        INSERT INTO team_members ("teamId", "userId", role, "isActive", "joinedAt", "createdAt", "updatedAt")
        SELECT 
            t.id, 
            admin_user_id, 
            'manager', 
            true, 
            NOW(), 
            NOW(), 
            NOW()
        FROM teams t
        WHERE t.code IN ('DEV', 'INFRA', 'PM')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Administrador asignado como manager de equipos clave';
    ELSE
        RAISE NOTICE 'No se encontró usuario administrador para asignar como manager';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN Y ESTADÍSTICAS
-- ============================================

-- Verificar que los equipos se crearon correctamente
DO $$
DECLARE
    teams_count INTEGER;
    active_teams_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO teams_count FROM teams;
    SELECT COUNT(*) INTO active_teams_count FROM teams WHERE "isActive" = true;
    
    RAISE NOTICE 'Equipos creados: %', teams_count;
    RAISE NOTICE 'Equipos activos: %', active_teams_count;
    
    IF teams_count < 8 THEN
        RAISE EXCEPTION 'Error: No se crearon suficientes equipos (esperados: 8+, encontrados: %)', teams_count;
    END IF;
END $$;

-- ============================================
-- CREAR VISTA PARA ESTADÍSTICAS DE EQUIPOS
-- ============================================

-- Vista que muestra estadísticas básicas de equipos
CREATE OR REPLACE VIEW team_stats AS
SELECT 
    t.id,
    t.name,
    t.code,
    t.color,
    t."isActive",
    COUNT(tm.id) as total_members,
    COUNT(CASE WHEN tm."isActive" = true THEN 1 END) as active_members,
    COUNT(CASE WHEN tm.role = 'manager' AND tm."isActive" = true THEN 1 END) as managers,
    COUNT(CASE WHEN tm.role = 'lead' AND tm."isActive" = true THEN 1 END) as leads,
    COUNT(CASE WHEN tm.role = 'senior' AND tm."isActive" = true THEN 1 END) as seniors,
    COUNT(CASE WHEN tm.role = 'member' AND tm."isActive" = true THEN 1 END) as members,
    MAX(tm."joinedAt") as last_member_joined,
    t."createdAt",
    t."updatedAt"
FROM teams t
LEFT JOIN team_members tm ON t.id = tm."teamId"
GROUP BY t.id, t.name, t.code, t.color, t."isActive", t."createdAt", t."updatedAt"
ORDER BY t.name;

-- Comentario sobre la vista
COMMENT ON VIEW team_stats IS 'Vista que proporciona estadísticas básicas de equipos y sus miembros';

-- ============================================
-- MOSTRAR RESUMEN FINAL
-- ============================================

-- Mostrar equipos creados
SELECT 
    name as "Equipo",
    code as "Código",
    color as "Color",
    CASE WHEN "isActive" THEN 'Activo' ELSE 'Inactivo' END as "Estado",
    description as "Descripción"
FROM teams 
ORDER BY name;

RAISE NOTICE 'Migración de datos iniciales de equipos completada exitosamente';