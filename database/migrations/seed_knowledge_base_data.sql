-- =====================================================
-- MIGRACIÓN: DATOS INICIALES PARA BASE DE CONOCIMIENTO
-- Fecha: Septiembre 2025
-- Descripción: Inserta tipos de documentos por defecto
-- =====================================================

-- Insertar tipos de documentos por defecto
INSERT INTO document_types (id, code, name, description, icon, color, is_active, display_order, created_by) VALUES
(
  gen_random_uuid(),
  'guide',
  'Guía',
  'Documentación paso a paso para realizar procesos o tareas específicas',
  'book-open',
  '#3B82F6',
  true,
  1,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'procedure',
  'Procedimiento',
  'Documentos formales que describen procesos de la organización',
  'clipboard-list',
  '#059669',
  true,
  2,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'faq',
  'FAQ',
  'Preguntas frecuentes y sus respuestas',
  'question-mark-circle',
  '#DC2626',
  true,
  3,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'template',
  'Plantilla',
  'Documentos modelo que pueden ser reutilizados',
  'document-duplicate',
  '#7C3AED',
  true,
  4,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'tutorial',
  'Tutorial',
  'Contenido educativo con ejemplos prácticos',
  'academic-cap',
  '#F59E0B',
  true,
  5,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'reference',
  'Referencia',
  'Documentos de consulta rápida y especificaciones técnicas',
  'library',
  '#6B7280',
  true,
  6,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'solution',
  'Solución',
  'Documentos que describen la resolución de problemas específicos',
  'light-bulb',
  '#10B981',
  true,
  7,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
),
(
  gen_random_uuid(),
  'policy',
  'Política',
  'Documentos que establecen reglas y políticas de la organización',
  'shield-check',
  '#DC2626',
  true,
  8,
  (SELECT id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1)
);

-- Comentarios sobre los tipos de documentos
COMMENT ON TABLE document_types IS 'Tipos parametrizables de documentos para la base de conocimiento';
COMMENT ON COLUMN document_types.code IS 'Código único identificativo del tipo de documento';
COMMENT ON COLUMN document_types.name IS 'Nombre descriptivo del tipo de documento';
COMMENT ON COLUMN document_types.icon IS 'Icono Heroicons para representar el tipo de documento';
COMMENT ON COLUMN document_types.color IS 'Color hexadecimal para identificación visual del tipo';
COMMENT ON COLUMN document_types.display_order IS 'Orden de visualización en interfaces de usuario';

-- Crear documento de ejemplo
DO $$
DECLARE 
    admin_user_id UUID;
    guide_type_id UUID;
    example_doc_id UUID;
BEGIN
    -- Obtener ID del usuario admin
    SELECT id INTO admin_user_id FROM user_profiles WHERE email = 'admin@sistema.com' LIMIT 1;
    
    -- Obtener ID del tipo de documento 'guide'
    SELECT id INTO guide_type_id FROM document_types WHERE code = 'guide' LIMIT 1;
    
    -- Si existe el usuario admin, crear documento de ejemplo
    IF admin_user_id IS NOT NULL AND guide_type_id IS NOT NULL THEN
        -- Insertar documento de ejemplo
        INSERT INTO knowledge_documents (
            id, title, content, json_content, document_type_id, 
            priority, difficulty_level, is_published, is_template,
            created_by, last_edited_by, published_at
        ) VALUES (
            gen_random_uuid(),
            'Bienvenido al Sistema de Base de Conocimiento',
            'Este es un documento de ejemplo que muestra las capacidades del sistema de base de conocimiento con editor BlockNote.',
            '{
                "type": "doc",
                "content": [
                    {
                        "type": "heading",
                        "attrs": { "level": 1 },
                        "content": [{ "type": "text", "text": "Bienvenido al Sistema de Base de Conocimiento" }]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            { "type": "text", "text": "Este sistema te permite crear, organizar y compartir documentación de manera colaborativa usando un editor avanzado." }
                        ]
                    },
                    {
                        "type": "heading",
                        "attrs": { "level": 2 },
                        "content": [{ "type": "text", "text": "Características principales:" }]
                    },
                    {
                        "type": "bullet_list",
                        "content": [
                            {
                                "type": "list_item",
                                "content": [
                                    { "type": "paragraph", "content": [{ "type": "text", "text": "Editor WYSIWYG con BlockNote" }] }
                                ]
                            },
                            {
                                "type": "list_item",
                                "content": [
                                    { "type": "paragraph", "content": [{ "type": "text", "text": "Versionado automático de documentos" }] }
                                ]
                            },
                            {
                                "type": "list_item",
                                "content": [
                                    { "type": "paragraph", "content": [{ "type": "text", "text": "Sistema de etiquetas y categorización" }] }
                                ]
                            },
                            {
                                "type": "list_item",
                                "content": [
                                    { "type": "paragraph", "content": [{ "type": "text", "text": "Feedback y valoraciones de usuarios" }] }
                                ]
                            },
                            {
                                "type": "list_item",
                                "content": [
                                    { "type": "paragraph", "content": [{ "type": "text", "text": "Búsqueda avanzada de contenido" }] }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            { "type": "text", "text": "¡Comienza a crear tu primera documentación!" }
                        ]
                    }
                ]
            }'::jsonb,
            guide_type_id,
            'medium',
            2,
            true,
            false,
            admin_user_id,
            admin_user_id,
            NOW()
        ) RETURNING id INTO example_doc_id;
        
        -- Crear tags para el documento de ejemplo
        INSERT INTO knowledge_document_tags (id, document_id, tag_name) VALUES
        (gen_random_uuid(), example_doc_id, 'bienvenida'),
        (gen_random_uuid(), example_doc_id, 'tutorial'),
        (gen_random_uuid(), example_doc_id, 'inicio');
        
        -- Crear versión inicial
        INSERT INTO knowledge_document_versions (
            id, document_id, version_number, content, title, change_summary, created_by
        ) VALUES (
            gen_random_uuid(),
            example_doc_id,
            1,
            '{
                "type": "doc",
                "content": [
                    {
                        "type": "heading",
                        "attrs": { "level": 1 },
                        "content": [{ "type": "text", "text": "Bienvenido al Sistema de Base de Conocimiento" }]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            { "type": "text", "text": "Este sistema te permite crear, organizar y compartir documentación de manera colaborativa usando un editor avanzado." }
                        ]
                    }
                ]
            }'::jsonb,
            'Bienvenido al Sistema de Base de Conocimiento',
            'Versión inicial del documento de bienvenida',
            admin_user_id
        );
        
        RAISE NOTICE 'Documento de ejemplo creado exitosamente';
    ELSE
        RAISE NOTICE 'No se pudo crear el documento de ejemplo: usuario admin no encontrado';
    END IF;
END $$;
