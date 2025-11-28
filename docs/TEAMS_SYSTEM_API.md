# Sistema de Equipos - Documentación API

## Resumen

El sistema de equipos permite gestionar equipos de trabajo dentro de la organización, incluyendo la asignación de miembros, roles y permisos específicos por equipo.

## Estructura de la Base de Datos

### Tablas Principales

#### `teams`

- **id**: UUID único del equipo
- **name**: Nombre del equipo
- **code**: Código único del equipo (ej: DEV, SUPP, QA)
- **description**: Descripción del equipo
- **color**: Color hexadecimal para identificación visual
- **isActive**: Estado activo/inactivo
- **managerId**: ID del usuario manager del equipo
- **memberCount**: Número de miembros activos
- **createdAt/updatedAt**: Timestamps de auditoría

#### `team_members`

- **id**: UUID único de la membresía
- **teamId**: Referencia al equipo
- **userId**: Referencia al usuario
- **role**: Rol dentro del equipo (Manager, Member, Lead)
- **joinedAt**: Fecha de ingreso al equipo
- **leftAt**: Fecha de salida del equipo (null si activo)
- **isActive**: Estado de la membresía

### Equipos Predeterminados

| Equipo               | Código   | Color   | Descripción                           |
| -------------------- | -------- | ------- | ------------------------------------- |
| Desarrollo           | DEV      | #007ACC | Desarrollo de software y programación |
| Soporte              | SUPP     | #28A745 | Soporte técnico y mantenimiento       |
| Infraestructura      | INFRA    | #DC3545 | Infraestructura y operaciones TI      |
| Control de Calidad   | QA       | #FFC107 | Testing y aseguramiento de calidad    |
| Análisis de Negocio  | BA       | #6F42C1 | Análisis de requerimientos            |
| Gestión de Proyectos | PM       | #20C997 | Coordinación y planificación          |
| Arquitectura         | ARCH     | #6610F2 | Diseño de sistemas                    |
| Seguridad            | SEC      | #FD7E14 | Seguridad informática                 |
| Sin Asignar          | UNASSIGN | #6C757D | Usuarios sin equipo específico        |

## API Endpoints

### Autenticación

Todos los endpoints requieren autenticación mediante JWT token en el header `Authorization: Bearer <token>`.

### Endpoints de Equipos

#### `GET /api/teams`

Obtiene lista de equipos con filtros opcionales.

**Permisos requeridos**: `equipos.ver.own`, `equipos.ver.team`, o `equipos.ver.all`

**Query Parameters**:

