#!/bin/bash

# =====================================================
# SCRIPT PARA EJECUTAR LA CORRECCIÓN EN PRODUCCIÓN
# =====================================================

echo "🔧 Iniciando corrección de PostgreSQL en producción..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 PASOS A SEGUIR:${NC}"
echo "1. Conectarse a PostgreSQL"
echo "2. Ejecutar corrección de función update_updated_at_column()"
echo "3. Reiniciar backend PM2"
echo "4. Verificar funcionamiento"

echo ""
echo -e "${YELLOW}🔑 Comandos para ejecutar en el servidor:${NC}"
echo ""

echo "# ===== PASO 1: Conectarse a PostgreSQL ====="
echo "sudo -u postgres psql case_management_db"
echo "# O alternativamente:"
echo "psql -h localhost -U cms_admin -d case_management_db"
echo ""

echo "# ===== PASO 2: Ejecutar este SQL ====="
cat << 'EOF'
-- Eliminar función problemática
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Crear función corregida
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-crear triggers principales
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_document_attachments_updated_at ON knowledge_document_attachments;
CREATE TRIGGER update_knowledge_document_attachments_updated_at
    BEFORE UPDATE ON knowledge_document_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificación
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.action_statement LIKE '%update_updated_at_column%'
ORDER BY t.event_object_table;

\q
EOF

echo ""
echo "# ===== PASO 3: Reiniciar backend ====="
echo "pm2 restart cms-backend"
echo ""

echo "# ===== PASO 4: Verificar logs ====="
echo "pm2 logs cms-backend --lines 50"
echo ""

echo -e "${GREEN}✅ Script preparado. Copiar y pegar los comandos en el servidor.${NC}"
echo ""
echo -e "${YELLOW}📝 DATOS DE CONEXIÓN:${NC}"
echo "Base de datos: case_management_db"
echo "Usuario: cms_admin"
echo "Password: .451789.Admin"