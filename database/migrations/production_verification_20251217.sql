-- ===============================================
-- SCRIPT DE VERIFICACIÓN POST-DEPLOYMENT
-- ===============================================
-- Ejecutar este script DESPUÉS del deployment para verificar
-- que todos los cambios se aplicaron correctamente

-- ===============================================
-- 1. VERIFICAR PERMISOS DE MÉTRICAS
-- ===============================================

SELECT 'VERIFICACIÓN DE PERMISOS DE MÉTRICAS' as verificacion;

-- Verificar que existen los permisos básicos de métricas
SELECT 
    name,
    module,
    action,
    scope,
    CASE WHEN "isActive" THEN 'Activo' ELSE 'Inactivo' END as estado
FROM permissions 
WHERE name IN ('metrics.read.own', 'metrics.read.team', 'metrics.read.all', 'metrics.users.own', 'metrics.users.team', 'metrics.users.all')
ORDER BY name;

-- ===============================================
-- 2. VERIFICAR PERMISOS DEL ANALISTA DE APLICACIONES
-- ===============================================

SELECT 'PERMISOS DEL ANALISTA DE APLICACIONES' as verificacion;

SELECT 
    r.name as rol,
    p.name as permiso,
    p.module as modulo,
    p.action as accion,
    p.scope as alcance
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones'
AND (p.name LIKE 'metrics.%' OR p.name LIKE 'cases.%' OR p.name LIKE 'dashboard.%')
ORDER BY p.module, p.action, p.scope;

-- ===============================================
-- 3. CONTAR PERMISOS POR ROL
-- ===============================================

SELECT 'RESUMEN DE PERMISOS POR ROL' as verificacion;

SELECT 
    r.name as rol,
    COUNT(p.id) as total_permisos,
    COUNT(CASE WHEN p.name LIKE 'metrics.%' THEN 1 END) as permisos_metricas,
    COUNT(CASE WHEN p.name LIKE 'cases.%' THEN 1 END) as permisos_casos,
    COUNT(CASE WHEN p.name LIKE 'dashboard.%' THEN 1 END) as permisos_dashboard
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp."roleId"
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE r."isActive" = true
GROUP BY r.id, r.name
ORDER BY r.name;

-- ===============================================
-- 4. VERIFICAR INTEGRIDAD DE DATOS
-- ===============================================

SELECT 'VERIFICACIÓN DE INTEGRIDAD' as verificacion;

-- Verificar que no hay permisos huérfanos
SELECT 
    'Permisos sin rol asignado' as problema,
    COUNT(*) as cantidad
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp."permissionId"
WHERE rp."permissionId" IS NULL
AND p."isActive" = true;

-- Verificar que no hay role_permissions con IDs inválidos
SELECT 
    'Relaciones role_permissions inválidas' as problema,
    COUNT(*) as cantidad
FROM role_permissions rp
LEFT JOIN roles r ON rp."roleId" = r.id
LEFT JOIN permissions p ON rp."permissionId" = p.id
WHERE r.id IS NULL OR p.id IS NULL;

-- ===============================================
-- 5. VERIFICAR USUARIOS DE PRUEBA
-- ===============================================

SELECT 'USUARIOS PARA PRUEBAS' as verificacion;

-- Mostrar usuarios con rol Analista de Aplicaciones para pruebas
SELECT 
    up.id,
    up."fullName",
    up.email,
    r.name as rol,
    up."isActive"
FROM user_profiles up
JOIN roles r ON up."roleId" = r.id
WHERE r.name = 'Analista de Aplicaciones'
AND up."isActive" = true
LIMIT 3;

-- ===============================================
-- 6. COMANDOS DE PRUEBA SUGERIDOS
-- ===============================================

SELECT 'COMANDOS DE PRUEBA' as verificacion;

-- Estos comandos se deben ejecutar manualmente después del deployment:

/*

1. PROBAR AUTENTICACIÓN:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"password123"}'

2. PROBAR MÉTRICAS CON TOKEN:
curl -H "Authorization: Bearer <TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/metrics/users/time

3. VERIFICAR RESPUESTA ESPERADA:
- Estado 200 para usuarios con permisos correctos
- Estado 403 para usuarios sin permisos
- Estado 401 para tokens inválidos

4. PROBAR EN EL NAVEGADOR:
- Login: http://localhost:5173/login
- Dashboard: http://localhost:5173/dashboard
- Verificar que las métricas cargan sin errores

*/

-- ===============================================
-- 7. CHECKLIST DE VERIFICACIÓN
-- ===============================================

SELECT 'CHECKLIST DE VERIFICACIÓN' as verificacion;

/*
□ Backend reiniciado correctamente
□ Frontend compilado y servido
□ Login funciona correctamente
□ Dashboard carga sin errores 500/403
□ Métricas propias se muestran para Analista de Aplicaciones
□ Usuarios no autorizados reciben 403 apropiadamente
□ No hay errores en logs del backend
□ No hay errores en consola del navegador
□ Cache del navegador limpio
□ Tokens JWT validándose correctamente

PROBLEMAS COMUNES:
- Si persisten errores 403: Verificar que el usuario tiene 'metrics.read.own'
- Si errores 500: Revisar logs backend para errores SQL
- Si métricas no cargan: Verificar conexión a base de datos
- Si token inválido: Limpiar localStorage y hacer login nuevamente
*/