# Sistema de Seguridad Avanzada para Tokens

Este sistema implementa múltiples capas de seguridad para proteger los tokens de autenticación y prevenir el uso no autorizado.

## 🔐 Características de Seguridad

### 1. **Almacenamiento Seguro en SessionStorage**

- Los tokens se almacenan en `sessionStorage` en lugar de `localStorage`
- **Beneficio**: Los tokens se borran automáticamente al cerrar el navegador
- **Protección**: Previene persistencia no deseada de credenciales

### 2. **Device Fingerprinting**

- Genera una huella digital única del dispositivo/navegador
- **Componentes**: UserAgent, resolución de pantalla, timezone, idioma, platform, etc.
- **Protección**: Detecta si un token fue copiado a otro dispositivo

### 3. **Timeout de Inactividad (15 minutos)**

- Monitorea la actividad del usuario (mouse, teclado, scroll, touch)
- **Auto-logout**: Cierra sesión después de 15 minutos de inactividad
- **Protección**: Previene sesiones abandonadas

### 4. **Refresh Automático de Tokens**

- Actualiza tokens automáticamente 5 minutos antes de expirar
- **Protección**: Mantiene sesiones activas sin intervención del usuario
- **Fallback**: Logout automático si el refresh falla

### 5. **Cifrado de Datos Sensibles**

- Los tokens se almacenan cifrados en sessionStorage
- **Protección**: Dificulta la extracción manual de tokens

### 6. **Sincronización entre Pestañas**

- Detecta cambios de seguridad entre múltiples pestañas
- **Comportamiento**: Si una pestaña detecta compromiso, todas se cierran

## 🚀 Uso del Sistema

### Integración Básica

```typescript
// En tu componente principal
import { useSecureAuth } from "../hooks/useSecureAuth";
import { SessionTimeoutWarning } from "../components/SessionTimeoutWarning";

function App() {
  const { isAuthenticated, login, logout } = useSecureAuth();

  return (
    <div>
      {/* Tu aplicación */}

      {/* Warning automático de timeout */}
      <SessionTimeoutWarning />

      {/* Panel de debug (solo desarrollo) */}
      <SecurityDebugPanel enabled={false} />
    </div>
  );
}
```

### Login Seguro

```typescript
const { login } = useSecureAuth();

const handleLogin = async (email: string, password: string) => {
  const success = await login(email, password);
  if (success) {
    // Login exitoso
  }
};
```

### Verificación de Sesión

```typescript
const {
  isAuthenticated,
  isSessionValid,
  sessionTimeRemaining,
  checkSessionValidity,
} = useSecureAuth();

// Verificar manualmente
const isValid = checkSessionValidity();

// Obtener tiempo restante en milisegundos
const timeLeft = sessionTimeRemaining;
```

## 🛡️ Capas de Protección

### Nivel 1: Almacenamiento

- ✅ SessionStorage (no localStorage)
- ✅ Cifrado básico de tokens
- ✅ Limpieza automática al cerrar navegador

### Nivel 2: Validación

- ✅ Device fingerprinting
- ✅ Verificación de expiración
- ✅ Validación de integridad

### Nivel 3: Monitoreo

- ✅ Timeout de inactividad
- ✅ Sincronización entre pestañas
- ✅ Detección de cambios de dispositivo

### Nivel 4: Mantenimiento

- ✅ Refresh automático de tokens
- ✅ Logout automático en caso de error
- ✅ Notificaciones al usuario

## 📊 Componentes del Sistema

### SecurityService

Servicio principal que maneja toda la lógica de seguridad:

```typescript
// Almacenar tokens
securityService.storeTokens(token, refreshToken, 3600);

// Obtener tokens válidos
const tokens = securityService.getValidTokens();

// Verificar sesión
const isValid = securityService.hasValidSession();

// Limpiar sesión
securityService.clearSession();
```

### useSecureAuth Hook

Hook personalizado para componentes React:

```typescript
const {
  isAuthenticated,
  login,
  logout,
  sessionInfo,
  sessionTimeRemaining,
  checkSessionValidity,
} = useSecureAuth();
```

### SessionTimeoutWarning

Componente que muestra warnings de timeout:

```typescript
<SessionTimeoutWarning
  warningThreshold={5} // minutos antes de expirar
  className="custom-style"
/>
```

### SecurityDebugPanel

Panel de desarrollo para debugging:

```typescript
<SecurityDebugPanel enabled={isDevelopment} position="bottom-right" />
```

## ⚙️ Configuración

### Timeouts (en SecurityService)

```typescript
private static readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
private static readonly TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
```

### Eventos Monitoreados para Actividad

```typescript
const events = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
];
```

### Device Fingerprint Components

- UserAgent del navegador
- Resolución y profundidad de color de pantalla
- Zona horaria
- Idioma del navegador
- Plataforma del sistema
- Capacidades de hardware

## 🔧 Implementación en Backend

Para completar el sistema, el backend debe:

1. **Validar Device Fingerprint**

```typescript
// Incluir fingerprint en requests de login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password",
  "fingerprint": "abc123xyz"
}
```

2. **Endpoint de Refresh con Validación**

```typescript
POST /auth/refresh-token
{
  "refreshToken": "...",
  "fingerprint": "abc123xyz" // Debe coincidir con el almacenado
}
```

3. **Invalidación de Sesiones**

- Invalidar todos los tokens cuando se detecte fingerprint diferente
- Logging de intentos de acceso sospechosos
- Rate limiting en endpoints de auth

## 🚨 Eventos de Seguridad

El sistema emite los siguientes eventos:

- **Session Expired**: Sesión expirada por inactividad
- **Token Compromised**: Token detectado en dispositivo diferente
- **Token Refreshed**: Token actualizado exitosamente
- **Security Violation**: Violación de seguridad detectada

## 🧪 Testing

Para probar el sistema:

1. **Test de Inactividad**: Dejar la aplicación inactiva por 15+ minutos
2. **Test de Dispositivo**: Copiar token a otro navegador/dispositivo
3. **Test de Pestañas**: Abrir múltiples pestañas y cerrar sesión en una
4. **Test de Refresh**: Verificar que los tokens se actualizan automáticamente

## 📝 Migración desde Sistema Anterior

```typescript
// Limpiar tokens antiguos de localStorage
localStorage.removeItem("token");
localStorage.removeItem("refreshToken");

// El nuevo sistema usa automáticamente sessionStorage seguro
```

## 🔍 Debugging

Activar el panel de debug para monitorear:

- Estado de tokens en tiempo real
- Información de sesión actual
- Tiempo restante de sesión
- Device fingerprint actual

```typescript
<SecurityDebugPanel enabled={true} />
```

## 📈 Métricas de Seguridad

El sistema puede registrar:

- Intentos de acceso con tokens inválidos
- Detecciones de device fingerprint diferentes
- Sesiones expiradas por inactividad
- Refreshes exitosos/fallidos de tokens

---

**⚠️ Importante**: Este sistema proporciona múltiples capas de seguridad, pero siempre debe complementarse con validaciones del lado del servidor y buenas prácticas de seguridad generales.
