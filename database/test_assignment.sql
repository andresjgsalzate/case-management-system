-- Script para crear un usuario de prueba y probar la asignación
-- Este es un script de prueba manual

-- 1. Crear un usuario de prueba si no existe
INSERT INTO user_profiles (id, full_name, email, is_active, created_at, updated_at)
VALUES ('test-user-1', 'Usuario de Prueba', 'test@example.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Crear un caso de prueba 
INSERT INTO cases (id, numero_caso, descripcion, fecha, historial_caso, conocimiento_modulo, 
                   manipulacion_datos, claridad_descripcion, causa_fallo, puntuacion, 
                   complejidad_tecnica, tiempo_estimado, clasificacion, estado, prioridad, 
                   user_id, created_at, updated_at)
VALUES (
    'test-case-1', 
    'TEST_ASIGNACION', 
    'Caso para probar asignación automática', 
    CURRENT_DATE,
    1, 1, 1, 1, 1, '5.00', 1, 60,
    'Baja Complejidad', 'nuevo', 'Media Complejidad',
    'test-user-1', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que el caso se creó
SELECT id, numero_caso, estado, assigned_to_id FROM cases WHERE numero_caso = 'TEST_ASIGNACION';
