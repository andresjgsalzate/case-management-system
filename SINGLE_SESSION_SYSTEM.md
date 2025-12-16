# Sistema de Sesión Única por Usuario

Este sistema implementa un control estricto de sesiones para garantizar que cada usuario tenga únicamente **una sesión activa** a la vez, previniendo el compartir credenciales y el acceso concurrente desde múltiples dispositivos.

## 🎯 Características Principales

### ✅ Control de Sesión Única

- **Una sesión por usuario**: Cuando un usuario inicia sesión, todas las sesiones anteriores se invalidan automáticamente
- **Detección de dispositivos**: Registra información del navegador, sistema operativo y dispositivo
- **Seguimiento de ubicación**: Almacena dirección IP para auditoría de seguridad
- **Expiración automática**: Las sesiones tienen tiempo de vida limitado (24 horas por defecto)

### 🔒 Seguridad Avanzada

- **Hash de tokens**: Los tokens JWT nunca se almacenan en texto plano
- **Validación en tiempo real**: Cada request valida que la sesión siga activa
- **Auditoría completa**: Todos los eventos de login/logout se registran en el sistema de auditoría
- **Limpieza automática**: Job programado que limpia sesiones expiradas cada 30 minutos

### 📊 Monitoreo y Auditoría

- **Registro detallado**: Información de dispositivo, IP, fecha/hora de cada sesión
- **Razones de cierre**: Seguimiento del motivo de cierre (manual, forzado, expirado, nuevo login)
- **Estadísticas**: Endpoint para obtener sesiones activas por usuario
- **Logs de seguridad**: Integración con el sistema de auditoría existente

## 🏗️ Arquitectura del Sistema

### Entidades Principales

#### UserSession

```sql
- id: UUID único de la sesión
- user_id: Referencia al usuario
- token_hash: Hash SHA-256 del JWT token
- refresh_token_hash: Hash del refresh token
- device_info: JSON con información del dispositivo
- ip_address: IP desde donde se creó la sesión
- is_active: Estado de la sesión
- expires_at: Fecha de expiración
- last_activity_at: Última actividad
- logout_reason: Motivo del cierre
```

### Servicios

#### SessionService

- `createUniqueSession()`: Crea nueva sesión e invalida las anteriores
- `validateActiveSession()`: Verifica si un token tiene sesión activa
- `invalidateSession()`: Cierra una sesión específica
- `invalidateAllUserSessions()`: Cierra todas las sesiones de un usuario
- `cleanupExpiredSessions()`: Limpia sesiones expiradas

#### AuthService (Modificado)

- `login()`: Integrado con SessionService para crear sesión única
- `logout()`: Invalida la sesión actual
- `logoutAllSessions()`: Fuerza cierre de todas las sesiones del usuario
- `validateToken()`: Ahora valida también la sesión activa

## 🚀 Implementación

### 1. Flujo de Login

```typescript
// 1. Usuario envía credenciales
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// 2. Sistema valida credenciales y:
// - Invalida todas las sesiones anteriores del usuario
// - Crea nueva sesión única con información del dispositivo
// - Registra evento en auditoría

// 3. Respuesta exitosa
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 2. Validación de Requests

```typescript
// Cada request autenticado:
// 1. Extrae el JWT token del header Authorization
// 2. Valida el token JWT
// 3. Verifica que el token tenga una sesión activa
// 4. Actualiza last_activity_at
// 5. Si no hay sesión activa, retorna 401 Unauthorized
```

### 3. Logout

```typescript
// Logout normal
POST / api / auth / logout;
Authorization: Bearer<token>;

// Logout de todas las sesiones (administrador)
POST / api / auth / logout - all;
Authorization: Bearer<token>;
```

## 📱 Endpoints Disponibles

### Autenticación

- `POST /api/auth/login` - Iniciar sesión (invalida sesiones anteriores)
- `POST /api/auth/logout` - Cerrar sesión actual
- `POST /api/auth/logout-all` - Cerrar todas las sesiones del usuario

### Gestión de Sesiones

- `GET /api/auth/sessions` - Obtener sesiones activas del usuario actual

## 🔧 Configuración

### Variables de Entorno

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
```

### Configuración del Job de Limpieza

```typescript
// En server.ts
const sessionCleanupJob = new SessionCleanupJob();
sessionCleanupJob.start(30); // Limpieza cada 30 minutos
```

