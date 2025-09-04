# Sistema de Gestión de Permisos

## Descripción

Sistema completo de gestión de permisos CRUD implementado para el sistema de administración. Incluye gestión de permisos, asignación por roles y guía de funcionamiento.

## Características Implementadas

### 🛡️ Gestión de Permisos (CRUD)

- **Crear Permisos**: Formulario completo con validaciones
- **Leer Permisos**: Tabla con filtros avanzados, búsqueda y paginación
- **Actualizar Permisos**: Modal de edición con validaciones
- **Eliminar Permisos**: Modal de confirmación con advertencias

### 📊 Funcionalidades Avanzadas

- **Filtros Múltiples**: Por módulo, acción, scope y estado
- **Búsqueda en Tiempo Real**: Buscar en nombre y descripción
- **Ordenamiento**: Por cualquier columna con indicadores visuales
- **Paginación**: Navegación eficiente de grandes datasets
- **Estadísticas**: Cards informativos con métricas del sistema

### 👥 Asignación por Roles

- **Interfaz de Asignación**: Gestión visual de permisos por rol
- **Búsqueda y Filtros**: Para encontrar permisos específicos
- **Asignación Masiva**: Selección múltiple de permisos
- **Revocación**: Eliminar permisos de roles existentes

### 📚 Guía de Permisos

- **Documentación Completa**: Explicación del sistema de permisos
- **Estructura de Permisos**: Formato módulo.acción_scope
- **Niveles de Acceso**: Own, Team, All con ejemplos
- **Mejores Prácticas**: Recomendaciones de seguridad

## Estructura del Sistema

### Formato de Permisos

```
módulo.acción_scope
```

**Ejemplos:**

- `permissions.read_all` - Leer todos los permisos
- `permissions.create_all` - Crear permisos
- `permissions.update_all` - Actualizar permisos
- `permissions.delete_all` - Eliminar permisos
- `permissions.assign_all` - Asignar permisos a roles

### Niveles de Acceso (Scopes)

- **own**: Solo recursos propios del usuario
- **team**: Recursos del equipo del usuario
- **all**: Todos los recursos del sistema

### Módulos Implementados

- **permissions**: Gestión del sistema de permisos
- **roles**: Administración de roles
- **users**: Gestión de usuarios
- Otros módulos según necesidades del sistema

## Archivos Implementados

### Frontend - Tipos TypeScript

```
frontend/src/types/permission.ts
```

- Interfaces para Permission, CreatePermissionRequest, UpdatePermissionRequest
- Tipos para filtros y parámetros de búsqueda
- Mapeo de nombres de módulos para display

### Frontend - Servicios

```
frontend/src/services/permissionService.ts
```

- Servicio completo para comunicación con API
- Métodos CRUD básicos
- Métodos utilitarios (getUniqueModules, getUniqueActions, etc.)
- Manejo de errores y autenticación JWT

### Frontend - Componentes

```
frontend/src/components/admin/permissions/
├── index.ts                      # Exportaciones
├── PermissionStatsCards.tsx      # Cards de estadísticas
├── PermissionTable.tsx           # Tabla principal con filtros
├── PermissionCreateModal.tsx     # Modal de creación
├── PermissionEditModal.tsx       # Modal de edición
├── PermissionDeleteModal.tsx     # Modal de eliminación
├── PermissionRoleAssignment.tsx  # Asignación por roles
└── PermissionsGuide.tsx         # Guía del sistema
```

### Frontend - Páginas

```
frontend/src/pages/permissions/
├── index.ts           # Exportaciones
└── PermissionsPage.tsx # Página principal
```

### Rutas Implementadas

- `/permissions` - Gestión principal de permisos
- `/permissions/role-assignment` - Asignación por roles
- `/permissions/guide` - Guía del sistema

## Permisos Creados en Base de Datos

Se crearon 8 permisos específicos para el módulo de permisos y se asignaron al rol "Administrador":

1. `permissions.read_all` - Ver todos los permisos
2. `permissions.create_all` - Crear nuevos permisos
3. `permissions.update_all` - Actualizar permisos existentes
4. `permissions.delete_all` - Eliminar permisos
5. `permissions.assign_all` - Asignar permisos a roles
6. `permissions.revoke_all` - Revocar permisos de roles
7. `permissions.manage_all` - Administración completa
8. `permissions.view_guide` - Ver guía de permisos

## Navegación

El sistema se integra en el sidebar principal con un menú desplegable:

- **Permisos** (menú principal)
  - Gestión de Permisos
  - Asignación por Rol
  - Guía de Permisos

## Características Técnicas

### Seguridad

- Autenticación JWT requerida
- Validación de permisos en rutas protegidas
- Sanitización de inputs en formularios

### UX/UI

- Design system consistente con Tailwind CSS
- Modo oscuro soportado
- Responsive design para móviles
- Feedback visual con toast notifications
- Loading states y error handling

### Performance

- Paginación eficiente
- Filtros del lado del servidor
- Debouncing en búsquedas
- Lazy loading de componentes

## Próximos Pasos

1. **Integración Backend**: Conectar con APIs reales del backend
2. **Testing**: Implementar tests unitarios y de integración
3. **Auditoría**: Sistema de logs para cambios de permisos
4. **Bulk Operations**: Operaciones masivas de permisos
5. **Import/Export**: Funcionalidad de respaldo y restauración

## Uso

### Para Administradores

1. Navegar a "Permisos" en el sidebar
2. Crear nuevos permisos según necesidades del módulo
3. Asignar permisos a roles apropiados
4. Revisar la guía para mejores prácticas

### Para Desarrolladores

1. Consultar la guía de permisos para entender la estructura
2. Crear permisos siguiendo el formato `módulo.acción_scope`
3. Asignar permisos apropiados a roles de prueba
4. Implementar validaciones de permisos en componentes

---

**Nota**: Este sistema sigue el principio del mínimo privilegio y las mejores prácticas de seguridad. Cada módulo que se agregue al sistema debe crear sus propios permisos independientes.