- `search` (string): Buscar por nombre o código
- `isActive` (boolean): Filtrar por estado activo
- `hasMembers` (boolean): Solo equipos con miembros
- `page` (number): Página (default: 1)
- `limit` (number): Items por página (default: 10)

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "uuid",
        "name": "Desarrollo",
        "code": "DEV",
        "description": "Equipo de desarrollo",
        "color": "#007ACC",
        "isActive": true,
        "memberCount": 5,
        "manager": {
          "id": "uuid",
          "fullName": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### `POST /api/teams`

Crea un nuevo equipo.

**Permisos requeridos**: `equipos.crear.all`

**Body**:

```json
{
  "name": "Nuevo Equipo",
  "code": "NEW",
  "description": "Descripción del equipo",
  "color": "#FF5733",
  "managerId": "uuid-del-manager"
}
```

#### `GET /api/teams/:id`

Obtiene detalles de un equipo específico.

**Permisos requeridos**: `equipos.ver.own`, `equipos.ver.team`, o `equipos.ver.all`

#### `PUT /api/teams/:id`

Actualiza un equipo existente.

**Permisos requeridos**: `equipos.editar.own` o `equipos.editar.all`

#### `DELETE /api/teams/:id`

Elimina un equipo (soft delete).

**Permisos requeridos**: `equipos.eliminar.all`

### Endpoints de Miembros

#### `GET /api/teams/:teamId/members`

Obtiene miembros de un equipo.

**Permisos requeridos**: `equipos.ver.own`, `equipos.ver.team`, o `equipos.ver.all`

#### `POST /api/teams/:teamId/members`

Agrega un miembro al equipo.

**Permisos requeridos**: `equipos.miembros.gestionar.own`, `equipos.miembros.gestionar.team`, o `equipos.miembros.gestionar.all`

**Body**:

```json
{
  "userId": "uuid-del-usuario",
  "role": "Member"
}
```

#### `POST /api/teams/:teamId/bulk-members`

Agrega múltiples miembros al equipo.

**Body**:

```json
{
  "userIds": ["uuid1", "uuid2", "uuid3"],
  "role": "Member"
}
```

#### `PUT /api/teams/:teamId/members/:userId`

Actualiza un miembro del equipo.

#### `DELETE /api/teams/:teamId/members/:userId`

Remueve un miembro del equipo.

#### `PATCH /api/teams/:teamId/members/:userId/role`

Actualiza el rol de un miembro.

**Body**:

```json
{
  "role": "Lead"
}
```

### Endpoints Especiales

#### `GET /api/teams/my-teams`

Obtiene equipos del usuario autenticado.

#### `GET /api/teams/stats/overview`

Estadísticas generales de equipos.

#### `POST /api/teams/:teamId/transfer-leadership`

Transfiere el liderazgo del equipo.

#### `GET /api/teams/:teamId/stats`

Estadísticas de un equipo específico.

## Sistema de Permisos

### Módulo: `equipos`

#### Acciones disponibles:

- **ver**: Ver información de equipos
- **crear**: Crear nuevos equipos
- **editar**: Modificar equipos existentes
- **eliminar**: Eliminar equipos
- **miembros**: Gestionar miembros de equipos
- **roles**: Asignar/modificar roles en equipos
- **reportes**: Ver estadísticas y reportes

#### Scopes disponibles:

- **own**: Solo recursos propios (equipos donde el usuario es manager)
- **team**: Recursos del equipo (equipos donde el usuario es miembro)
- **all**: Todos los recursos del sistema

### Ejemplos de Permisos:

- `equipos.ver.own`: Ver solo equipos donde soy manager
- `equipos.ver.team`: Ver equipos donde soy miembro
- `equipos.ver.all`: Ver todos los equipos del sistema
- `equipos.miembros.gestionar.all`: Gestionar miembros de cualquier equipo

## Roles de Equipo

### Manager

- Líder del equipo
- Puede gestionar miembros si tiene permisos `equipos.miembros.gestionar.own`
- Solo puede haber un manager por equipo

### Lead

- Líder técnico o funcional
- Puede haber múltiples leads por equipo

### Member

- Miembro regular del equipo
- Rol por defecto para nuevos miembros

## Integración con Sistema Existente

### UserProfile

Se agregó la relación con equipos:

```typescript
@OneToMany(() => TeamMember, teamMember => teamMember.user)
teamMemberships: TeamMember[];
```

### Middleware de Autorización

El middleware existente fue extendido para incluir información de equipos del usuario en `req.userWithPermissions.teamIds`.

### Auditoría

Todas las operaciones de equipos son auditadas automáticamente por el sistema de auditoría existente.

## Casos de Uso Comunes

### 1. Asignar usuario a equipo de desarrollo

```bash
POST /api/teams/{dev-team-id}/members
{
  "userId": "user-uuid",
  "role": "Member"
}
```

### 2. Transferir liderazgo de equipo

```bash
POST /api/teams/{team-id}/transfer-leadership
{
  "newManagerId": "user-uuid"
}
```

### 3. Obtener estadísticas de equipo

```bash
GET /api/teams/{team-id}/stats
```

### 4. Buscar equipos activos

```bash
GET /api/teams?isActive=true&search=dev
```

## Consideraciones de Seguridad

1. **Autenticación obligatoria**: Todos los endpoints requieren JWT válido
2. **Autorización granular**: Permisos específicos por acción y scope
3. **Validación de entrada**: DTOs con validaciones comprehensivas
4. **Auditoría completa**: Todas las operaciones son registradas
5. **Soft deletes**: Los equipos no se eliminan físicamente

## Migraciones Incluidas

1. **create_teams_system.sql**: Crea tablas y estructura básica
2. **add_teams_permissions.sql**: Agrega permisos específicos de equipos
3. **seed_default_teams.sql**: Crea equipos predeterminados

## Próximos Pasos

1. **Frontend**: Implementar componentes React para gestión de equipos
2. **Notificaciones**: Sistema de notificaciones para cambios de equipo
3. **Reportes**: Dashboard avanzado de métricas por equipo
4. **Integración**: Conectar con sistema de casos y todos existente
