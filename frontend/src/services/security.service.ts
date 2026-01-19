/**
 * Servicio de Seguridad Avanzada para Tokens
 *
 * Funcionalidades:
 * - Tokens en sessionStorage (mueren al cerrar navegador)
 * - Fingerprinting de dispositivo/navegador
 * - Timeout de inactividad (15 minutos)
 * - Protección contra copia manual de tokens
 * - Refresh automático de tokens
 * - Detección de múltiples pestañas
 */

interface DeviceFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  hash: string;
}

interface SecureTokenData {
  token: string;
  refreshToken: string;
  fingerprint: string;
  lastActivity: number;
  sessionId: string;
  expiresAt: number;
}

class SecurityService {
  private static readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  private static readonly TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private static readonly SESSION_KEY = "__secure_session__";
  private static readonly ACTIVITY_KEY = "__last_activity__";

  private inactivityTimer: number | null = null;
  private refreshTimer: number | null = null;
  private onSessionExpired?: () => void;
  private onTokenRefreshed?: (newToken: string) => void;
  private isWarningShown = false;
  private progressTimer: number | null = null;
  private timerStartTime: number = 0;

  constructor() {
    this.setupActivityMonitoring();
    this.setupTabSynchronization();
    this.validateExistingSession();
  }

  /**
   * Genera una huella digital estable del dispositivo/navegador
   * Versión mejorada que evita elementos volátiles
   * NOTA: No usamos screen.width/height porque cambian al mover ventana entre monitores
   */
  private generateFingerprint(): DeviceFingerprint {
    // Solo usar elementos estables que no cambien entre sesiones NI entre monitores
    const stableElements = {
      userAgent: navigator.userAgent,
      // Usar colorDepth y pixelDepth que son más estables que resolución
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    };

    // Generar hash de elementos estables
    const fpString = JSON.stringify(stableElements);
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
      const char = fpString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32bit integer
    }

    const stableHash = hash.toString(36);

    // Mantener interfaz original pero usar elementos estables
    // El valor de "screen" ahora no afecta el hash
    const fingerprint = {
      userAgent: navigator.userAgent,
      screen: `${screen.colorDepth}x${screen.pixelDepth}`, // Ya no usa width/height
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hash: stableHash, // Usar hash estable
    };

