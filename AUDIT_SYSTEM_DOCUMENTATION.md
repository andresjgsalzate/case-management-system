# Sistema de Auditoría - Documentación Completa

## 📋 Resumen General

El sistema de auditoría implementado proporciona un registro completo y automático de todas las operaciones CRUD realizadas en el sistema de gestión de casos. Está diseñado para ser seguro, eficiente y fácil de usar desde la interfaz de administración.

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + TypeScript + TypeORM)

#### 1. Base de Datos (PostgreSQL)

- **Tabla `audit_logs`**: Registro principal de auditoría
- **Tabla `audit_entity_changes`**: Cambios específicos de campos
- **Índices optimizados** para consultas rápidas
- **Permisos granulares** para control de acceso

#### 2. Entidades TypeORM

- `AuditLog.ts`: Entidad principal de auditoría
- `AuditEntityChange.ts`: Entidad de cambios específicos
- Relaciones apropiadas y métodos helper

#### 3. Middleware de Auditoría

- **Captura automática** de todas las operaciones CRUD
- **Detección inteligente** de cambios en campos
- **Registro de metadatos** completos (IP, User-Agent, etc.)
- **Filtrado de campos sensibles**

#### 4. API REST

- **AuditController.ts**: Endpoints con paginación y filtros
- **AuditService.ts**: Lógica de negocio y consultas optimizadas
- **Rutas protegidas** con permisos específicos

### Frontend (React + TypeScript + TailwindCSS)

#### 1. Tipos y Servicios

- **Tipos TypeScript** completos para toda la API
- **Servicio de auditoría** con manejo de errores
- **Integración con sistema de permisos**

#### 2. Componentes

- **AuditLogsPage**: Interfaz principal con filtros avanzados
- **Modal de detalles** para ver cambios específicos
- **Paginación** y ordenamiento
- **Exportación** de datos

#### 3. Navegación

- **Integrado en DynamicNavigation** bajo la sección de Administración
- **Control de acceso** basado en permisos
- **Iconografía consistente**

## 🔐 Sistema de Permisos

### Permisos Definidos

- `audit.view.all`: Ver logs de auditoría
- `audit.admin.all`: Administración completa de auditoría

### Control de Acceso

- **Middleware de autorización** en todas las rutas
- **Componentes protegidos** en el frontend
- **Validación a nivel de base de datos**

## 📊 Funcionalidades Principales

### 1. Registro Automático

- ✅ **Operaciones CRUD**: Create, Read, Update, Delete
- ✅ **Metadatos completos**: Usuario, IP, timestamp, User-Agent
- ✅ **Cambios específicos**: Valor anterior y nuevo por campo
- ✅ **Contexto de la operación**: Método HTTP, ruta, parámetros

### 2. Consulta y Filtrado

- ✅ **Filtros avanzados**: Por usuario, entidad, acción, fechas
- ✅ **Búsqueda de texto**: En metadatos y cambios
- ✅ **Paginación eficiente**: Con límites configurables
- ✅ **Ordenamiento**: Por cualquier campo

### 3. Interfaz de Usuario

- ✅ **Vista de lista**: Con información resumida
- ✅ **Vista de detalles**: Modal con cambios específicos
- ✅ **Filtros interactivos**: Formulario intuitivo
- ✅ **Exportación**: Descarga de datos filtrados

## 🛠️ Archivos Principales

### Backend

```
/backend/src/
├── entities/
│   ├── AuditLog.ts
│   └── AuditEntityChange.ts
├── dto/
│   └── audit.dto.ts
├── middleware/
│   └── auditMiddleware.ts
├── services/
│   └── AuditService.ts
├── controllers/
│   └── AuditController.ts
└── routes/
    └── audit.routes.ts
```

### Frontend

```
/frontend/src/
├── types/
│   └── audit.ts
├── services/
│   └── audit.service.ts
├── pages/audit/
│   ├── AuditLogsPage.tsx
│   └── index.ts
└── hooks/
    └── usePermissions.ts (actualizado)
```

### Base de Datos

```
/database/migrations/
└── create_audit_system.sql
```

## 🚀 Uso del Sistema

### 1. Acceso

