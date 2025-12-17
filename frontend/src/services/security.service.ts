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
  private static readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  private static readonly TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private static readonly SESSION_KEY = "__secure_session__";
  private static readonly ACTIVITY_KEY = "__last_activity__";

  private inactivityTimer: number | null = null;
  private refreshTimer: number | null = null;
  private onSessionExpired?: () => void;
  private onTokenRefreshed?: (newToken: string) => void;

  constructor() {
    this.setupActivityMonitoring();
    this.setupTabSynchronization();
    this.validateExistingSession();
  }

  /**
   * Genera una huella digital estable del dispositivo/navegador
   * Versión mejorada que evita elementos volátiles
   */
  private generateFingerprint(): DeviceFingerprint {
    // Solo usar elementos estables que no cambien entre sesiones
    const stableElements = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
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
    const fingerprint = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
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
    expiresIn: number = 3600
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
      this.encrypt(JSON.stringify(secureData))
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

      console.log("🔍 [SecurityService] Debug getValidTokens:", {
        hasSessionData: !!encryptedData,
        sessionDataLength: encryptedData?.length,
      });

      if (!encryptedData) {
        console.log("🔍 [SecurityService] No session data found");
        return null;
      }

      const secureData: SecureTokenData = JSON.parse(
        this.decrypt(encryptedData)
      );

      const now = Date.now();
      const timeUntilExpiry = secureData.expiresAt - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));

      console.log("🔍 [SecurityService] Token expiry check:", {
        now,
        expiresAt: secureData.expiresAt,
        timeUntilExpiry,
        minutesUntilExpiry,
        isExpired: now > secureData.expiresAt,
      });

      // Verificar expiración
      if (now > secureData.expiresAt) {
        console.warn("🚨 Token expirado, limpiando sesión");
        this.clearSession();
        return null;
      }

      // Verificar huella digital
      const currentFingerprint = this.generateFingerprint().hash;
      const storedFingerprint = localStorage.getItem("__fp__");

      console.log("🔍 [SecurityService] Fingerprint check:", {
        hasStoredFingerprint: !!storedFingerprint,
        currentFingerprint,
        storedFingerprintMatch: storedFingerprint
          ? this.decrypt(storedFingerprint) === currentFingerprint
          : false,
        secureDataFingerprint: secureData.fingerprint,
        secureDataFingerprintMatch:
          secureData.fingerprint === currentFingerprint,
      });

      if (
        !storedFingerprint ||
        this.decrypt(storedFingerprint) !== currentFingerprint
      ) {
        console.warn(
          "🚨 Token comprometido: Huella digital no coincide en localStorage"
        );
        this.clearSession();
        return null;
      }

      if (secureData.fingerprint !== currentFingerprint) {
        console.warn("🚨 Token comprometido: Cambio de dispositivo detectado");
        this.clearSession();
        return null;
      }

      // Verificar inactividad
      const timeSinceActivity = now - secureData.lastActivity;

      if (timeSinceActivity > SecurityService.INACTIVITY_TIMEOUT) {
        console.warn("🚨 Sesión expirada por inactividad");
        this.clearSession();
        return null;
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
   */
  public updateTokens(newToken: string, newRefreshToken?: string): void {
    const current = this.getValidTokens();
    if (!current) return;

    const encryptedData = sessionStorage.getItem(SecurityService.SESSION_KEY);
    if (!encryptedData) return;

    const secureData: SecureTokenData = JSON.parse(this.decrypt(encryptedData));
    secureData.token = newToken;
    if (newRefreshToken) {
      secureData.refreshToken = newRefreshToken;
    }
    secureData.lastActivity = Date.now();

    sessionStorage.setItem(
      SecurityService.SESSION_KEY,
      this.encrypt(JSON.stringify(secureData))
    );

    if (this.onTokenRefreshed) {
      this.onTokenRefreshed(newToken);
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

    const activityHandler = () => {
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
          this.decrypt(encryptedData)
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
          this.decrypt(encryptedData)
        );
        secureData.lastActivity = now;
        sessionStorage.setItem(
          SecurityService.SESSION_KEY,
          this.encrypt(JSON.stringify(secureData))
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

    this.inactivityTimer = window.setTimeout(() => {
      console.warn("🚨 Sesión expirada por inactividad");
      this.clearSession();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    }, SecurityService.INACTIVITY_TIMEOUT);
  }

  /**
   * Reinicia el timer de inactividad
   */
  private resetInactivityTimer(): void {
    this.startInactivityTimer();
  }

  /**
   * Detiene el timer de inactividad
   */
  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      window.clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Inicia el timer de refresh de tokens
   */
  private startRefreshTimer(expiresInSeconds: number): void {
    this.stopRefreshTimer();

    // Programar refresh 5 minutos antes de que expire
    const refreshIn = Math.max(
      1000,
      expiresInSeconds * 1000 - SecurityService.TOKEN_REFRESH_INTERVAL
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
   */
  private async attemptTokenRefresh(): Promise<void> {
    const tokens = this.getValidTokens();
    if (!tokens) return;

    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { authService } = await import("./auth.service");

      const refreshResponse = await authService.refreshToken(
        tokens.refreshToken
      );

      if (refreshResponse.success && refreshResponse.data) {
        this.updateTokens(refreshResponse.data.token);

        // Programar el siguiente refresh
        this.startRefreshTimer(3600); // 1 hora por defecto
      } else {
        throw new Error("Refresh token response was not successful");
      }
    } catch (error) {
      console.error("❌ Error refrescando token:", error);
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
        this.decrypt(encryptedData)
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
      sessionStorage.getItem(SecurityService.ACTIVITY_KEY) || "0"
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
      SecurityService.INACTIVITY_TIMEOUT - timeSinceActivity
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
}

export const securityService = new SecurityService();
