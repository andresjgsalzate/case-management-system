-- =====================================================
-- SOLUCIÓN SQL PARA PRODUCCIÓN
-- Problema: Function update_updated_at_column() busca "updatedAt" 
-- pero la columna se llama "updated_at"
-- =====================================================

-- 1. Primero, eliminar la función problemática si existe
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 2. Crear la función corregida que usa "updated_at" (snake_case)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Verificar que los triggers están aplicando la función correctamente
-- Lista de tablas que deberían tener el trigger:
-- - knowledge_documents
-- - knowledge_document_attachments
-- - knowledge_document_versions
-- - knowledge_document_feedback
-- - knowledge_tags
-- - knowledge_document_tag_relations
-- - document_types
-- - user_profiles
-- - roles
-- - permissions
-- - role_permissions
-- - etc.

-- 4. Re-crear el trigger para knowledge_documents si no existe
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Re-crear el trigger para knowledge_document_attachments si no existe  
DROP TRIGGER IF EXISTS update_knowledge_document_attachments_updated_at ON knowledge_document_attachments;
CREATE TRIGGER update_knowledge_document_attachments_updated_at
    BEFORE UPDATE ON knowledge_document_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Re-crear el trigger para user_profiles si no existe
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificación: Listar todos los triggers que usan la función
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.action_statement LIKE '%update_updated_at_column%'
ORDER BY t.event_object_table, t.trigger_name;

-- 8. Verificación: Probar la función manualmente
-- SELECT update_updated_at_column();

COMMIT;

-- =====================================================
-- INSTRUCCIONES PARA EJECUTAR EN PRODUCCIÓN:
-- =====================================================
-- 1. Conectarse a PostgreSQL como superusuario:
--    sudo -u postgres psql nombre_base_datos
-- 
-- 2. Copiar y pegar este SQL completo
--
-- 3. Verificar que no hay errores
--
-- 4. Reiniciar el backend: pm2 restart cms-backend
-- =====================================================