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