# 🔐 Plan de Implementación: Sistema Avanzado de Gestión de Sesiones

**Fecha:** 18 de diciembre de 2025  
**Versión:** 2.0 - Enhanced Security  
**Estado:** Pendiente de Aprobación

---

## 📋 Resumen Ejecutivo

Sistema de gestión de sesiones backend-driven con rotación agresiva de tokens para máxima seguridad, combinado con UX excelente mediante warnings de inactividad.

### **Características Principales:**

✅ **Token de vida corta:** 1 hora (vs 24h actual)  
✅ **Rotación en cada actividad:** Token cambia constantemente  
✅ **Refresh automático:** Antes de expirar en API calls  
✅ **Backend-driven:** Inactividad validada en servidor  
✅ **Warning UX:** 3 minutos antes de cerrar sesión  
✅ **Navegación segura:** Cada cambio de módulo = nuevo token  
✅ **Dificulta robo:** Token robado caduca rápidamente

---

## 🎯 Objetivos de Seguridad

| Objetivo                      | Solución                     | Impacto                        |
| ----------------------------- | ---------------------------- | ------------------------------ |
| **Reducir ventana de ataque** | Token 1h vs 24h              | 96% menos tiempo de exposición |
| **Dificultar robo de token**  | Rotación constante           | Token robado caduca en minutos |
| **Validar actividad real**    | Backend trackea lastActivity | Sin falsos positivos           |
| **Detectar sesiones zombie**  | Timeout 15 min backend       | Limpieza automática            |
| **UX sin interrupciones**     | Refresh transparente         | Usuario no nota cambios        |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CONFIGURACIÓN                               │
├─────────────────────────────────────────────────────────────────────┤
│  TOKEN_LIFETIME:           1 hora (3600 segundos)                   │
│  INACTIVITY_TIMEOUT:       15 minutos (900 segundos)                │
│  WARNING_THRESHOLD:        3 minutos antes (12 min de inactividad)  │
│  REFRESH_THRESHOLD:        10 minutos antes de expirar token        │
│  SESSION_CHECK_INTERVAL:   30 segundos (consulta estado backend)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    TRIGGERS DE REFRESH DE TOKEN                      │
├─────────────────────────────────────────────────────────────────────┤
│  1. ⏰ Token próximo a expirar (< 10 min restantes)                 │
│  2. 🔄 Navegación entre módulos/rutas                                │
│  3. ✅ Usuario confirma "Continuar" en warning de inactividad       │
│  4. 📡 Cualquier API call (si cumple condición #1)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📍 Flujo Detallado de la Sesión

### **Fase 1: Login (Tiempo 0:00)**

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Ingresa credenciales                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Frontend → Backend:                                             │
│   POST /auth/login                                              │
│   {                                                             │
│     email: "user@example.com",                                  │
│     password: "***"                                             │
│   }                                                             │
│                                                                 │
│ Backend Process:                                                │
│   1. ✓ Valida credenciales                                      │
│   2. ✓ Genera token JWT (exp: now + 1h)                         │
│   3. ✓ Crea sesión en DB:                                       │
│      - tokenHash: SHA256(token)                                 │
│      - lastActivity: now                                        │
│      - expiresAt: now + 1h                                      │
│      - isActive: true                                           │
│   4. ✓ Response:                                                │
│      {                                                          │
│        token: "eyJhbGc...",                                     │
│        refreshToken: "...",                                     │
│        expiresIn: 3600,                                         │
│        user: { id, email, fullName, role }                      │
│      }                                                          │
│                                                                 │
│ Frontend Process:                                               │
│   1. ✓ Almacena token en sessionStorage (seguro)               │
│   2. ✓ Inicia timers de monitoreo                              │
│   3. ✓ Registra callback de navegación                         │
│   4. ✓ Inicia pooling de estado de sesión (cada 30s)           │
│   5. ✓ Redirige a dashboard                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Fase 2: Actividad Normal (0:00 - 12:00 min)**

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Trabaja normalmente (clicks, API calls, navegación)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Ejemplo: Usuario navega de "Dashboard" → "Cases"               │
│ ────────────────────────────────────────────────────────────    │
│                                                                 │
│ Frontend (Router Guard):                                        │
│   beforeRouteChange() {                                         │
│     const tokenAge = now - tokenIssuedAt;                       │
│     const tokenExpiresIn = tokenExpiresAt - now;                │
│                                                                 │
│     if (tokenExpiresIn < 10_MINUTES) {                          │
│       await refreshToken(); // ✓ Refresh silencioso             │
│     }                                                           │
│   }                                                             │
│                                                                 │
│ → POST /auth/refresh-token                                      │
│   Headers: { Authorization: "Bearer old_token" }                │
│                                                                 │
│ Backend:                                                        │
│   1. ✓ Valida token actual (firma + no expirado)               │
│   2. ✓ Busca sesión en DB por tokenHash                        │
│   3. ✓ Valida sesión activa                                    │
│   4. ✓ Actualiza lastActivity = now                            │
│   5. ✓ Genera NUEVO token (exp: now + 1h)                      │
│   6. ✓ Actualiza tokenHash en sesión                           │
│   7. ✓ Invalida token anterior                                 │
│   8. ✓ Response:                                               │
│      {                                                          │
│        token: "nuevo_token_eyJhbGc...",                         │
│        expiresIn: 3600,                                         │
│        issuedAt: "2025-12-18T10:05:00Z"                         │
│      }                                                          │
│                                                                 │
│ Frontend:                                                       │
│   1. ✓ Reemplaza token en storage                              │
│   2. ✓ Actualiza axios headers                                 │
│   3. ✓ Resetea timers                                          │
│   4. ✓ Usuario ni se entera (transparente)                     │
│   5. ✓ Continúa navegación a "Cases"                           │
│                                                                 │
│ ⚠️ IMPORTANTE: Token anterior YA NO ES VÁLIDO                   │
│    Si alguien lo robó hace 2 min, ya caducó                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Ejemplo: Usuario hace API call (GET /cases)                    │
│ ────────────────────────────────────────────────────────────    │
│                                                                 │
│ Frontend (Axios Interceptor):                                   │
│   request.use(async (config) => {                               │
│     const tokenExpiresIn = getTokenExpiresIn();                 │
│                                                                 │
│     // ✓ Si token expira en < 10 min, refrescarlo primero      │
│     if (tokenExpiresIn < 10_MINUTES) {                          │
│       const newToken = await refreshToken();                    │
│       config.headers.Authorization = `Bearer ${newToken}`;      │
│     }                                                           │
│                                                                 │
│     return config;                                              │
│   });                                                           │
│                                                                 │
│ → GET /cases                                                    │
│   Headers: { Authorization: "Bearer token_recien_refrescado" } │
│                                                                 │
│ Backend (Middleware):                                           │
│   1. ✓ Valida token JWT                                        │
│   2. ✓ Busca sesión por tokenHash                              │
│   3. ✓ Valida sesión.isActive = true                           │
│   4. ✓ Calcula inactividad: now - session.lastActivity         │
│   5. ✓ Si inactividad > 15 min:                                │
│        → return 401 { error: "Session expired" }               │
│   6. ✓ Actualiza session.lastActivity = now                    │
│   7. ✓ Procesa request normalmente                             │
│   8. ✓ Response: { cases: [...] }                              │
│                                                                 │
│ Frontend:                                                       │
│   1. ✓ Recibe data                                             │
│   2. ✓ Detecta response exitoso → resetea timer inactividad    │
│   3. ✓ Renderiza cases                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Fase 3: Warning de Inactividad (12:00 min)**

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ SISTEMA: Detecta 12 minutos de inactividad                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Frontend (Pooling cada 30s):                                    │
│   const checkSession = async () => {                            │
│     const response = await fetch('/auth/session-status', {      │
│       headers: { Authorization: `Bearer ${token}` }             │
│     });                                                         │
│                                                                 │
│     const { inactiveFor, totalTimeout } = await response.json();│
│     const remaining = totalTimeout - inactiveFor;               │
│                                                                 │
│     if (remaining <= 3_MINUTES && remaining > 0) {              │
│       showWarningModal(remaining);                              │
│     }                                                           │
│   };                                                            │
│                                                                 │
│ Backend (Endpoint: GET /auth/session-status):                   │
│   1. ✓ Valida token                                            │
│   2. ✓ Busca sesión                                            │
│   3. ✓ Calcula: inactiveFor = now - lastActivity               │
│   4. ✓ Response:                                               │
│      {                                                          │
│        inactiveFor: 720000,     // 12 minutos en ms            │
│        totalTimeout: 900000,    // 15 minutos en ms            │
│        remaining: 180000,       // 3 minutos restantes         │
│        willExpireAt: "2025-12-18T10:15:00Z"                    │
│      }                                                          │
│                                                                 │
│ Frontend:                                                       │
│   ✓ Muestra modal de warning                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ⚠️ MODAL DE WARNING                         │
│                                                                 │
│   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│   ┃  ⏰ Tu sesión está por expirar                          ┃   │
│   ┃                                                         ┃   │
│   ┃  Tiempo restante: 02:45                                ┃   │
│   ┃                                                         ┃   │
│   ┃  No hemos detectado actividad en los últimos 12        ┃   │
│   ┃  minutos. ¿Deseas continuar trabajando?                ┃   │
│   ┃                                                         ┃   │
│   ┃  [  Continuar Trabajando  ]  [ Cerrar Sesión ]         ┃   │
│   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                                 │
│   Contador en vivo actualiza cada segundo                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Fase 4A: Usuario Extiende Sesión (Click "Continuar")**

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Click en "Continuar Trabajando"                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Frontend (onClick handler):                                     │
│   const extendSession = async () => {                           │
│     const response = await fetch('/auth/extend-session', {      │
│       method: 'POST',                                           │
│       headers: { Authorization: `Bearer ${token}` }             │
│     });                                                         │
│                                                                 │
│     const { token: newToken, expiresIn } = await response.json();│
│     storeNewToken(newToken, expiresIn);                         │
│     resetInactivityTimer();                                     │
│     closeWarningModal();                                        │
│   };                                                            │
│                                                                 │
│ Backend (POST /auth/extend-session):                            │
│   1. ✓ Valida token actual                                     │
│   2. ✓ Busca sesión en DB                                      │
│   3. ✓ Valida que no esté expirada aún                         │
│   4. ✓ Actualiza lastActivity = now                            │
│   5. ✓ Genera NUEVO token (exp: now + 1h)                      │
│   6. ✓ Actualiza tokenHash en sesión                           │
│   7. ✓ Invalida token anterior                                 │
│   8. ✓ Registra en audit log: "SESSION_EXTENDED"               │
│   9. ✓ Response:                                               │
│      {                                                          │
│        token: "nuevo_token_por_extension",                      │
│        expiresIn: 3600,                                         │
│        extended: true,                                          │
│        message: "Session extended successfully"                │
│      }                                                          │
│                                                                 │
│ Frontend:                                                       │
│   1. ✓ Reemplaza token (el anterior ya es inválido)            │
│   2. ✓ Resetea todos los timers                                │
│   3. ✓ Cierra modal                                            │
│   4. ✓ Usuario continúa trabajando                             │
│   5. ✓ Ciclo vuelve a empezar desde 0:00                       │
│                                                                 │
│ 🔒 SEGURIDAD:                                                   │
│    • Token anterior invalidado inmediatamente                  │
│    • Si alguien tenía token robado, ya no sirve                │
│    • Nuevo token tiene nueva expiración (1h)                   │
│    • lastActivity actualizado = nueva ventana de 15 min        │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Fase 4B: Usuario No Responde (15:00 min)**

```typescript
┌─────────────────────────────────────────────────────────────────┐
│ SISTEMA: Timeout alcanzado sin respuesta                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Frontend (Timer):                                               │
│   setTimeout(() => {                                            │
│     console.warn("Session expired by inactivity");              │
│     clearSession();                                             │
│     redirectToLogin();                                          │
│     showToast("Sesión cerrada por inactividad");                │
│   }, INACTIVITY_TIMEOUT);                                       │
│                                                                 │
│ O bien...                                                       │
│                                                                 │
│ Próximo API call automático:                                    │
│   → GET /auth/session-status                                    │
│                                                                 │
│ Backend (Middleware):                                           │
│   1. ✓ Valida token JWT (aún válido por firma)                 │
│   2. ✓ Busca sesión                                            │
│   3. ✓ Calcula inactividad: now - lastActivity = 15+ min       │
│   4. ✓ Marca sesión: isActive = false, logoutReason = "timeout"│
│   5. ✗ Response 401:                                           │
│      {                                                          │
│        error: "Session expired due to inactivity",              │
│        code: "SESSION_TIMEOUT",                                 │
│        inactiveFor: 900000 // 15 min                            │
│      }                                                          │
│                                                                 │
│ Frontend (Interceptor):                                         │
│   response.use(null, (error) => {                               │
│     if (error.response?.data?.code === 'SESSION_TIMEOUT') {     │
│       clearSession();                                           │
│       redirectToLogin();                                        │
│       showToast("Sesión cerrada por inactividad");              │
│     }                                                           │
│   });                                                           │
│                                                                 │
│ 🔒 RESULTADO:                                                   │
│    • Sesión marcada como inactiva en DB                        │
│    • Token ya no es válido para ningún request                 │
│    • Usuario redirigido a login                                │
│    • Debe re-autenticarse                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Triggers de Refresh de Token (Detallado)

### **1. Token Próximo a Expirar (< 10 min)**

```typescript
// Axios Request Interceptor
axios.interceptors.request.use(async (config) => {
  const token = getStoredToken();
  const tokenData = parseJWT(token);
  const expiresAt = tokenData.exp * 1000; // Convertir a ms
  const now = Date.now();
  const timeToExpire = expiresAt - now;

  // Si expira en menos de 10 minutos, refrescar
  if (timeToExpire < 10 * 60 * 1000) {
    console.log(
      `⏰ Token expira en ${Math.floor(
        timeToExpire / 60000
      )} min, refrescando...`
    );

    const newToken = await refreshTokenAPI();
    config.headers.Authorization = `Bearer ${newToken}`;

    console.log("✅ Token refrescado antes de API call");
  }

  return config;
});
```

**Frecuencia:** Cada API call  
**Impacto:** Usuario muy activo tendrá tokens de ~10-50 min de vida real

---

### **2. Navegación Entre Módulos**

```typescript
// React Router / Vue Router Guard
router.beforeEach(async (to, from, next) => {
  if (isAuthenticated()) {
    const tokenAge = getTokenAge(); // Edad del token actual

    // Estrategia: Refrescar en cada navegación si token tiene > 5 min
    if (tokenAge > 5 * 60 * 1000) {
      console.log(`🔄 Navegación ${from.path} → ${to.path}, refrescando token`);

      try {
        await refreshTokenAPI();
        console.log("✅ Token rotado en navegación");
      } catch (error) {
        console.error("❌ Error refrescando en navegación:", error);
        // Continuar con token actual si falla
      }
    }
  }

  next();
});
```

**Frecuencia:** Cada cambio de ruta  
**Impacto:** Token robado caduca al siguiente cambio de módulo del usuario real

---

### **3. Extensión Manual (Warning)**

```typescript
// Modal de warning - botón "Continuar"
const handleExtendSession = async () => {
  setIsExtending(true);

  try {
    const response = await fetch("/auth/extend-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to extend session");
    }

    const { token: newToken, expiresIn } = await response.json();

    // Almacenar nuevo token
    storeToken(newToken, expiresIn);

    // Resetear timers de inactividad
    resetInactivityTimer();

    // Cerrar modal
    setShowWarning(false);

    console.log("✅ Sesión extendida manualmente, nuevo token generado");
  } catch (error) {
    console.error("❌ Error extendiendo sesión:", error);
    // Forzar logout si falla
    logout();
  } finally {
    setIsExtending(false);
  }
};
```

**Frecuencia:** Manual (cuando usuario responde a warning)  
**Impacto:** Acción explícita del usuario = nuevo token + reset inactividad

---

### **4. API Calls Automáticos (Check Status)**

```typescript
// Pooling de estado de sesión cada 30 segundos
useEffect(() => {
  if (!isAuthenticated) return;

  const checkInterval = setInterval(async () => {
    try {
      const response = await fetch("/auth/session-status", {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("⚠️ Sesión inválida en check de estado");
          logout();
        }
        return;
      }

      const { inactiveFor, remaining } = await response.json();

      // Mostrar warning si quedan <= 3 minutos
      if (remaining <= 3 * 60 * 1000 && remaining > 0) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      }

      // Este call YA actualizó lastActivity en backend
      // Y si el token estaba próximo a expirar, el interceptor lo refrescó
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  }, 30000); // Cada 30 segundos

  return () => clearInterval(checkInterval);
}, [isAuthenticated]);
```

**Frecuencia:** Cada 30 segundos  
**Impacto:** Mantiene sesión viva + detecta expiración + activa warnings

---

## 🛡️ Matriz de Seguridad

### **Escenarios de Ataque y Mitigación**

| Escenario de Ataque           | Sin Sistema                 | Con Sistema                | Mitigación                     |
| ----------------------------- | --------------------------- | -------------------------- | ------------------------------ |
| **Token interceptado en red** | Token válido 24h            | Token válido max 10-50 min | Rotación constante lo invalida |
| **XSS roba token**            | Atacante usa token 24h      | Token caduca en minutos    | `sessionStorage` + rotación    |
| **Replay attack**             | Token reutilizable          | Token de un solo uso       | Backend invalida anterior      |
| **Sesión zombie**             | Persiste indefinidamente    | Muere a los 15 min         | Backend valida `lastActivity`  |
| **Man-in-the-middle**         | Token reusable              | Token caduca rápido        | HTTPS + rotación               |
| **Credential stuffing**       | 1 token = acceso permanente | Token temporal             | Vida corta + inactividad       |

### **Comparativa: Sistema Actual vs Nuevo**

| Aspecto                   | Sistema Actual (24h)  | Sistema Nuevo (1h + Rotación) | Mejora                 |
| ------------------------- | --------------------- | ----------------------------- | ---------------------- |
| **Ventana de robo**       | 24 horas              | 10-50 minutos                 | **96% reducción**      |
| **Tokens válidos**        | 1 token estático      | ~6-12 tokens/hora activa      | **Rotación constante** |
| **Detección inactividad** | Cliente (manipulable) | Servidor (confiable)          | **100% confiable**     |
| **Falsos positivos**      | Sí (mousemove, etc)   | No (solo API calls reales)    | **Actividad real**     |
| **Multi-dispositivo**     | No detecta            | Detecta                       | **Sesiones únicas**    |
| **Auditoría**             | Limitada              | Completa                      | **Full tracking**      |

---

## 📦 Componentes a Implementar

### **Backend (Node.js + TypeScript)**

#### **1. Nuevos Endpoints**

```typescript
// ===== POST /auth/refresh-token =====
// Refresca el token antes de que expire
interface RefreshTokenRequest {
  // Token en header: Authorization: Bearer <token>
}

