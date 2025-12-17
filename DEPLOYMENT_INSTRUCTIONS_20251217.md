# Instrucciones de Deployment - Corrección de Métricas Dashboard

**Fecha**: 17 de Diciembre 2025  
**Versión**: v2.1.3  
**Responsable**: Sistema de Gestión de Casos

## 📋 Resumen de Cambios

### Problemas Resueltos

- ✅ Error 500 en métricas del dashboard (parámetro SQL incorrecto)
- ✅ Error 403 en endpoint `/api/metrics/users/time` (permisos incorrectos)
- ✅ Inconsistencias en permisos de métricas entre desarrollo y producción
- ✅ Debugging mejorado para diagnóstico futuro

### Archivos Modificados

- `backend/src/controllers/DashboardMetricsController.ts` (lógica de permisos)
- `frontend/src/services/dashboardMetrics.service.ts` (debugging)
- `frontend/src/services/security.service.ts` (validación tokens)

## 🚀 Proceso de Deployment

### 1. Pre-Deployment (OBLIGATORIO)

```bash
# 1. Crear backup completo de la base de datos
pg_dump -U postgres -h localhost case_management > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar que ambos servidores están corriendo
curl http://localhost:3000/api/auth/status  # Backend
curl http://localhost:5173                  # Frontend

# 3. Crear backup del código actual
git stash push -m "Backup before deployment $(date)"
```

### 2. Deployment de Base de Datos

```bash
# Ejecutar script principal de migración
psql -U postgres -d case_management -f database/migrations/production_deployment_fixes_20251217.sql

# Verificar que se ejecutó correctamente (debe mostrar "COMMIT")
echo $?  # Debe ser 0
```

### 3. Deployment de Aplicación

```bash
# Backend
cd backend
npm install
pm2 restart case-management-backend
# O si usas otro gestor: systemctl restart case-management

# Frontend
cd frontend
npm install
npm run build
# Copiar archivos build al servidor web si es necesario
```

### 4. Verificación Post-Deployment

```bash
# 1. Ejecutar script de verificación
psql -U postgres -d case_management -f database/migrations/production_verification_20251217.sql

# 2. Verificar endpoints críticos
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario_analista@empresa.com","password":"su_password"}'

# 3. Con el token obtenido, probar métricas
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/metrics/users/time

# 4. Verificar en navegador
# - Ir a http://localhost:5173/login
# - Login con usuario Analista de Aplicaciones
# - Verificar que dashboard carga correctamente
# - No deben haber errores 403/500
```

## ⚠️ Rollback (Si es necesario)

```bash
# 1. Restaurar base de datos
psql -U postgres -d case_management < backup_pre_deployment_YYYYMMDD_HHMMSS.sql

# 2. Restaurar código
git stash pop

# 3. Reiniciar servicios
pm2 restart case-management-backend
```

## 🔍 Monitoreo Post-Deployment

### Logs a Revisar

```bash
# Backend
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Sistema (si usas systemd)
journalctl -f -u case-management

# Nginx (si aplica)
tail -f /var/log/nginx/error.log
```

### Métricas de Éxito

- ✅ Dashboard carga sin errores
- ✅ Usuarios "Analista de Aplicaciones" ven sus métricas
- ✅ No hay errores 403 para usuarios autorizados
- ✅ No hay errores 500 en logs
- ✅ Tiempo de respuesta < 2 segundos

### Posibles Problemas

| Problema              | Causa Probable          | Solución                          |
| --------------------- | ----------------------- | --------------------------------- |
| Error 403 persistente | Permisos no aplicados   | Verificar script SQL se ejecutó   |
| Error 500             | Problema de conexión DB | Verificar credenciales y conexión |
| Dashboard no carga    | Cache del navegador     | Limpiar cache (Ctrl+Shift+R)      |
| Token inválido        | Sesión expirada         | Logout/login nuevamente           |

## 📞 Contactos de Soporte

- **Desarrollador**: [Tu información]
- **DBA**: [Información del DBA]
- **Infraestructura**: [Información de infra]

## 🔄 Versionado

```bash
# Después de deployment exitoso
git add .
git commit -m "fix: resolve dashboard metrics 403/500 errors - v2.1.3

- Fix SQL parameter binding in DashboardMetricsController
- Update permissions logic to accept metrics.read.own
- Improve debugging and error handling
- Update production database permissions

Resolves: Dashboard metrics errors
Tested: ✅ Local ✅ Staging ⏳ Production"

git tag v2.1.3
git push origin main --tags
```

---

**Nota**: Este deployment requiere coordinación entre backend, frontend y base de datos. Se recomienda ejecutar en horario de mantenimiento o con baja actividad de usuarios.