    return fingerprint;
  }

  /**
   * Genera un ID de sesión único
   */
  private generateSessionId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Almacena tokens de forma segura
   */
  public storeTokens(
    token: string,
    refreshToken: string,
    expiresIn: number = 3600,
  ): void {
    const fingerprint = this.generateFingerprint();
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const secureData: SecureTokenData = {
      token,
      refreshToken,
      fingerprint: fingerprint.hash,
      lastActivity: now,
      sessionId,
      expiresAt: now + expiresIn * 1000,
    };

    // Almacenar en sessionStorage (se borra al cerrar navegador)
    sessionStorage.setItem(
      SecurityService.SESSION_KEY,
      this.encrypt(JSON.stringify(secureData)),
    );
    sessionStorage.setItem(SecurityService.ACTIVITY_KEY, now.toString());

    // Almacenar fingerprint cifrado en localStorage para validación posterior
    localStorage.setItem("__fp__", this.encrypt(fingerprint.hash));

    this.startInactivityTimer();
    this.startRefreshTimer(expiresIn);
  }

  /**
   * Recupera tokens si son válidos y seguros
   */
  public getValidTokens(): { token: string; refreshToken: string } | null {
    try {
      const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);

      // Validating session data availability

      if (!encryptedData) {
        // No session data found
        return null;
      }

      const secureData: SecureTokenData = JSON.parse(
        this.decrypt(encryptedData),
      );

      const now = Date.now();

      // 1. PRIMERO: Verificar expiración del token
      if (now > secureData.expiresAt) {
        console.warn("🚨 Token expirado, limpiando sesión");
        this.clearSession();
        return null;
      }

      // 2. SEGUNDO: Verificar inactividad (ANTES del fingerprint)
      const timeSinceActivity = now - secureData.lastActivity;
      if (timeSinceActivity > SecurityService.INACTIVITY_TIMEOUT) {
        console.warn("🚨 Sesión expirada por inactividad");
        this.clearSession();
        return null;
      }

      // 3. TERCERO: Verificar huella digital
      const currentFingerprint = this.generateFingerprint().hash;

      // Priorizar el fingerprint de sessionStorage (más confiable)
      // porque se genera al momento del login y vive solo en esta sesión
      if (secureData.fingerprint !== currentFingerprint) {
        console.warn("🚨 Token comprometido: Cambio de dispositivo detectado", {
          stored: secureData.fingerprint,
          current: currentFingerprint,
        });
        this.clearSession();
        return null;
      }

      // Validación secundaria con localStorage (solo si está disponible)
      // Si localStorage no tiene el fingerprint pero sessionStorage sí coincide,
      // regeneramos el de localStorage en lugar de cerrar sesión
      const storedFingerprint = localStorage.getItem("__fp__");
      if (!storedFingerprint) {
        // Regenerar fingerprint en localStorage si no existe
        localStorage.setItem("__fp__", this.encrypt(currentFingerprint));
      } else {
        try {
          const decryptedFp = this.decrypt(storedFingerprint);
          if (decryptedFp !== currentFingerprint) {
            // Si no coincide, actualizar localStorage con el fingerprint correcto
            // (el de sessionStorage ya fue validado)
            localStorage.setItem("__fp__", this.encrypt(currentFingerprint));
          }
        } catch {
          // Si hay error al descifrar, regenerar
          localStorage.setItem("__fp__", this.encrypt(currentFingerprint));
        }
      }

      // Actualizar última actividad
      this.updateLastActivity();

      return {
        token: secureData.token,
        refreshToken: secureData.refreshToken,
      };
    } catch (error) {
      console.error("❌ Error al recuperar tokens:", error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Actualiza los tokens tras un refresh exitoso
   * NOTA: Este método NO valida la sesión actual porque precisamente
   * se usa cuando el token ha expirado y necesitamos actualizarlo.
   */
  public updateTokens(newToken: string, newRefreshToken?: string): void {
    const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
    if (!encryptedData) {
      console.warn(
        "⚠️ [SecurityService] No hay datos de sesión para actualizar tokens",
      );
      return;
    }

    try {
      const secureData: SecureTokenData = JSON.parse(
        this.decrypt(encryptedData),
      );
      const now = Date.now();

      secureData.token = newToken;
      if (newRefreshToken) {
        secureData.refreshToken = newRefreshToken;
      }
      secureData.lastActivity = now;

      // Extender el tiempo de expiración del token (1 hora desde ahora)
      secureData.expiresAt = now + 3600 * 1000;

      sessionStorage.setItem(
        SecurityService.SESSION_KEY,
        this.encrypt(JSON.stringify(secureData)),
      );

      // Actualizar también el ACTIVITY_KEY
      sessionStorage.setItem(SecurityService.ACTIVITY_KEY, now.toString());

      // Reiniciar los timers con el nuevo token
      this.startInactivityTimer();
      this.startRefreshTimer(3600); // 1 hora

      console.log("✅ [SecurityService] Tokens actualizados exitosamente");

      if (this.onTokenRefreshed) {
        this.onTokenRefreshed(newToken);
      }
    } catch (error) {
      console.error("❌ [SecurityService] Error actualizando tokens:", error);
    }
  }

  /**
   * Limpia completamente la sesión
   */
  public clearSession(): void {
    sessionStorage.removeItem(SecurityService.SESSION_KEY);
    sessionStorage.removeItem(SecurityService.ACTIVITY_KEY);
    localStorage.removeItem("__fp__");

    this.stopTimers();
  }

  /**
   * Configura la monitorización de actividad del usuario
   */
  private setupActivityMonitoring(): void {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const activityHandler = (_event: Event) => {
      // Solo log cuando hay warning activo (caso excepcional)
      if (this.isWarningShown) {
        console.log(
          "🚫 ACTIVIDAD IGNORADA: Warning activo, no se resetea el timer",
        );
        return;
      }

      // Reset normal sin log para evitar spam
      this.updateLastActivity();
      this.resetInactivityTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, activityHandler, true);
    });

    // Monitorizar visibilidad de la página
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.validateExistingSession();
      }
    });
  }

  /**
   * Configura sincronización entre pestañas
   */
  private setupTabSynchronization(): void {
    window.addEventListener("storage", (e) => {
      // Si otra pestaña limpia la sesión, también limpiamos esta
      if (e.key === "__fp__" && e.newValue === null) {
        this.clearSession();
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
      }
    });

    // Detectar cuando se cierra la última pestaña
    window.addEventListener("beforeunload", () => {
      // Solo limpiar si no hay otras pestañas activas
      const tabId =
        sessionStorage.getItem("__tab_id__") || this.generateSessionId();
      sessionStorage.setItem("__tab_id__", tabId);
    });
  }

  /**
   * Valida la sesión existente al cargar
   */
  private validateExistingSession(): void {
    const tokens = this.getValidTokens();
    if (!tokens && sessionStorage.getItem(SecurityService.SESSION_KEY)) {
      // Sesión inválida pero existe, limpiar y notificar
      this.clearSession();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    } else if (tokens) {
      // Sesión válida, reestablecer timers
      this.startInactivityTimer();
      const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
      if (encryptedData) {
        const secureData: SecureTokenData = JSON.parse(
          this.decrypt(encryptedData),
        );
        const remainingTime = Math.max(0, secureData.expiresAt - Date.now());
        this.startRefreshTimer(remainingTime / 1000);
      }
    }
  }

  /**
   * Actualiza la marca de tiempo de última actividad
   */
  private updateLastActivity(): void {
    const now = Date.now();
    sessionStorage.setItem(SecurityService.ACTIVITY_KEY, now.toString());

    // También actualizar en los datos seguros
    const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
    if (encryptedData) {
      try {
        const secureData: SecureTokenData = JSON.parse(
          this.decrypt(encryptedData),
        );
        secureData.lastActivity = now;
        sessionStorage.setItem(
          SecurityService.SESSION_KEY,
          this.encrypt(JSON.stringify(secureData)),
        );
      } catch (error) {
        console.error("Error actualizando actividad:", error);
      }
    }
  }

  /**
   * Inicia el timer de inactividad
   */
  private startInactivityTimer(): void {
    this.stopInactivityTimer();
    this.isWarningShown = false; // Reset warning flag al iniciar nuevo timer

    this.timerStartTime = Date.now();
    // Timer iniciado sin logs para evitar spam

    this.inactivityTimer = window.setTimeout(() => {
      console.warn(
        "⏰ TIMEOUT: Sesión expirada por inactividad - INICIANDO PROCESO DE LOGOUT",
      );
      this.clearSession();
      if (this.onSessionExpired) {
        console.log("🎯 CALLBACK: Ejecutando onSessionExpired callback");
        this.onSessionExpired();
      } else {
        console.error("❌ ERROR: No hay callback onSessionExpired registrado");
      }
    }, SecurityService.INACTIVITY_TIMEOUT);

    // Timer de progreso cada 10 segundos
    this.startProgressTimer();
  }

  /**
   * Inicia el timer de progreso que muestra logs cada 10 segundos
   */
  private startProgressTimer(): void {
    this.stopProgressTimer();

    const logProgress = () => {
      const now = Date.now();
      const elapsed = now - this.timerStartTime;
      const remaining = Math.max(
        0,
        SecurityService.INACTIVITY_TIMEOUT - elapsed,
      );
      // Actualizar warning estado basado en tiempo restante real
      const warningThreshold = 2 * 60 * 1000; // 2 minutos
      const shouldShowWarning = remaining <= warningThreshold && remaining > 0;

      // Si necesitamos mostrar warning y no está activo aún
      if (shouldShowWarning && !this.isWarningShown) {
        this.isWarningShown = true;
        console.log("⚠️ WARNING ACTIVADO: Quedan menos de 2 minutos");
      }

      if (remaining > 0) {
        // Timer sin logs de progreso para evitar spam
        this.progressTimer = window.setTimeout(logProgress, 10000);
      } else {
        console.log(
          "💀 PROGRESO: Timer completado - sesión debería haber expirado",
        );
      }
    };

    // Iniciar el primer log en 10 segundos
    this.progressTimer = window.setTimeout(logProgress, 10000);
  }

  /**
   * Detiene el timer de progreso
   */
  private stopProgressTimer(): void {
    if (this.progressTimer) {
      window.clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Reinicia el timer de inactividad
   */
  private resetInactivityTimer(): void {
    // Log de reset eliminado para evitar spam - solo eventos críticos se registran

    if (!this.isWarningShown) {
      this.startInactivityTimer();
    } else {
      console.log(
        "🚫 RESET BLOQUEADO: Warning ya está activo, no se permite reset",
      );
    }
  }

  /**
   * Detiene el timer de inactividad
   */
  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      window.clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.stopProgressTimer();
    this.timerStartTime = 0;
    this.isWarningShown = false;
  }

  /**
   * Inicia el timer de refresh de tokens
   */
  private startRefreshTimer(expiresInSeconds: number): void {
    this.stopRefreshTimer();

    // Programar refresh 5 minutos antes de que expire
    const refreshIn = Math.max(
      1000,
      expiresInSeconds * 1000 - SecurityService.TOKEN_REFRESH_INTERVAL,
    );

    this.refreshTimer = window.setTimeout(async () => {
      await this.attemptTokenRefresh();
    }, refreshIn);
  }

  /**
   * Detiene el timer de refresh
   */
  private stopRefreshTimer(): void {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Detiene todos los timers
   */
  private stopTimers(): void {
    this.stopInactivityTimer();
    this.stopRefreshTimer();
  }

  /**
   * Intenta refrescar el token automáticamente
   * Este método obtiene los tokens directamente sin validar inactividad,
   * ya que precisamente queremos refrescar el token cuando puede estar
   * cerca de expirar.
   */
  private async attemptTokenRefresh(): Promise<void> {
    // Obtener tokens directamente sin validar inactividad
    const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
    if (!encryptedData) {
      console.warn(
        "⚠️ [SecurityService] No hay datos de sesión para refrescar",
      );
      return;
    }

    let tokens: { token: string; refreshToken: string };
    try {
      const secureData: SecureTokenData = JSON.parse(
        this.decrypt(encryptedData),
      );
      tokens = {
        token: secureData.token,
        refreshToken: secureData.refreshToken,
      };
    } catch (error) {
      console.error("❌ [SecurityService] Error leyendo tokens:", error);
      return;
    }

    if (!tokens.refreshToken) {
      console.warn("⚠️ [SecurityService] No hay refresh token disponible");
      return;
    }

    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { authService } = await import("./auth.service");

      console.log(
        "🔄 [SecurityService] Intentando refrescar token automáticamente...",
      );

      const refreshResponse = await authService.refreshToken(
        tokens.refreshToken,
      );

      if (refreshResponse.success && refreshResponse.data) {
        this.updateTokens(refreshResponse.data.token);
        console.log("✅ [SecurityService] Token refrescado automáticamente");

        // El nuevo timer de refresh ya se programa en updateTokens
      } else {
        throw new Error("Refresh token response was not successful");
      }
    } catch (error) {
      console.error("❌ [SecurityService] Error refrescando token:", error);
      this.clearSession();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    }
  }

  /**
   * Cifrado simple (en producción usar crypto-js o similar)
   */
  private encrypt(text: string): string {
    // Implementación básica - en producción usar AES
    return btoa(encodeURIComponent(text));
  }

  /**
   * Descifrado simple
   */
  private decrypt(encryptedText: string): string {
    // Implementación básica - en producción usar AES
    return decodeURIComponent(atob(encryptedText));
  }

  /**
   * Configurar callbacks
   */
  public onSessionExpire(callback: () => void): void {
    // Callback registrado (log eliminado para evitar spam)
    this.onSessionExpired = callback;
  }

  public onTokenRefresh(callback: (newToken: string) => void): void {
    this.onTokenRefreshed = callback;
  }

  /**
   * Verificar si hay una sesión activa y válida
   */
  public hasValidSession(): boolean {
    return this.getValidTokens() !== null;
  }

  /**
   * Obtener información de la sesión actual
   */
  public getSessionInfo(): {
    sessionId: string;
    fingerprint: string;
    lastActivity: Date;
  } | null {
    const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
    if (!encryptedData) return null;

    try {
      const secureData: SecureTokenData = JSON.parse(
        this.decrypt(encryptedData),
      );
      return {
        sessionId: secureData.sessionId,
        fingerprint: secureData.fingerprint,
        lastActivity: new Date(secureData.lastActivity),
      };
    } catch {
      return null;
    }
  }

  /**
   * Métodos de debug - Solo para desarrollo
   */
  public getDebugInfo(): {
    isSessionValid: boolean;
    hasValidTokens: boolean;
    fingerprint: string;
    lastActivity: number;
    sessionStartTime: number;
    inactivityTimeRemaining: number;
    tokensCount: number;
    encryptedTokensPreview: string;
  } | null {
    const sessionInfo = this.getSessionInfo();
    const tokens = this.getValidTokens();
    const encryptedData =
      sessionStorage.getItem(SecurityService.SESSION_KEY) || "";
    const lastActivityTime = parseInt(
      sessionStorage.getItem(SecurityService.ACTIVITY_KEY) || "0",
    );

    if (!sessionInfo) {
      return {
        isSessionValid: false,
        hasValidTokens: false,
        fingerprint: "N/A",
        lastActivity: 0,
        sessionStartTime: 0,
        inactivityTimeRemaining: 0,
        tokensCount: 0,
        encryptedTokensPreview: "No data",
      };
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivityTime;
    const timeRemaining = Math.max(
      0,
      SecurityService.INACTIVITY_TIMEOUT - timeSinceActivity,
    );

    return {
      isSessionValid: !!tokens,
      hasValidTokens: !!tokens?.token,
      fingerprint: sessionInfo.fingerprint,
      lastActivity: lastActivityTime,
      sessionStartTime: sessionInfo.lastActivity.getTime(),
      inactivityTimeRemaining: timeRemaining,
      tokensCount: tokens ? Object.keys(tokens).length : 0,
      encryptedTokensPreview:
        encryptedData.length > 50
          ? encryptedData.substring(0, 50) + "..."
          : encryptedData,
    };
  }

  public async generateDeviceFingerprint(): Promise<string> {
    return this.generateFingerprint().hash;
  }

  /**
   * Obtiene el tiempo restante hasta el timeout de inactividad
   */
  public getTimeUntilInactivityTimeout(): number {
    const sessionData = this.getValidTokens();
    if (!sessionData || !this.inactivityTimer || this.timerStartTime === 0) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - this.timerStartTime;
    const timeRemaining = Math.max(
      0,
      SecurityService.INACTIVITY_TIMEOUT - elapsed,
    );

    // DEBUG: Log eliminado para evitar spam

    return timeRemaining;
  }

  /**
   * Extiende la sesión actual actualizando la marca de tiempo de actividad
   */
  public extendSession(): boolean {
    const tokens = this.getValidTokens();
    if (!tokens) {
      return false;
    }

    this.updateLastActivity();
    this.resetInactivityTimer();
    return true;
  }

  /**
   * Notifica actividad del usuario desde componentes externos que no propagan eventos DOM.
   * Útil para editores de texto enriquecido (BlockNote, etc.) que capturan eventos internamente.
   * Solo registra actividad si no hay warning activo.
   */
  public notifyActivity(): void {
    // Solo procesar si hay una sesión válida
    const tokens = this.getValidTokens();
    if (!tokens) {
      return;
    }

    // No resetear si el warning ya está activo (igual que en activityHandler)
    if (this.isWarningShown) {
      return;
    }

    // Actualizar actividad y resetear timer
    this.updateLastActivity();
    this.resetInactivityTimer();
  }
}

export const securityService = new SecurityService();
