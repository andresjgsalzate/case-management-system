-- =========================================
-- MIGRACIÓN: TABLAS DE ENTRADAS DE TIEMPO PARA CASOS
-- Fecha: 2025-11-13
-- Descripción: Crear tablas time_entries y manual_time_entries para casos si no existen
-- =========================================

-- Crear tabla de entradas de tiempo del cronómetro para casos
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseControlId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ,
    "durationMinutes" INTEGER DEFAULT 0,
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Claves foráneas
    CONSTRAINT FK_time_entries_case_control FOREIGN KEY ("caseControlId") 
        REFERENCES case_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_time_entries_user FOREIGN KEY ("userId") 
        REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Crear tabla de entradas de tiempo manual para casos
CREATE TABLE IF NOT EXISTS manual_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseControlId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    date VARCHAR(10) NOT NULL, -- Formato YYYY-MM-DD
    "durationMinutes" INTEGER NOT NULL,
    description TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Claves foráneas
    CONSTRAINT FK_manual_time_entries_case_control FOREIGN KEY ("caseControlId") 
        REFERENCES case_control(id) ON DELETE CASCADE,
    CONSTRAINT FK_manual_time_entries_user FOREIGN KEY ("userId") 
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT FK_manual_time_entries_created_by FOREIGN KEY ("createdBy") 
        REFERENCES user_profiles(id) ON DELETE RESTRICT
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_time_entries_case_control ON time_entries("caseControlId");
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries("userId");
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries("startTime");

CREATE INDEX IF NOT EXISTS idx_manual_time_entries_case_control ON manual_time_entries("caseControlId");
CREATE INDEX IF NOT EXISTS idx_manual_time_entries_user ON manual_time_entries("userId");
CREATE INDEX IF NOT EXISTS idx_manual_time_entries_date ON manual_time_entries(date);

-- Crear triggers para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para time_entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_entries_updated_at') THEN
        CREATE TRIGGER update_time_entries_updated_at
            BEFORE UPDATE ON time_entries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para manual_time_entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_manual_time_entries_updated_at') THEN
        CREATE TRIGGER update_manual_time_entries_updated_at
            BEFORE UPDATE ON manual_time_entries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE time_entries IS 'Entradas de tiempo del cronómetro automático para casos';
COMMENT ON TABLE manual_time_entries IS 'Entradas de tiempo agregadas manualmente para casos';

COMMENT ON COLUMN time_entries.description IS 'Descripción de las actividades realizadas durante el tiempo registrado';
COMMENT ON COLUMN manual_time_entries.description IS 'Descripción detallada de las actividades realizadas (mínimo 10 caracteres)';

-- Verificar que las tablas se crearon correctamente
SELECT 
    'Tablas de tiempo para casos creadas:' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'time_entries') +
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'manual_time_entries') as total_tables;

-- Mostrar estructura de las tablas creadas
SELECT 'time_entries columns:' as table_info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
ORDER BY ordinal_position;

SELECT 'manual_time_entries columns:' as table_info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'manual_time_entries' 
ORDER BY ordinal_position;