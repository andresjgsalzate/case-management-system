# Problema: Dashboard no muestra casos antiguos con actividad reciente

## 🔍 **Descripción del Problema**

Cuando hay cambio de mes, los casos que fueron creados en meses anteriores pero que tienen registros de tiempo o actividad nueva en el mes actual no aparecen en las métricas del Dashboard.

## 🔧 **Causa Raíz**

En el archivo `backend/src/controllers/DashboardMetricsController.ts`, las consultas filtran por:

```sql
-- Problema: Solo filtra por fecha de asignación del caso
AND cc."assignedAt" >= $startDate
AND cc."assignedAt" <= $endDate
```

Esto significa que:

- ✅ **Casos nuevos del mes**: Aparecen correctamente (assignedAt está en el mes actual)
- ❌ **Casos antiguos con actividad nueva**: NO aparecen (assignedAt es de meses anteriores)

## 📊 **Impacto en las Métricas**

### Métricas Afectadas:

1. **Tiempo Total (Este Mes)** - `getTimeMetrics()`
2. **Tiempo por Casos (Este Mes)** - `getCaseTimeMetrics()`
3. **Tiempo por Usuario** - `getUserTimeMetrics()`
4. **Tiempo por Aplicación** - `getApplicationMetrics()`

### Ejemplo del Problema:

```
Caso #123 - Creado en Enero (assignedAt: 2025-01-15)
└── Time Entry #1 - Enero: 2h
└── Time Entry #2 - Marzo: 3h  ← NO aparece en Dashboard de Marzo
```

## ✅ **Solución Propuesta**

Modificar las consultas para filtrar por **actividad reciente** en lugar de solo por fecha de asignación:

### 1. Filtrar por fecha de time entries

```sql
-- En lugar de filtrar por assignedAt
WHERE cc."assignedAt" >= $1 AND cc."assignedAt" <= $2

-- Filtrar por actividad en time_entries y manual_time_entries
WHERE (
  EXISTS (
    SELECT 1 FROM time_entries te
    WHERE te."caseControlId" = cc.id
    AND te."createdAt" >= $1 AND te."createdAt" <= $2
  )
  OR EXISTS (
    SELECT 1 FROM manual_time_entries mte
    WHERE mte."caseControlId" = cc.id
    AND mte."createdAt" >= $1 AND mte."createdAt" <= $2
  )
  OR (cc."assignedAt" >= $1 AND cc."assignedAt" <= $2)
)
```

### 2. Opción alternativa: Filtrar directamente en time entries

```sql
-- Calcular tiempo solo de entries del mes actual
SELECT
  COALESCE(SUM(
    CASE
      WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL
      THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
      ELSE COALESCE(te."durationMinutes", 0)
    END
  ), 0) as total_time_minutes
FROM time_entries te
JOIN case_control cc ON te."caseControlId" = cc.id
WHERE te."createdAt" >= $1 AND te."createdAt" <= $2
```

## 🎯 **Archivos a Modificar**

### Backend:

1. **`DashboardMetricsController.ts`**:
   - `getTimeMetrics()` - líneas ~150-220
   - `getCaseTimeMetrics()` - líneas ~440-540
   - `getUserTimeMetrics()` - líneas ~340-440
   - `getApplicationMetrics()` - líneas ~600-700

### Frontend (Posiblemente):

2. **`dashboardMetrics.service.ts`** - Para ajustar las llamadas si es necesario
3. **`useDashboardMetrics.ts`** - Para invalidar cache correctamente

## 🧪 **Testing**

### Escenario de Prueba:

1. Crear un caso en Enero
2. Registrar tiempo en Enero
3. Cambiar al mes de Marzo
4. Registrar tiempo adicional al caso en Marzo
5. Verificar que el Dashboard de Marzo muestre:
   - ✅ El caso en "Casos con Mayor Tiempo"
   - ✅ Las horas de Marzo en "Tiempo Total (Este Mes)"
   - ✅ El usuario en "Tiempo por Usuario"

## 🔄 **Plan de Implementación**

1. **Análisis detallado**: Revisar todas las consultas afectadas
2. **Backup**: Documentar consultas actuales
3. **Modificación**: Implementar filtros por actividad reciente
4. **Testing**: Verificar con casos de prueba
5. **Validación**: Confirmar que métricas sean correctas

## 📈 **Beneficios de la Solución**

- ✅ **Métricas más precisas**: Tiempo real del mes actual
- ✅ **Casos antiguos visibles**: Con actividad reciente aparecen
- ✅ **Seguimiento continuo**: Casos de larga duración no se "pierden"
- ✅ **Productividad real**: Refleja trabajo actual, no solo casos nuevos

---

**Prioridad**: 🔥 **Alta** - Afecta la precisión de métricas de productividad
**Complejidad**: 🟡 **Media** - Requiere modificar múltiples consultas SQL
**Riesgo**: 🟢 **Bajo** - Cambio en lógica de filtrado, no afecta estructura