## 📋 Base de Datos

### Migración Requerida

Ejecutar el archivo de migración:

```bash
psql -d case_management -f database/migrations/create_user_sessions_table.sql
```

### Índices Optimizados

- `user_id + is_active` - Consultas por usuario activo
- `token_hash` - Validación rápida de tokens
- `expires_at` - Limpieza de sesiones expiradas
- `last_activity_at` - Ordenamiento por actividad

## 🚨 Comportamiento Esperado

### Escenarios de Uso

1. **Primer Login**

   - Usuario inicia sesión desde su navegador
   - Se crea nueva sesión activa
   - Token válido por 24 horas

2. **Segundo Login (Mismo Usuario)**

   - Usuario intenta iniciar sesión desde otro dispositivo
   - Sistema invalida la sesión anterior automáticamente
   - Se crea nueva sesión única
   - El primer dispositivo recibe 401 en el próximo request

3. **Sesión Expirada**

   - Después de 24 horas, la sesión expira
   - Job de limpieza marca la sesión como inactiva
   - Usuario debe volver a iniciar sesión

4. **Logout Manual**
   - Usuario hace logout voluntariamente
   - Sesión se marca como inactiva con razón "manual"
   - Token queda inmediatamente invalidado

## 📊 Auditoría y Monitoreo

### Eventos Registrados

- `LOGIN` - Nuevo inicio de sesión exitoso
- `LOGOUT` - Cierre de sesión manual
- `FORCE_LOGOUT` - Invalidación automática por nuevo login
- `LOGOUT_ALL` - Cierre forzado de todas las sesiones

### Información Auditada

- Dispositivo y navegador utilizado
- Dirección IP de origen
- Fecha/hora exacta
- Razón del cierre de sesión
- Cantidad de sesiones afectadas

## 🛠️ Mantenimiento

### Limpieza Automática

- Job programado se ejecuta cada 30 minutos
- Marca como inactivas las sesiones expiradas
- Registra la cantidad de sesiones limpiadas

### Función Manual de Limpieza

```sql
-- Ejecutar manualmente la limpieza
SELECT cleanup_expired_sessions();
```

### Consultas Útiles

```sql
-- Ver sesiones activas por usuario
SELECT u.email, COUNT(*) as active_sessions
FROM user_sessions s
JOIN user_profiles u ON s.user_id = u.id
WHERE s.is_active = true
GROUP BY u.email;

-- Ver sesiones por dispositivo
SELECT device_info->>'browser' as browser, COUNT(*)
FROM user_sessions
WHERE is_active = true
GROUP BY device_info->>'browser';

-- Sesiones por IP
SELECT ip_address, COUNT(*)
FROM user_sessions
WHERE is_active = true
GROUP BY ip_address;
```

## ⚠️ Consideraciones Importantes

### Impacto en Usuarios

- **Experiencia**: Los usuarios solo pueden estar conectados desde un dispositivo a la vez
- **Compartir credenciales**: Imposible - cada login invalida sesiones anteriores
- **Múltiples pestañas**: Funciona normal en el mismo navegador
- **Móvil + Desktop**: Requiere logout manual o automático por nuevo login

### Rendimiento

- Consulta adicional por cada request autenticado
- Almacenamiento incremental en tabla `user_sessions`
- Job de limpieza optimizado con índices

### Seguridad

- Los tokens nunca se almacenan en texto plano
- Información de dispositivo para detectar accesos sospechosos
- Auditoría completa para cumplimiento regulatorio
- Expiración automática como medida de seguridad adicional

## 🔄 Migración desde Sistema Anterior

Si ya tienes usuarios activos:

1. Ejecutar la migración de base de datos
2. Los tokens existentes seguirán funcionando temporalmente
3. Al hacer login nuevamente, se creará sesión en la nueva tabla
4. Los tokens antiguos sin sesión serán rechazados gradualmente

## 📞 Soporte y Troubleshooting

### Logs a Revisar

- `SessionService`: Creación/invalidación de sesiones
- `AuthService`: Validación de tokens y autenticación
- `SessionCleanupJob`: Limpieza automática

### Problemas Comunes

1. **"Token inválido" después de login**: Verificar que la migración se ejecutó correctamente
2. **Sesiones no se invalidan**: Revisar que `createUniqueSession` se llama en login
3. **Job no limpia sesiones**: Verificar logs del `SessionCleanupJob`