interface RefreshTokenResponse {
  token: string; // Nuevo token
  expiresIn: number; // 3600 segundos
  issuedAt: string; // ISO timestamp
  refreshedAt: string; // ISO timestamp
}

// ===== POST /auth/extend-session =====
// Extiende sesión tras warning de inactividad
interface ExtendSessionResponse {
  token: string; // Nuevo token
  expiresIn: number; // 3600 segundos
  extended: true;
  message: string;
}

// ===== GET /auth/session-status =====
// Consulta estado de inactividad
interface SessionStatusResponse {
  isActive: boolean;
  inactiveFor: number; // Milisegundos sin actividad
  totalTimeout: number; // Límite total (15 min)
  remaining: number; // Tiempo restante
  willExpireAt: string; // ISO timestamp
  tokenExpiresIn: number; // Segundos hasta expiración del token
}
```

#### **2. Middleware de Validación**

```typescript
// middleware/sessionValidator.ts
export const validateSession = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    const session = await findSessionByToken(token);

    if (!session || !session.isActive) {
      return res.status(401).json({
        error: "Session not found or inactive",
        code: "INVALID_SESSION",
      });
    }

    // Validar inactividad
    const now = Date.now();
    const inactiveFor = now - session.lastActivity.getTime();

    if (inactiveFor > INACTIVITY_TIMEOUT) {
      // Marcar sesión como expirada
      await updateSession(session.id, {
        isActive: false,
        logoutReason: "timeout",
        logoutAt: new Date(),
      });

      return res.status(401).json({
        error: "Session expired due to inactivity",
        code: "SESSION_TIMEOUT",
        inactiveFor,
      });
    }

    // Actualizar lastActivity en cada request
    await updateLastActivity(session.id, new Date());

    // Agregar info de sesión al request
    req.session = session;
    req.user = session.user;

    next();
  } catch (error) {
    console.error("Session validation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
```

#### **3. Service de Sesiones (Actualizado)**

```typescript
// services/session.service.ts (nuevos métodos)

class SessionService {
  // ... métodos existentes ...

  /**
   * Refresca el token generando uno nuevo e invalidando el anterior
   */
  async refreshToken(oldToken: string): Promise<{
    token: string;
    expiresIn: number;
    issuedAt: Date;
  }> {
    const session = await this.findSessionByToken(oldToken);

    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Generar nuevo token
    const newToken = this.authService.generateToken(session.userId);
    const newTokenHash = this.hashToken(newToken);

    // Actualizar sesión
    await this.sessionRepository.update(session.id, {
      tokenHash: newTokenHash,
      lastActivity: new Date(),
      updatedAt: new Date(),
    });

    // Log para auditoría
    console.log(`Token refreshed for user ${session.userId}`);

    return {
      token: newToken,
      expiresIn: 3600,
      issuedAt: new Date(),
    };
  }

  /**
   * Extiende la sesión tras confirmación del usuario
   */
  async extendSession(token: string): Promise<{
    token: string;
    expiresIn: number;
    extended: boolean;
  }> {
    const session = await this.findSessionByToken(token);

    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Validar que no esté ya expirada por inactividad
    const inactiveFor = Date.now() - session.lastActivity.getTime();
    if (inactiveFor > INACTIVITY_TIMEOUT) {
      throw new Error("Session already expired");
    }

    // Generar nuevo token
    const newToken = this.authService.generateToken(session.userId);
    const newTokenHash = this.hashToken(newToken);

    // Actualizar sesión y resetear inactividad
    await this.sessionRepository.update(session.id, {
      tokenHash: newTokenHash,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      updatedAt: new Date(),
    });

    // Auditoría
    await this.auditLogRepository.save({
      userId: session.userId,
      action: "SESSION_EXTENDED",
      details: { sessionId: session.id },
      timestamp: new Date(),
    });

    console.log(`Session extended for user ${session.userId}`);

    return {
      token: newToken,
      expiresIn: 3600,
      extended: true,
    };
  }

  /**
   * Obtiene el estado de inactividad de la sesión
   */
  async getSessionStatus(token: string): Promise<{
    isActive: boolean;
    inactiveFor: number;
    remaining: number;
    tokenExpiresIn: number;
  }> {
    const session = await this.findSessionByToken(token);

    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const inactiveFor = now - session.lastActivity.getTime();
    const remaining = Math.max(0, INACTIVITY_TIMEOUT - inactiveFor);

    // Calcular expiración del token JWT
    const decodedToken = jwt.decode(token) as any;
    const tokenExpiresAt = decodedToken.exp * 1000;
    const tokenExpiresIn = Math.max(0, tokenExpiresAt - now);

    return {
      isActive: session.isActive && remaining > 0,
      inactiveFor,
      remaining,
      tokenExpiresIn,
    };
  }
}
```

#### **4. Controlador de Auth (Actualizado)**

```typescript
// controllers/auth.controller.ts (nuevas rutas)

router.post("/refresh-token", authenticate, async (req, res) => {
  try {
    const token = extractToken(req);
    const result = await sessionService.refreshToken(token);

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/extend-session", authenticate, async (req, res) => {
  try {
    const token = extractToken(req);
    const result = await sessionService.extendSession(token);

    res.json({
      ...result,
      message: "Session extended successfully",
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get("/session-status", authenticate, async (req, res) => {
  try {
    const token = extractToken(req);
    const status = await sessionService.getSessionStatus(token);

    res.json({
      ...status,
      totalTimeout: INACTIVITY_TIMEOUT,
      willExpireAt: new Date(Date.now() + status.remaining).toISOString(),
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

#### **5. Configuración (Actualizada)**

```typescript
// config/environment.ts
export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h", // ⚠️ Cambiar de 24h a 1h
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  session: {
    inactivityTimeout: 15 * 60 * 1000, // 15 minutos
    warningThreshold: 3 * 60 * 1000, // 3 minutos
    tokenRefreshThreshold: 10 * 60 * 1000, // 10 minutos antes de expirar
  },
};
```

---

### **Frontend (React + TypeScript)**

#### **1. Service de Auth (Actualizado)**

```typescript
// services/auth.service.ts

class AuthService {
  private baseURL = "/api/auth";

  /**
   * Refresca el token actual
   */
  async refreshToken(): Promise<string> {
    const currentToken = this.getStoredToken();

    if (!currentToken) {
      throw new Error("No token to refresh");
    }

    const response = await fetch(`${this.baseURL}/refresh-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const { token, expiresIn } = await response.json();

    // Almacenar nuevo token
    this.storeToken(token, expiresIn);

    return token;
  }

  /**
   * Extiende la sesión tras warning
   */
  async extendSession(): Promise<void> {
    const currentToken = this.getStoredToken();

    const response = await fetch(`${this.baseURL}/extend-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Session extension failed");
    }

    const { token, expiresIn } = await response.json();

    // Almacenar nuevo token
    this.storeToken(token, expiresIn);

    // Resetear timers
    this.resetInactivityTimer();
  }

  /**
   * Obtiene el estado de la sesión
   */
  async getSessionStatus(): Promise<SessionStatus> {
    const response = await fetch(`${this.baseURL}/session-status`, {
      headers: {
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get session status");
    }

    return await response.json();
  }

  /**
   * Almacena token con metadata
   */
  private storeToken(token: string, expiresIn: number): void {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + expiresIn * 1000;

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("tokenIssuedAt", issuedAt.toString());
    sessionStorage.setItem("tokenExpiresAt", expiresAt.toString());
  }

  /**
   * Obtiene tiempo restante hasta expiración del token
   */
  getTokenExpiresIn(): number {
    const expiresAt = parseInt(sessionStorage.getItem("tokenExpiresAt") || "0");
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Obtiene edad del token actual
   */
  getTokenAge(): number {
    const issuedAt = parseInt(sessionStorage.getItem("tokenIssuedAt") || "0");
    return Date.now() - issuedAt;
  }
}

export const authService = new AuthService();
```

#### **2. Axios Interceptors (Actualizado)**

```typescript
// utils/axios.config.ts

import axios from "axios";
import { authService } from "../services/auth.service";

const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutos

// Request Interceptor: Refrescar token si está próximo a expirar
axios.interceptors.request.use(
  async (config) => {
    const token = authService.getStoredToken();

    if (token && config.url !== "/api/auth/refresh-token") {
      const tokenExpiresIn = authService.getTokenExpiresIn();

      // Si el token expira en menos de 10 minutos, refrescarlo
      if (tokenExpiresIn < TOKEN_REFRESH_THRESHOLD && tokenExpiresIn > 0) {
        console.log(
          `⏰ Token expira en ${Math.floor(
            tokenExpiresIn / 60000
          )} min, refrescando...`
        );

        try {
          const newToken = await authService.refreshToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          console.log("✅ Token refrescado antes de request");
        } catch (error) {
          console.error("❌ Error refrescando token:", error);
          // Continuar con token actual si falla
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Manejar errores de sesión
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response?.status === 401) {
      const errorCode = response.data?.code;

      if (errorCode === "SESSION_TIMEOUT" || errorCode === "INVALID_SESSION") {
        console.warn("⚠️ Sesión expirada o inválida");

        // Limpiar sesión y redirigir a login
        authService.clearSession();
        window.location.href = "/login";

        // Mostrar mensaje al usuario
        if (errorCode === "SESSION_TIMEOUT") {
          alert("Tu sesión ha expirado por inactividad");
        }
      }
    }

    return Promise.reject(error);
  }
);
```

#### **3. Router Guard (React Router)**

```typescript
// utils/routerGuard.ts

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

const NAVIGATION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos

export const useNavigationTokenRefresh = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const refreshOnNavigation = async () => {
      if (!authService.isAuthenticated()) return;

      const tokenAge = authService.getTokenAge();

      // Si el token tiene más de 5 minutos, refrescarlo en navegación
      if (tokenAge > NAVIGATION_REFRESH_THRESHOLD) {
        console.log(`🔄 Navegación a ${location.pathname}, refrescando token`);

        try {
          await authService.refreshToken();
          console.log("✅ Token rotado en navegación");
        } catch (error) {
          console.error("❌ Error refrescando en navegación:", error);
        }
      }
    };

    refreshOnNavigation();
  }, [location.pathname]);
};

// Hook para usar en componentes
export const useProtectedRoute = () => {
  useNavigationTokenRefresh();

  // Validar autenticación
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
    }
  }, []);
};
```

#### **4. Hook de Inactividad (Actualizado)**

```typescript
// hooks/useInactivityWarning.ts

import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth.service";

const SESSION_CHECK_INTERVAL = 30000; // 30 segundos
const WARNING_THRESHOLD = 3 * 60 * 1000; // 3 minutos

export const useInactivityWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Verificar estado de sesión periódicamente
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const checkSession = async () => {
      try {
        const status = await authService.getSessionStatus();

        setTimeRemaining(status.remaining);

        // Mostrar warning si quedan <= 3 minutos
        if (status.remaining <= WARNING_THRESHOLD && status.remaining > 0) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);

        // Si el check falla con 401, probablemente sesión expirada
        if (error.response?.status === 401) {
          authService.clearSession();
          window.location.href = "/login";
        }
      }
    };

    // Check inicial
    checkSession();

    // Check periódico
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Extender sesión
  const extendSession = useCallback(async () => {
    setIsExtending(true);

    try {
      await authService.extendSession();

      setShowWarning(false);
      setTimeRemaining(0);

      console.log("✅ Sesión extendida exitosamente");
    } catch (error) {
      console.error("❌ Error extendiendo sesión:", error);

      // Si falla, probablemente ya expiró
      authService.clearSession();
      window.location.href = "/login";
    } finally {
      setIsExtending(false);
    }
  }, []);

  // Formatear tiempo restante
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    showWarning,
    timeRemaining,
    timeRemainingFormatted: formatTime(timeRemaining),
    isExtending,
    extendSession,
  };
};
```

#### **5. Componente Modal de Warning**

```typescript
// components/InactivityWarningModal.tsx

import React from "react";
import { useInactivityWarning } from "../hooks/useInactivityWarning";

export const InactivityWarningModal: React.FC = () => {
  const { showWarning, timeRemainingFormatted, isExtending, extendSession } =
    useInactivityWarning();

  if (!showWarning) return null;

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ⏰ Tu sesión está por expirar
            </h3>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-3">
              {timeRemainingFormatted}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              No hemos detectado actividad en los últimos 12 minutos.
              <br />
              ¿Deseas continuar trabajando?
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={extendSession}
            disabled={isExtending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isExtending ? "Extendiendo..." : "Continuar Trabajando"}
          </button>
          <button
            onClick={handleLogout}
            disabled={isExtending}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Tu sesión se cerrará automáticamente cuando el tiempo llegue a 0:00
        </p>
      </div>
    </div>
  );
};
```

#### **6. Integración en App.tsx**

```typescript
// App.tsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InactivityWarningModal } from "./components/InactivityWarningModal";
import { useProtectedRoute } from "./utils/routerGuard";

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useProtectedRoute(); // Hook que maneja refresh en navegación

  return (
    <>
      {children}
      <InactivityWarningModal />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/cases"
          element={
            <ProtectedLayout>
              <Cases />
            </ProtectedLayout>
          }
        />

        {/* Más rutas protegidas... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 📊 Plan de Implementación

### **Fase 1: Backend Foundation (Día 1)**

- [ ] Actualizar `config.jwt.expiresIn` de `24h` a `1h`
- [ ] Implementar endpoint `POST /auth/refresh-token`
- [ ] Implementar endpoint `POST /auth/extend-session`
- [ ] Implementar endpoint `GET /auth/session-status`
- [ ] Actualizar middleware `validateSession` con validación de inactividad
- [ ] Agregar métodos en `SessionService`: `refreshToken()`, `extendSession()`, `getSessionStatus()`
- [ ] Testing de endpoints con Postman/Insomnia

### **Fase 2: Frontend Core (Día 2)**

- [ ] Actualizar `AuthService` con nuevos métodos
- [ ] Configurar Axios interceptors para refresh automático
- [ ] Implementar router guard para refresh en navegación
- [ ] Agregar metadata de token en sessionStorage (issuedAt, expiresAt)
- [ ] Testing manual de refresh en API calls

### **Fase 3: UX Inactividad (Día 3)**

- [ ] Crear hook `useInactivityWarning`
- [ ] Implementar componente `InactivityWarningModal`
- [ ] Integrar pooling de estado de sesión (cada 30s)
- [ ] Agregar contador en vivo en modal
- [ ] Testing de escenarios de inactividad

### **Fase 4: Testing & Refinamiento (Día 4)**

- [ ] Testing E2E de flujos completos
- [ ] Validar rotación de tokens en todos los escenarios
- [ ] Testing de casos edge (token expirado durante request, etc)
- [ ] Optimizar frecuencia de checks y refreshes
- [ ] Auditoría de logs y seguridad

### **Fase 5: Deployment (Día 5)**

- [ ] Deployment a staging
- [ ] Testing con usuarios reales
- [ ] Monitoreo de performance y errores
- [ ] Ajustes finales
- [ ] Deployment a producción

---

## ✅ Checklist de Validación Pre-Deploy

### **Seguridad:**

- [ ] Token de 1 hora configurado
- [ ] Tokens anteriores se invalidan al refrescar
- [ ] Backend valida inactividad en cada request
- [ ] sessionStorage usado (no localStorage)
- [ ] HTTPS en producción
- [ ] Logs de auditoría funcionando

### **Funcionalidad:**

- [ ] Login funciona y genera token 1h
- [ ] API calls refrescan token si está por expirar
- [ ] Navegación entre módulos refresca token
- [ ] Warning aparece a los 12 min de inactividad
- [ ] Botón "Continuar" extiende sesión correctamente
- [ ] Sesión expira a los 15 min sin actividad
- [ ] Logout limpia todo correctamente

### **UX:**

- [ ] No hay interrupciones visibles por refreshes
- [ ] Warning es claro y tiene contador en vivo
- [ ] Mensajes de error son informativos
- [ ] Transiciones son suaves
- [ ] Redirect a login tras expiración funciona

### **Performance:**

- [ ] Pooling cada 30s no afecta performance
- [ ] Refreshes no generan lag
- [ ] Backend responde rápido (<100ms)
- [ ] No hay memory leaks en timers

---

## 🔍 Monitoreo Post-Deploy

### **Métricas a Trackear:**

1. **Frecuencia de refresh de tokens** (promedio por sesión)
2. **Tasa de extensión de sesión** (% usuarios que clickean "Continuar")
3. **Sesiones expiradas por inactividad** (por día)
4. **Errores de refresh de token** (rate)
5. **Tiempo promedio de sesión activa**
6. **Distribución de duración de tokens** (vida real vs 1h)

### **Alertas:**

- [ ] Tasa de error en refresh > 1%
- [ ] Latencia de /session-status > 200ms
- [ ] Sesiones zombie (activas > 15 min sin activity en DB)

---

## 📚 Documentación para Equipo

### **Para Desarrolladores:**

- Archivo: `docs/SESSION_MANAGEMENT_DEV_GUIDE.md`
- Incluir: Arquitectura, APIs, hooks, debugging

### **Para QA:**

- Archivo: `docs/SESSION_TESTING_GUIDE.md`
- Incluir: Casos de prueba, escenarios edge, checklist

### **Para Usuarios:**

- Sección en manual: "Gestión de Sesiones"
- Incluir: Qué es el warning, qué hacer si expira, FAQ

---

## 💡 FAQs Técnicas

**P: ¿Por qué 10 minutos de threshold para refresh?**  
R: Margen de seguridad para API calls largos. Si un request tarda 2 min y el token expira en 5, aún tenemos buffer.

**P: ¿Qué pasa si falla el refresh?**  
R: El interceptor continúa con el token actual. Si está expirado, backend rechaza con 401 y se fuerza logout.

**P: ¿Pooling cada 30s no es mucho?**  
R: Es un GET ligero (~100ms, <1KB). Con 100 usuarios = ~200 requests/min, manejable. Alternativa: websockets.

**P: ¿Por qué refrescar en navegación?**  
R: Dificulta robo de token. Si se roba, al siguiente cambio de módulo del usuario real, token robado caduca.

**P: ¿Puedo aumentar inactividad a 30 min?**  
R: Sí, solo cambiar `INACTIVITY_TIMEOUT`. El sistema escala sin problemas.

---

## 🎯 Conclusión

Este sistema proporciona:

- **96% reducción** en ventana de ataque vs sistema actual
- **Rotación constante** de tokens (6-12 por hora activa)
- **Detección confiable** de inactividad (backend-driven)
- **UX excelente** (transparente + warnings claros)
- **Escalabilidad** ilimitada (funciona con cualquier timeout)

**Inversión:** ~4-5 días de desarrollo  
**Retorno:** Seguridad enterprise-grade + UX sin interrupciones

---

## ✍️ Aprobaciones

| Rol           | Nombre | Firma      | Fecha |
| ------------- | ------ | ---------- | ----- |
| **Tech Lead** |        | ☐ Aprobado |       |
| **Security**  |        | ☐ Aprobado |       |
| **Product**   |        | ☐ Aprobado |       |
| **QA Lead**   |        | ☐ Aprobado |       |

---

**Documento generado:** 18 de diciembre de 2025  
**Versión:** 2.0 Enhanced  
**Próxima revisión:** Pre-deploy review
