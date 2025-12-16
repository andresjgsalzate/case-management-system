-- =====================================================
-- CORRECCIÓN PARA PRODUCCIÓN: case_management_db
-- Error: Function update_updated_at_column() busca "updatedAt" 
-- pero debería usar "updated_at" (snake_case)
-- =====================================================

-- 1. Eliminar la función problemática
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 2. Crear la función corregida
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-crear triggers para knowledge_documents
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Re-crear triggers para knowledge_document_attachments
DROP TRIGGER IF EXISTS update_knowledge_document_attachments_updated_at ON knowledge_document_attachments;
CREATE TRIGGER update_knowledge_document_attachments_updated_at
    BEFORE UPDATE ON knowledge_document_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Re-crear triggers para user_profiles (por si acaso)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificación: Listar todos los triggers creados
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.action_statement LIKE '%update_updated_at_column%'
ORDER BY t.event_object_table, t.trigger_name;

-- 7. Mensaje de confirmación
SELECT 'Función update_updated_at_column() corregida exitosamente' as resultado;