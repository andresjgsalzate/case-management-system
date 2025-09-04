# Configuración de Duración del Token - Sistema de Autenticación

## ⏰ **Duración del Token en Caso de Inactividad**

### **Configuración Actual del Token**

#### 🔑 **Token Principal (Access Token)**

- **Duración**: `24 horas` (configurado en `.env` como `JWT_EXPIRES_IN=24h`)
- **Propósito**: Autenticación para peticiones API
- **Comportamiento**: Se vence automáticamente después de 24 horas **independientemente de la actividad**

#### 🔄 **Refresh Token**

- **Duración**: `7 días` (configurado en `.env` como `JWT_REFRESH_EXPIRES_IN=7d`)
- **Propósito**: Renovar el access token cuando expira
- **Comportamiento**: Se vence después de 7 días **independientemente de la actividad**

### **Sistema de Renovación Automática**

#### 🤖 **Renovación Proactiva**

```typescript
// En AuthContext.tsx - Cada 14 minutos
setInterval(async () => {
  await refreshTokens();
}, 14 * 60 * 1000); // 14 minutos = 840,000ms
```

**¿Por qué cada 14 minutos?**

- Token dura 24 horas = 1440 minutos
- Renovación cada 14 minutos = ~103 renovaciones en 24h
- **Propósito**: Mantener el token siempre fresco y evitar expiración

### **Escenarios de Inactividad**

#### 📱 **Usuario Activo (navegando en la aplicación)**

- ✅ **Token se renueva automáticamente cada 14 minutos**
- ✅ **Sesión permanece activa indefinidamente**
- ✅ **No hay límite de tiempo mientras esté en la aplicación**

#### 😴 **Usuario Inactivo (aplicación abierta pero sin interacción)**

- ✅ **Token se sigue renovando cada 14 minutos en segundo plano**
- ✅ **Sesión permanece activa hasta que se cierre la pestaña/navegador**
- ✅ **No hay timeout por inactividad** (esto es una característica de diseño)

#### 🚪 **Usuario Cerró el Navegador/Pestaña**

- ❌ **Timer de renovación se detiene**
- ⏰ **Token expira en máximo 24 horas**
- ⏰ **Refresh token expira en máximo 7 días**
- 🔄 **Al volver, si es dentro de 7 días, sesión se restaura automáticamente**

#### 💻 **Computadora Apagada/Suspendida**

- ❌ **Timer de renovación se detiene**
- ⏰ **Token expira en máximo 24 horas desde la última renovación**
- ⏰ **Refresh token expira en máximo 7 días**
- 🔄 **Al volver, si es dentro de 7 días, sesión se restaura automáticamente**

### **Configuración en Archivos**

#### **Backend - environment.ts**

```typescript
jwt: {
  secret: process.env.JWT_SECRET || "fallback-secret-key",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",        // 24 horas
  refreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",  // 7 días
}
```

#### **Backend - .env**

```properties
JWT_EXPIRES_IN=24h          # Token principal: 24 horas
JWT_REFRESH_EXPIRES_IN=7d   # Refresh token: 7 días
```

#### **Frontend - AuthContext.tsx**

```typescript
setInterval(async () => {
  await refreshTokens();
}, 14 * 60 * 1000); // Renovación cada 14 minutos
```

## 🎯 **Respuesta Directa a tu Pregunta**

### **"¿Cuánto tiempo dura vivo el token en caso de inactividad?"**

**Respuesta Corta**:

- **Con aplicación abierta**: ♾️ **Indefinidamente** (se renueva automáticamente)
- **Con aplicación cerrada**: ⏰ **Máximo 7 días** (gracias al refresh token)

**Respuesta Detallada**:

1. **Inactividad con app abierta**: El token NO expira por inactividad. Se mantiene vivo indefinidamente gracias a la renovación automática cada 14 minutos.

2. **Inactividad con app cerrada**:
   - Primera barrera: **24 horas** (token principal)
   - Segunda barrera: **7 días** (refresh token)
   - Después de 7 días: Usuario debe hacer login nuevamente

### **Implicaciones de Seguridad**

#### ✅ **Ventajas del Diseño Actual**:

- UX fluida sin interrupciones por timeouts
- Tokens cortos (24h) = ventana de compromiso limitada
- Renovación automática = conveniencia para el usuario
- Refresh token permite sesiones largas controladas

#### ⚠️ **Consideraciones**:

- No hay timeout automático por inactividad
- Sesiones pueden durar indefinidamente si la app permanece abierta
- En ambientes corporativos, esto podría requerir configuración adicional

### **Opciones de Configuración**

Si necesitas cambiar estos valores, puedes modificar el archivo `.env`:

```properties
# Para token más corto (ej: 8 horas)
JWT_EXPIRES_IN=8h

# Para refresh token más corto (ej: 3 días)
JWT_REFRESH_EXPIRES_IN=3d

# Para renovación más frecuente, cambiar en AuthContext.tsx
# Actualmente: 14 * 60 * 1000 (14 minutos)
# Ejemplo: 5 * 60 * 1000 (5 minutos)
```

## 📊 **Cronograma de Ejemplo**

```
Usuario hace login: 09:00 AM
├── 09:14 AM: Token renovado automáticamente
├── 09:28 AM: Token renovado automáticamente
├── 09:42 AM: Token renovado automáticamente
├── ... (continúa cada 14 minutos)
└── Usuario cierra navegador: 05:00 PM
    ├── Token expira: 05:00 PM + 24h = 05:00 PM (día siguiente)
    └── Refresh token expira: 05:00 PM + 7d = 05:00 PM (7 días después)
```

**Conclusión**: El sistema está diseñado para máxima conveniencia del usuario, manteniendo la sesión activa mientras usa la aplicación, con una ventana de gracia de 7 días para sesiones cerradas.
