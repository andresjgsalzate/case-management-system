# 🔧 Refactoring Completo: Implementación de Scopes en Métricas del Dashboard

## 📋 **Resumen de Cambios Realizados**

### ✅ **Cambios Completados:**

#### 1. **Sistema de Permisos Centralizado**

- ✅ Creadas funciones helper en `DashboardMetricsController`:
  - `verifyMetricPermissions()`: Verifica permisos específicos por tipo de métrica
  - `getUserWithPermissions()`: Obtiene usuario con relaciones de permisos
- ✅ Interfaz `UserPermissions` para tipado consistente

#### 2. **Métodos Refactorizados con Scopes own/all:**

##### ✅ **getGeneralMetrics**

- Permisos: `metrics.general.read.own` | `metrics.general.read.all`
- Filtrado: Por `userId` cuando scope = "own"
- Response: Incluye campo `scope`

##### ✅ **getTimeMetrics**

- Permisos: `metrics.time.read.own` | `metrics.time.read.all`
- Filtrado: Casos y TODOs por `userId` cuando scope = "own"
- Response: Incluye campo `scope`

##### ✅ **getCaseTimeMetrics**

- Permisos: `metrics.cases.read.own` | `metrics.cases.read.all`
- Filtrado: Por `cc."userId"` cuando scope = "own"
- Response: Reestructurado con `cases` array y `scope`

##### ✅ **getStatusMetrics**

- Permisos: `metrics.status.read.own` | `metrics.status.read.all`
- Filtrado: Por `cc."userId"` cuando scope = "own"
- Response: Reestructurado con `statuses` array y `scope`

##### ✅ **getApplicationMetrics** (Parcialmente refactorizado)

- Permisos: `metrics.applications.read.own` | `metrics.applications.read.all`
- Verificación de permisos implementada

#### 3. **Base de Datos**

- ✅ Migración creada: `add_missing_dashboard_permissions.sql`
- ✅ Permisos agregados:
  - `metrics.general.read.own`
  - `metrics.status.read.own`
  - `metrics.applications.read.own`
  - `metrics.performance.read.own`
- ✅ Asignación automática a todos los roles

---

## 🏗️ **Arquitectura del Sistema de Permisos**

### **Scopes Implementados:**

- `own`: Usuario solo ve sus propios datos
- `all`: Usuario ve todos los datos del sistema
- `team`: **Pendiente** (esperando implementación de sistema de equipos)

### **Verificación de Permisos:**

```typescript
// Ejemplo de uso
const permissions = await DashboardMetricsController.verifyMetricPermissions(
  user,
  "time"
);
if (!permissions.canReadOwn && !permissions.canReadAll) {
  return res.status(403).json({ error: "Sin permisos" });
}
```

### **Filtrado por Scope:**

```typescript
// Aplicar filtros según permisos
if (!permissions.canReadAll && permissions.canReadOwn) {
  query += ` AND "userId" = $${paramIndex}`;
  params.push(userId);
}
```

---

## ⚠️ **Trabajo Pendiente**

### **Métodos que Necesitan Refactoring Completo:**

1. `getPerformanceMetrics` - Implementar scopes own/all
2. `getDashboardStats` - Implementar scopes own/all
3. `getUserTimeMetrics` - Ya implementa team/all, falta scope own

### **Mejoras Futuras:**

1. **Sistema de Equipos**: Implementar scope "team"
2. **Caché de Permisos**: Optimizar consultas de permisos
3. **Frontend**: Actualizar hooks para manejar scopes
4. **Testing**: Pruebas unitarias para verificación de permisos

---

## 🔍 **Verificación Post-Refactoring**

### **Comandos para Verificar:**

```sql
-- Verificar permisos en BD
SELECT name, module, action, scope FROM permissions WHERE module = 'metrics';

-- Verificar asignación por rol
SELECT r.name, p.name FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'metrics';
```

### **Testing de Endpoints:**

- ✅ GET /api/metrics/general - Con scopes own/all
- ✅ GET /api/metrics/time - Con scopes own/all
- ✅ GET /api/metrics/cases/time - Con scopes own/all
- ✅ GET /api/metrics/status - Con scopes own/all
- ⚠️ GET /api/metrics/applications - Parcial
- ❌ GET /api/metrics/performance - Pendiente
- ❌ GET /api/metrics/dashboard-stats - Pendiente

---

## 📊 **Impacto en Frontend**

### **Hooks Actuales Compatibles:**

- `useDashboardMetrics()` - ✅ Ya verifica permisos correctamente
- `useAllDashboardMetrics()` - ✅ Maneja permisos condicionales

### **Respuestas de API Actualizadas:**

```json
{
  "success": true,
  "data": {
    // ... datos específicos del endpoint
    "scope": "own" | "all"  // ← NUEVO CAMPO
  }
}
```

---

## 🚀 **Beneficios Logrados**

1. **Seguridad Mejorada**: Verificación granular de permisos
2. **Consistencia**: Función centralizada para todos los endpoints
3. **Flexibilidad**: Soporte para múltiples scopes
4. **Auditabilidad**: Logs claros de permisos aplicados
5. **Escalabilidad**: Base sólida para sistema de equipos futuro

---

## 🎯 **Próximos Pasos Recomendados**

1. **Ejecutar migración**: `add_missing_dashboard_permissions.sql`
2. **Completar refactoring** de métodos pendientes
3. **Probar endpoints** con diferentes usuarios/roles
4. **Actualizar documentación** de API
5. **Implementar testing** automatizado para permisos
