-- Crear tabla para Disposiciones de Scripts
-- Esta tabla gestiona las solicitudes de disposición para scripts en aplicaciones

CREATE TABLE IF NOT EXISTS dispositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    case_id UUID,
    case_number VARCHAR NOT NULL,
    script_name TEXT NOT NULL,
    svn_revision_number TEXT,
    application_id UUID NOT NULL,
    observations TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT dispositions_case_number_format CHECK (case_number ~ '^[A-Z0-9-]+$'),
    CONSTRAINT dispositions_date_not_future CHECK (date <= CURRENT_DATE),
    
    -- Foreign Keys
    CONSTRAINT fk_dispositions_case_id FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    CONSTRAINT fk_dispositions_application_id FOREIGN KEY (application_id) REFERENCES aplicaciones(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispositions_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE RESTRICT
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_dispositions_date ON dispositions(date);
CREATE INDEX IF NOT EXISTS idx_dispositions_case_number ON dispositions(case_number);
CREATE INDEX IF NOT EXISTS idx_dispositions_application_id ON dispositions(application_id);
CREATE INDEX IF NOT EXISTS idx_dispositions_user_id ON dispositions(user_id);
CREATE INDEX IF NOT EXISTS idx_dispositions_created_at ON dispositions(created_at);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_dispositions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER trigger_update_dispositions_updated_at
    BEFORE UPDATE ON dispositions
    FOR EACH ROW
    EXECUTE FUNCTION update_dispositions_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE dispositions IS 'Gestión de solicitudes de disposición para scripts en aplicaciones';
COMMENT ON COLUMN dispositions.date IS 'Fecha de la disposición';
COMMENT ON COLUMN dispositions.case_id IS 'ID del caso (puede ser NULL si el caso fue archivado)';
COMMENT ON COLUMN dispositions.case_number IS 'Número del caso (formato: letras mayúsculas, números y guiones)';
COMMENT ON COLUMN dispositions.script_name IS 'Nombre del script';
COMMENT ON COLUMN dispositions.svn_revision_number IS 'Número de revisión SVN (opcional)';
COMMENT ON COLUMN dispositions.application_id IS 'ID de la aplicación';
COMMENT ON COLUMN dispositions.observations IS 'Observaciones adicionales (opcional)';
COMMENT ON COLUMN dispositions.user_id IS 'ID del usuario que creó la disposición';
