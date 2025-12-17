# SOLUCIÓN URGENTE PARA ERRORES DE PRODUCCIÓN

## Case Management System - 16 de Diciembre 2025

### 🚨 **PROBLEMAS IDENTIFICADOS:**

1. **Error HTTP 403 en Dashboard**: Usuario con rol "Analista de Aplicaciones" no puede acceder a métricas del dashboard
2. **Error PostgreSQL Enum**: `invalid input value for enum audit_logs_action_enum: "LOGIN"`
3. **Permisos faltantes**: Faltan permisos específicos de métricas para roles no-administrativos

### 📋 **PASOS PARA SOLUCIONAR EN PRODUCCIÓN:**

#### **PASO 1: HACER BACKUP DE LA BASE DE DATOS**

```bash
# En el servidor de producción
sudo -u postgres pg_dump case_management_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **PASO 2: CONECTARSE A LA BASE DE DATOS**

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql case_management_db
```

#### **PASO 3: EJECUTAR DIAGNÓSTICO**

```sql
-- Copiar y pegar el contenido de diagnostic_pre_migration.sql
\i /ruta/al/archivo/diagnostic_pre_migration.sql
```

#### **PASO 4: APLICAR LA SOLUCIÓN**

```sql
-- Copiar y pegar el contenido de fix_production_critical_issues.sql
\i /ruta/al/archivo/fix_production_critical_issues.sql
```

#### **PASO 5: REINICIAR EL BACKEND**

```bash
# Reiniciar el servicio del backend
pm2 restart cms-backend
# O si usas otro gestor de procesos:
# systemctl restart case-management-backend
```

#### **PASO 6: VERIFICAR LA SOLUCIÓN**

1. **Probar login del usuario**: hjurgensen@todosistemassti.co
2. **Verificar acceso al dashboard**: Debería cargar sin errores 403
3. **Revisar logs del backend**: No deberían aparecer errores de enum

### 🔧 **ARCHIVOS CREADOS:**

1. **`diagnostic_pre_migration.sql`**: Script de diagnóstico para verificar el estado actual
2. **`fix_production_critical_issues.sql`**: Migración que soluciona todos los problemas

### 🎯 **QUÉ HACE LA MIGRACIÓN:**

#### **Parte 1: Soluciona el Enum**

- Agrega los valores faltantes al enum `audit_logs_action_enum`:
  - `LOGIN`
  - `LOGOUT`
  - `LOGOUT_ALL`
  - `FORCE_LOGOUT`

#### **Parte 2: Crea Permisos Faltantes**

- `metrics.cases.read.own` - Ver métricas de casos propios
- `metrics.status.read.own` - Ver métricas de estados propios
- `metrics.applications.read.own` - Ver métricas de aplicaciones propias
- `metrics.time.read.own` - Ver métricas de tiempo propias
- `metrics.general.read.own` - Ver métricas generales propias
- `dashboard.read.own` - Acceder al dashboard propio

#### **Parte 3: Asigna Permisos al Rol**

- Asigna todos los permisos "own" al rol "Analista de Aplicaciones"
- Asigna permisos "team" al rol "Supervisor"
- Asigna permisos "all" al rol "Administrador"

### ⚠️ **CONSIDERACIONES IMPORTANTES:**

1. **Tiempo estimado**: 2-3 minutos
2. **Impacto**: Downtime mínimo (solo durante reinicio del backend)
3. **Reversible**: Sí, con el backup generado
4. **Testing**: Probar inmediatamente después de aplicar

### 🔍 **COMANDOS DE VERIFICACIÓN POST-MIGRACIÓN:**

```sql
-- Verificar que el enum tiene los valores correctos
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_logs_action_enum')
ORDER BY enumsortorder;

-- Verificar permisos del Analista de Aplicaciones
SELECT p.name, p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Analista de Aplicaciones'
  AND p.module IN ('metrics', 'dashboard')
ORDER BY p.name;
```

### 📞 **CONTACTO EN CASO DE PROBLEMAS:**

- Aplicar el backup inmediatamente si algo falla
- Revisar los logs de PM2: `pm2 logs cms-backend`
- Contactar al equipo de desarrollo

---

**✅ ESTA MIGRACIÓN SOLUCIONARÁ TODOS LOS PROBLEMAS REPORTADOS EN PRODUCCIÓN**
