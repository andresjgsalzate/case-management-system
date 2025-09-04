# Módulo de TODOs/Tareas

Este documento describe la implementación completa del módulo de TODOs/Tareas para el sistema de gestión de casos.

## Características Implementadas

### 🎯 Funcionalidades Principales

1. **Gestión de TODOs**

   - Crear, leer, actualizar y eliminar TODOs
   - Asignación de prioridades (5 niveles)
   - Asignación a usuarios
   - Fechas de vencimiento
   - Estimaciones de tiempo
   - Marcar como completado/reactivar

2. **Control de Tiempo**

   - Entradas automáticas de tiempo con timer
   - Entradas manuales de tiempo
   - Cálculo de tiempo total invertido
   - Historial de actividades

3. **Sistema de Prioridades**

   - 5 niveles de prioridad con colores
   - Gestión visual por urgencia
   - Filtrado por prioridad

4. **Filtros y Búsqueda**

   - Filtro por prioridad, usuario, estado
   - Búsqueda por texto en título/descripción
   - Filtro por fechas de vencimiento
   - Filtro por TODOs completados/activos

5. **Métricas y Reportes**
   - Estadísticas generales de TODOs
   - TODOs vencidos
   - Distribución por prioridad y usuario
   - Tiempo total invertido

## Estructura de Base de Datos

### Tablas Principales

1. **`todo_priorities`** - Prioridades de TODOs
2. **`todos`** - Tabla principal de TODOs
3. **`todo_control`** - Control y seguimiento de TODOs
4. **`todo_time_entries`** - Entradas automáticas de tiempo
5. **`todo_manual_time_entries`** - Entradas manuales de tiempo
6. **`archived_todos`** - TODOs archivados

### Relaciones

```
todo_priorities ← todos ← todo_control ← todo_time_entries
                     ←                ← todo_manual_time_entries
user_profiles ← todos (assigned_user, created_by)
            ← todo_control (user)
            ← todo_time_entries (user)
            ← todo_manual_time_entries (user, created_by)
```

## Estructura del Backend

### Entidades (TypeORM)

- `Todo.ts` - Entidad principal de TODOs
- `TodoPriority.ts` - Prioridades de TODOs
- `TodoControl.ts` - Control y seguimiento
- `TodoTimeEntry.ts` - Entradas de tiempo automáticas
- `TodoManualTimeEntry.ts` - Entradas de tiempo manuales

### DTOs

- `todo.dto.ts` - Interfaces para transferencia de datos
- Incluye DTOs para creación, actualización, respuesta y filtros

### Servicios

- `TodoService.ts` - Lógica de negocio principal
- Métodos para CRUD, filtros, métricas y utilidades

### Controladores

- `TodoController.ts` - Endpoints REST API
- Manejo de requests/responses HTTP

### Rutas

- `todos.routes.ts` - Definición de rutas de la API

## Estructura del Frontend

### Tipos

- `todo.types.ts` - Interfaces TypeScript para el frontend

### Servicios

- `todoAPI.ts` - Cliente API para comunicación con backend

### Hooks

- `useTodos.ts` - Hook principal para gestión de estado
- `useTodoMetrics.ts` - Hook para métricas y estadísticas

### Páginas

- `TodosPage.tsx` - Página principal del módulo

## API Endpoints

### TODOs

```
GET    /api/todos              - Obtener todos los TODOs (con filtros)
GET    /api/todos/:id          - Obtener TODO por ID
POST   /api/todos              - Crear nuevo TODO
PUT    /api/todos/:id          - Actualizar TODO
DELETE /api/todos/:id          - Eliminar TODO
PATCH  /api/todos/:id/complete - Completar TODO
PATCH  /api/todos/:id/reactivate - Reactivar TODO
```

### Utilidades

```
GET    /api/todos/priorities   - Obtener prioridades disponibles
GET    /api/todos/metrics      - Obtener métricas de TODOs
```

## Filtros Disponibles

- `priorityId` - Filtrar por prioridad específica
- `assignedUserId` - Filtrar por usuario asignado
- `createdByUserId` - Filtrar por usuario creador
- `dueDateFrom` / `dueDateTo` - Filtrar por rango de fechas
- `search` - Búsqueda en título y descripción
- `showCompleted` - Mostrar solo completados/activos

## Instalación y Configuración

### 1. Base de Datos

```sql
-- Ejecutar la migración
-- Archivo: database/migrations/create_todos_tables.sql
```

### 2. Backend

```bash
# Las entidades ya están creadas, verificar data-source.ts incluya:
# - Todo
# - TodoPriority
# - TodoControl
# - TodoTimeEntry
# - TodoManualTimeEntry
```

### 3. Frontend

```bash
# Agregar al router principal:
# import TodosPage from './pages/TodosPage'
# <Route path="/todos" component={TodosPage} />
```

## Funciones de Base de Datos

### Funciones Utilitarias

- `dbo.fn_GetTodoTotalTime(@TodoId)` - Calcular tiempo total de un TODO
- `sp_CompleteTodo` - Procedimiento para completar TODO

### Triggers

- `TR_todos_updated_at` - Actualizar timestamp automáticamente
- `TR_calculate_todo_time_duration` - Calcular duración automática

## Próximas Mejoras

1. **Control de Tiempo en Tiempo Real**

   - Timer integrado en la interfaz
   - Notificaciones de tiempo invertido

2. **Colaboración**

   - Comentarios en TODOs
   - Historial de cambios
   - Notificaciones de asignación

3. **Reportes Avanzados**

   - Exportación a Excel/PDF
   - Gráficos de productividad
   - Análisis de tendencias

4. **Integración**
   - Conexión con casos
   - Dependencias entre TODOs
   - Workflow automático

## Consideraciones de Rendimiento

1. **Índices**: Creados en campos frecuentemente consultados
2. **Paginación**: Implementar para listas grandes
3. **Caché**: Considerar para métricas frecuentes
4. **Lazy Loading**: Para relaciones complejas

## Notas de Seguridad

1. **Permisos**: Implementar sistema de permisos por usuario
2. **Validación**: Validación en backend y frontend
3. **Sanitización**: Limpieza de datos de entrada
4. **Auditoría**: Log de cambios importantes
