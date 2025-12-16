-- Migración para crear tabla de sesiones de usuario
-- Fecha: 16 de diciembre de 2025
-- Propósito: Implementar sistema de sesión única por usuario

-- Crear tabla user_sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(64),
    device_info JSONB,
    ip_address INET,
    location_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) 
        REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_user_sessions_user_id_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sessions_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE user_sessions IS 'Almacena sesiones activas de usuarios para control de sesión única';
COMMENT ON COLUMN user_sessions.id IS 'Identificador único de la sesión';
COMMENT ON COLUMN user_sessions.user_id IS 'Referencia al usuario propietario de la sesión';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hash SHA-256 del JWT token para identificación segura';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'Hash SHA-256 del refresh token';
COMMENT ON COLUMN user_sessions.device_info IS 'Información del dispositivo/navegador (JSON)';
COMMENT ON COLUMN user_sessions.ip_address IS 'Dirección IP desde donde se creó la sesión';
COMMENT ON COLUMN user_sessions.location_info IS 'Información geográfica aproximada (JSON)';
COMMENT ON COLUMN user_sessions.is_active IS 'Indica si la sesión está activa';
COMMENT ON COLUMN user_sessions.expires_at IS 'Fecha y hora de expiración de la sesión';
COMMENT ON COLUMN user_sessions.last_activity_at IS 'Última actividad registrada en la sesión';
COMMENT ON COLUMN user_sessions.logout_reason IS 'Razón del cierre de sesión (manual, forced, expired, new_login)';

-- Función para limpiar sesiones expiradas (para ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = false, 
        logout_reason = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = true 
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Limpia sesiones expiradas marcándolas como inactivas';