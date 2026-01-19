-- Migración: Agregar campos de geolocalización de IP a audit_logs
-- Fecha: 2026-01-19
-- Descripción: Integración con ip.guide para enriquecer datos de auditoría

-- Agregar columnas de ubicación geográfica
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_country VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(100),
ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8);

-- Agregar columnas de red
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_network_cidr VARCHAR(50);

-- Agregar columnas de ISP/ASN
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_asn INTEGER,
ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_organization VARCHAR(255);

-- Agregar columna de metadatos de enriquecimiento
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_enrichment_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_is_private BOOLEAN DEFAULT FALSE;

-- Crear índices para consultas frecuentes por ubicación
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_country ON audit_logs(ip_country);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_city ON audit_logs(ip_city);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_asn ON audit_logs(ip_asn);

-- Comentarios en columnas
COMMENT ON COLUMN audit_logs.ip_city IS 'Ciudad detectada desde la IP del usuario';
COMMENT ON COLUMN audit_logs.ip_country IS 'País detectado desde la IP del usuario';
COMMENT ON COLUMN audit_logs.ip_country_code IS 'Código ISO del país (ej: CO, US, ES)';
COMMENT ON COLUMN audit_logs.ip_timezone IS 'Zona horaria detectada (ej: America/Bogota)';
COMMENT ON COLUMN audit_logs.ip_latitude IS 'Latitud aproximada de la ubicación';
COMMENT ON COLUMN audit_logs.ip_longitude IS 'Longitud aproximada de la ubicación';
COMMENT ON COLUMN audit_logs.ip_network_cidr IS 'Bloque de red CIDR al que pertenece la IP';
COMMENT ON COLUMN audit_logs.ip_asn IS 'Número de Sistema Autónomo (ASN) del ISP';
COMMENT ON COLUMN audit_logs.ip_isp IS 'Nombre del proveedor de servicios de internet';
COMMENT ON COLUMN audit_logs.ip_organization IS 'Organización propietaria del bloque de IP';
COMMENT ON COLUMN audit_logs.ip_enrichment_source IS 'Fuente de los datos de IP (ip.guide, local, fallback)';
COMMENT ON COLUMN audit_logs.ip_is_private IS 'Indica si la IP es privada/local';
