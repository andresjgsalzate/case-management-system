-- Migración: Sistema de Equipos
-- Descripción: Crear tablas teams y team_members para el sistema de equipos
-- Fecha: 2025-11-21
-- Autor: Sistema de Gestión de Casos

-- Verificar que existe la función para actualizar updated_at
-- Si no existe, crearla
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Formato hex: #FF5733
    "managerId" UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT teams_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT teams_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT teams_code_format CHECK (code ~ '^[A-Z0-9_-]+$'),
    CONSTRAINT teams_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Crear tabla de miembros de equipo
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamId" UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'senior', 'member')),
    "isActive" BOOLEAN DEFAULT true,
    "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
    "leftAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT team_members_valid_dates CHECK ("leftAt" IS NULL OR "leftAt" >= "joinedAt")
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams("managerId") WHERE "managerId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members("teamId");
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members("userId");
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Índice único para evitar membresías duplicadas activas
-- Un usuario no puede estar activo en el mismo equipo más de una vez
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_user_active
ON team_members("teamId", "userId")
WHERE "isActive" = true;

-- Índice para búsquedas por fecha de ingreso y salida
CREATE INDEX IF NOT EXISTS idx_team_members_joined_at ON team_members("joinedAt");
CREATE INDEX IF NOT EXISTS idx_team_members_left_at ON team_members("leftAt") WHERE "leftAt" IS NOT NULL;

-- Triggers para mantener updatedAt actualizado
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para validar que el manager del equipo sea miembro del equipo
CREATE OR REPLACE FUNCTION validate_team_manager()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está asignando un manager
    IF NEW."managerId" IS NOT NULL THEN
        -- Verificar que el manager sea miembro activo del equipo
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE "teamId" = NEW.id 
            AND "userId" = NEW."managerId" 
            AND "isActive" = true
        ) THEN
            RAISE EXCEPTION 'El manager debe ser un miembro activo del equipo';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar manager
DROP TRIGGER IF EXISTS validate_manager_is_member ON teams;
CREATE TRIGGER validate_manager_is_member
    BEFORE INSERT OR UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION validate_team_manager();

-- Función para actualizar automáticamente el rol cuando se asigna como manager
CREATE OR REPLACE FUNCTION update_manager_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está asignando un nuevo manager
    IF NEW."managerId" IS NOT NULL AND (OLD."managerId" IS NULL OR OLD."managerId" != NEW."managerId") THEN
        -- Actualizar el rol del nuevo manager a 'manager'
        UPDATE team_members 
        SET role = 'manager', "updatedAt" = NOW()
        WHERE "teamId" = NEW.id 
        AND "userId" = NEW."managerId" 
        AND "isActive" = true;
        
        -- Si había un manager anterior, cambiar su rol a 'lead'
        IF OLD."managerId" IS NOT NULL THEN
            UPDATE team_members 
            SET role = 'lead', "updatedAt" = NOW()
            WHERE "teamId" = NEW.id 
            AND "userId" = OLD."managerId" 
            AND "isActive" = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar roles automáticamente
DROP TRIGGER IF EXISTS auto_update_manager_role ON teams;
CREATE TRIGGER auto_update_manager_role
    AFTER UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_manager_role();

-- Comentarios para documentación
COMMENT ON TABLE teams IS 'Tabla de equipos del sistema de gestión de casos';
COMMENT ON COLUMN teams.id IS 'Identificador único del equipo';
COMMENT ON COLUMN teams.name IS 'Nombre del equipo (único)';
COMMENT ON COLUMN teams.code IS 'Código corto del equipo (único, formato: MAYÚSCULAS, números, guiones)';
COMMENT ON COLUMN teams.description IS 'Descripción del propósito del equipo';
COMMENT ON COLUMN teams.color IS 'Color del equipo en formato hexadecimal (#RRGGBB)';
COMMENT ON COLUMN teams."managerId" IS 'ID del usuario que gestiona el equipo';
COMMENT ON COLUMN teams."isActive" IS 'Indica si el equipo está activo';

COMMENT ON TABLE team_members IS 'Tabla de miembros de equipos';
COMMENT ON COLUMN team_members.id IS 'Identificador único de la membresía';
COMMENT ON COLUMN team_members."teamId" IS 'ID del equipo';
COMMENT ON COLUMN team_members."userId" IS 'ID del usuario miembro';
COMMENT ON COLUMN team_members.role IS 'Rol del usuario en el equipo (manager, lead, senior, member)';
COMMENT ON COLUMN team_members."isActive" IS 'Indica si la membresía está activa';
COMMENT ON COLUMN team_members."joinedAt" IS 'Fecha de ingreso al equipo';
COMMENT ON COLUMN team_members."leftAt" IS 'Fecha de salida del equipo';

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        RAISE EXCEPTION 'Error: No se pudo crear la tabla teams';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        RAISE EXCEPTION 'Error: No se pudo crear la tabla team_members';
    END IF;
    
    RAISE NOTICE 'Tablas del sistema de equipos creadas exitosamente';
END $$;