1. Iniciar sesión con usuario que tenga permisos de auditoría
2. Navegar a **Administración > Auditoría**
3. La página mostrará todos los logs disponibles

### 2. Filtrado

- **Por usuario**: Seleccionar usuario específico
- **Por entidad**: Filtrar por tipo de tabla/entidad
- **Por acción**: CREATE, UPDATE, DELETE
- **Por fechas**: Rango de fechas específico
- **Por texto**: Búsqueda en metadatos

### 3. Visualización

- **Lista paginada** con información resumida
- **Click en cualquier fila** para ver detalles completos
- **Modal con cambios** campo por campo
- **Información completa** de contexto

## 🔧 Configuración

### Permisos Requeridos

**IMPORTANTE**: Solo usuarios con rol de **Administrador** pueden acceder al sistema de auditoría. Esto garantiza la máxima seguridad y control sobre la información sensible.

Los permisos disponibles son:

- `audit.view.all`: Ver todos los logs de auditoría
- `audit.admin.all`: Administración completa del sistema
- `audit.export.all`: Exportar datos de auditoría
- `audit.config.all`: Configurar parámetros del sistema

**Nota de seguridad**: Estos permisos están asignados automáticamente solo al rol "Administrador".

### Variables de Entorno

El sistema utiliza la configuración existente de la base de datos y no requiere variables adicionales.

### Instalación

El sistema está completamente integrado y no requiere instalación adicional. Solo es necesario:

1. Ejecutar las migraciones SQL
2. Reiniciar el servidor backend
3. El frontend detectará automáticamente las nuevas rutas

## 🎯 Casos de Uso

### 1. Investigación de Cambios

- **Problema**: "¿Quién cambió este caso?"
- **Solución**: Filtrar por entidad "cases" y ID específico

### 2. Auditoría de Usuario

- **Problema**: "¿Qué hizo este usuario hoy?"
- **Solución**: Filtrar por usuario y fecha actual

### 3. Seguimiento de Eliminaciones

- **Problema**: "¿Qué datos se eliminaron?"
- **Solución**: Filtrar por acción "DELETE"

### 4. Análisis de Actividad

- **Problema**: "¿Cuánta actividad hubo esta semana?"
- **Solución**: Filtrar por rango de fechas

## 📈 Optimizaciones Implementadas

### 1. Base de Datos

- **Índices compuestos** en campos más consultados
- **Particionamiento** por fechas (preparado para implementar)
- **Compresión JSONB** para metadatos

### 2. Backend

- **Paginación eficiente** con límites
- **Consultas optimizadas** con joins selectivos
- **Cache de permisos** para mejor rendimiento

### 3. Frontend

- **Lazy loading** de componentes
- **Debounce** en filtros de búsqueda
- **Memoización** de resultados

## 🛡️ Seguridad

### 1. Protección de Datos

- **Encriptación** de datos sensibles
- **Filtrado automático** de campos como passwords
- **Logs inmutables** (solo inserción)

### 2. Control de Acceso

- **Autenticación requerida** en todas las rutas
- **Autorización granular** por permisos
- **Validación de entrada** en todos los endpoints

### 3. Privacidad

- **Anonimización** de datos sensibles
- **Retención configurable** de logs
- **Acceso auditado** al propio sistema de auditoría

## 🔮 Funcionalidades Futuras

### 1. Dashboard de Estadísticas

- Gráficos de actividad por período
- Métricas de usuarios más activos
- Tendencias de cambios por entidad

### 2. Alertas Automáticas

- Notificaciones de actividad sospechosa
- Reportes programados
- Integración con sistemas de monitoreo

### 3. Exportación Avanzada

- Reportes en PDF
- Integración con Excel
- API para sistemas externos

## 📞 Soporte

El sistema de auditoría está completamente implementado y funcional. Para cualquier pregunta o mejora:

1. **Revisar logs** del sistema para errores
2. **Verificar permisos** del usuario
3. **Consultar documentación** de la API
4. **Revisar configuración** de la base de datos

---

**Sistema implementado**: ✅ Completamente funcional  
**Última actualización**: Septiembre 2025  
**Versión**: 1.1.0
