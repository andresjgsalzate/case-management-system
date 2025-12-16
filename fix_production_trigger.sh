#!/bin/bash

# Script para corregir el error de trigger en producción
# Ejecutar en el servidor de producción

echo "🔧 Corrigiendo función de trigger en PostgreSQL..."

# Conectar a PostgreSQL y ejecutar la corrección
sudo -u postgres psql case_management_db << 'EOF'

-- Corregir función de trigger que causa error en production
-- El problema: La función usa "updatedAt" pero la columna es "updated_at"

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recrear triggers para knowledge_documents específicamente
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar que el trigger esté creado correctamente
\dt knowledge_documents
\d knowledge_documents

EOF

echo "✅ Corrección aplicada. Reiniciando PM2..."

# Reiniciar PM2
pm2 restart cms-backend

echo "🚀 Sistema corregido y reiniciado"