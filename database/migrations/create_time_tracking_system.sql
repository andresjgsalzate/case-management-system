-- =========================================
-- MIGRACIÓN: SISTEMA DE TRACKING DE TIEMPO PARA DASHBOARD
-- Fecha: 2025-09-03
-- Descripción: Crear tablas para rastreo de tiempo en casos, TODOs y aplicaciones
-- =========================================

-- Crear tabla para aplicaciones (sistemas/herramientas usadas)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50), -- 'system', 'tool', 'external', etc.
    icon VARCHAR(50), -- nombre del icono para UI
    color VARCHAR(7), -- color hex para UI
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para tracking de tiempo en casos
CREATE TABLE IF NOT EXISTS case_time_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseId" UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "applicationId" UUID REFERENCES applications(id) ON DELETE SET NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ,
    "totalMinutes" INTEGER, -- calculado automáticamente
    description TEXT, -- descripción de la actividad
    "isActive" BOOLEAN DEFAULT false, -- true si el timer está corriendo
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para tracking de tiempo en TODOs
CREATE TABLE IF NOT EXISTS todo_time_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "todoId" UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "applicationId" UUID REFERENCES applications(id) ON DELETE SET NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ,
    "totalMinutes" INTEGER, -- calculado automáticamente
    description TEXT, -- descripción de la actividad
    "isActive" BOOLEAN DEFAULT false, -- true si el timer está corriendo
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna de tiempo total a la tabla todos si no existe
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS "totalTimeMinutes" INTEGER DEFAULT 0;

-- Crear tabla para estados de casos con colores
CREATE TABLE IF NOT EXISTS case_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) NOT NULL, -- color hex
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna de estado a casos si no existe
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS "statusId" UUID REFERENCES case_statuses(id);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_case_time_tracking_case_id ON case_time_tracking("caseId");
CREATE INDEX IF NOT EXISTS idx_case_time_tracking_user_id ON case_time_tracking("userId");
CREATE INDEX IF NOT EXISTS idx_case_time_tracking_start_time ON case_time_tracking("startTime");
CREATE INDEX IF NOT EXISTS idx_case_time_tracking_active ON case_time_tracking("isActive");

CREATE INDEX IF NOT EXISTS idx_todo_time_tracking_todo_id ON todo_time_tracking("todoId");
CREATE INDEX IF NOT EXISTS idx_todo_time_tracking_user_id ON todo_time_tracking("userId");
CREATE INDEX IF NOT EXISTS idx_todo_time_tracking_start_time ON todo_time_tracking("startTime");
CREATE INDEX IF NOT EXISTS idx_todo_time_tracking_active ON todo_time_tracking("isActive");

CREATE INDEX IF NOT EXISTS idx_applications_active ON applications("isActive");
CREATE INDEX IF NOT EXISTS idx_case_statuses_active ON case_statuses("isActive");

-- Crear triggers para actualizar updatedAt
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_time_tracking_updated_at 
    BEFORE UPDATE ON case_time_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_time_tracking_updated_at 
    BEFORE UPDATE ON todo_time_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_statuses_updated_at 
    BEFORE UPDATE ON case_statuses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar aplicaciones por defecto
INSERT INTO applications (name, description, category, icon, color) VALUES
('Sistema CRM', 'Sistema principal de gestión de casos', 'system', 'ComputerDesktopIcon', '#3B82F6'),
('Email', 'Cliente de correo electrónico', 'communication', 'EnvelopeIcon', '#10B981'),
('Teléfono', 'Llamadas telefónicas', 'communication', 'PhoneIcon', '#F59E0B'),
('Navegador Web', 'Investigación y consultas web', 'tool', 'GlobeAltIcon', '#8B5CF6'),
('Base de Datos', 'Consultas directas a BD', 'system', 'CircleStackIcon', '#EF4444'),
('Documentación', 'Consulta de manuales y guías', 'reference', 'DocumentTextIcon', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insertar estados de casos por defecto
INSERT INTO case_statuses (name, description, color, "sortOrder", "isDefault") VALUES
('Nuevo', 'Caso recién creado', '#3B82F6', 1, true),
('En Progreso', 'Caso siendo trabajado', '#F59E0B', 2, false),
('Pendiente Cliente', 'Esperando respuesta del cliente', '#8B5CF6', 3, false),
('Pendiente Interno', 'Esperando acción interna', '#EC4899', 4, false),
('Resuelto', 'Caso resuelto satisfactoriamente', '#10B981', 5, false),
('Cerrado', 'Caso cerrado', '#6B7280', 6, false),
('Escalado', 'Caso escalado a siguiente nivel', '#EF4444', 7, false)
ON CONFLICT (name) DO NOTHING;

-- Función para calcular tiempo automáticamente al cerrar timer
CREATE OR REPLACE FUNCTION calculate_time_on_stop()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo calcular si se está cerrando un timer activo
    IF OLD."isActive" = true AND NEW."isActive" = false AND NEW."endTime" IS NOT NULL THEN
        NEW."totalMinutes" = EXTRACT(EPOCH FROM (NEW."endTime" - NEW."startTime")) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para cálculo automático de tiempo
CREATE TRIGGER calculate_case_time_on_stop
    BEFORE UPDATE ON case_time_tracking
    FOR EACH ROW EXECUTE FUNCTION calculate_time_on_stop();

CREATE TRIGGER calculate_todo_time_on_stop
    BEFORE UPDATE ON todo_time_tracking
    FOR EACH ROW EXECUTE FUNCTION calculate_time_on_stop();

-- Función para actualizar tiempo total en TODOs
CREATE OR REPLACE FUNCTION update_todo_total_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el tiempo total del TODO cuando se modifica el tracking
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE todos 
        SET "totalTimeMinutes" = (
            SELECT COALESCE(SUM("totalMinutes"), 0) 
            FROM todo_time_tracking 
            WHERE "todoId" = NEW."todoId"
        )
        WHERE id = NEW."todoId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE todos 
        SET "totalTimeMinutes" = (
            SELECT COALESCE(SUM("totalMinutes"), 0) 
            FROM todo_time_tracking 
            WHERE "todoId" = OLD."todoId"
        )
        WHERE id = OLD."todoId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar tiempo total en TODOs
CREATE TRIGGER update_todo_total_time_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todo_time_tracking
    FOR EACH ROW EXECUTE FUNCTION update_todo_total_time();

-- Asignar estado por defecto a casos existentes sin estado
UPDATE cases 
SET "statusId" = (SELECT id FROM case_statuses WHERE "isDefault" = true LIMIT 1)
WHERE "statusId" IS NULL;

-- Verificar que las tablas se crearon correctamente
SELECT 
    'Tablas de tracking creadas:' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'case_time_tracking') +
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'todo_time_tracking') +
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'applications') +
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'case_statuses') as total_tables;

-- Mostrar aplicaciones y estados creados
SELECT 'Aplicaciones creadas:', COUNT(*) FROM applications;
SELECT 'Estados creados:', COUNT(*) FROM case_statuses;
