# API de Permisos - Ejemplos de Uso

## Endpoints de Testing (Sin Autenticación)

### 1. Obtener todos los permisos

```bash
curl -X GET "http://localhost:3000/api/test/permissions"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "permissions": [
    {
      "id": "uuid",
      "name": "disposiciones.crear.own",
      "description": "Crear disposiciones propias",
      "module": "disposiciones",
      "action": "crear",
      "scope": "own",
      "isActive": true,
      "createdAt": "2025-08-29T03:22:36.922Z",
      "updatedAt": "2025-08-29T03:22:36.922Z"
    }
    // ... 75 permisos más
  ],
  "total": 76
}
```

### 2. Obtener todos los roles

```bash
curl -X GET "http://localhost:3000/api/test/roles"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "roles": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Administrador",
      "description": "Acceso completo al sistema con todos los permisos",
      "isActive": true,
      "createdAt": "2025-08-29T03:22:36.922Z",
      "updatedAt": "2025-08-29T03:22:36.922Z"
    }
  ],
  "total": 1
}
```

### 3. Obtener permisos de un rol específico

```bash
curl -X GET "http://localhost:3000/api/test/roles/00000000-0000-0000-0000-000000000001/permissions"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "role": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Administrador",
    "description": "Acceso completo al sistema con todos los permisos"
  },
  "permissions": [
    // Array con los 76 permisos asignados
  ],
  "permissionsByModule": {
    "disposiciones": [
      // 12 permisos del módulo disposiciones
    ],
    "casos": [
      // 14 permisos del módulo casos
    ]
    // ... otros módulos
  }
}
```

## Endpoints de Producción (Requieren Autenticación)

### Headers requeridos para endpoints protegidos:

```bash
-H "Authorization: Bearer <jwt_token>"
-H "Content-Type: application/json"
```

### 1. Gestión de Permisos

#### Crear nuevo permiso

```bash
curl -X POST "http://localhost:3000/api/permissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "documentos.crear.own",
    "description": "Crear documentos propios",
    "module": "documentos",
    "action": "crear",
    "scope": "own"
  }'
```

#### Actualizar permiso existente

```bash
curl -X PUT "http://localhost:3000/api/permissions/<permission_id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Nueva descripción del permiso",
    "isActive": false
  }'
```

#### Eliminar permiso

```bash
curl -X DELETE "http://localhost:3000/api/permissions/<permission_id>" \
  -H "Authorization: Bearer <token>"
```

### 2. Gestión de Roles

#### Crear nuevo rol

```bash
curl -X POST "http://localhost:3000/api/roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Editor",
    "description": "Puede editar contenido pero no administrar usuarios"
  }'
```

#### Asignar permisos a un rol

```bash
curl -X POST "http://localhost:3000/api/roles/<role_id>/permissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [
      "permission_id_1",
      "permission_id_2",
      "permission_id_3"
    ]
  }'
```

#### Remover permisos de un rol

```bash
curl -X DELETE "http://localhost:3000/api/roles/<role_id>/permissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [
      "permission_id_1",
      "permission_id_2"
    ]
  }'
```

## Ejemplos de Validación de Permisos

### En el middleware/controlador:

```typescript
// Validar si un usuario tiene un permiso específico
const hasPermission = await permissionService.hasUserPermission(
  userId,
  "disposiciones.crear.own"
);

// Validar múltiples permisos
const hasMultiplePermissions = await permissionService.hasUserPermissions(
  userId,
  ["casos.ver.team", "casos.editar.team"]
);

// Obtener todos los permisos de un usuario
const userPermissions = await permissionService.getUserPermissions(userId);
```

## Estructura de Datos

### Permiso

```typescript
interface Permission {
  id: string;
  name: string; // formato: "modulo.accion.scope"
  description: string;
  module: string; // ej: "disposiciones", "casos"
  action: string; // ej: "crear", "ver", "editar"
  scope: "own" | "team" | "all";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rol

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}
```

## Códigos de Error Comunes

### 401 - No autorizado

```json
{
  "success": false,
  "message": "Token de acceso requerido"
}
```

### 403 - Permisos insuficientes

```json
{
  "success": false,
  "message": "No tienes permisos suficientes para realizar esta acción"
}
```

### 404 - Recurso no encontrado

```json
{
  "success": false,
  "message": "Permiso no encontrado"
}
```

### 400 - Datos inválidos

```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "scope",
      "message": "Scope debe ser: own, team o all"
    }
  ]
}
```

## Health Check

### Verificar estado del servidor

```bash
curl -X GET "http://localhost:3000/api/health"
```

**Respuesta:**

```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2025-08-29T03:30:00.000Z",
  "version": "1.0.0"
}
```
