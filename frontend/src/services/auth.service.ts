interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Importar configuración centralizada
import { config } from "../config/config";
import { securityService } from "./security.service";

const API_BASE_URL = config.api.baseUrl;

class AuthService {
  constructor() {
    // Configurar callbacks del SecurityService
    securityService.onSessionExpire(() => {
      this.handleSessionExpired();
    });

    securityService.onTokenRefresh((_newToken: string) => {
      // Token actualizado automáticamente por SecurityService
      console.log("Token actualizado automáticamente");
    });
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  }

  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<{ token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.authenticatedRequest<User>("/auth/me");
  }

  // Método auxiliar para hacer peticiones autenticadas
  async authenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const tokens = securityService.getValidTokens();

    if (!tokens) {
      throw new Error("No valid session");
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expirado, intentar renovar
      try {
        const refreshResponse = await this.refreshToken(tokens.refreshToken);
        if (refreshResponse.success && refreshResponse.data) {
          securityService.updateTokens(refreshResponse.data.token);
          // Reintentar la petición original
          return this.authenticatedRequest(url, options);
        }
      } catch (error) {
        // Error al renovar token, limpiar sesión
        this.handleSessionExpired();
        throw new Error("Session expired");
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Maneja la expiración de sesión
   */
  private handleSessionExpired(): void {
    securityService.clearSession();

    // Limpiar también localStorage legacy si existe
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Redirigir al login
    window.location.href = "/auth/login";

    console.log("🚨 Sesión expirada - Redirigiendo al login");
  }

  /**
   * Obtiene el token actual de forma segura
   */
  public getCurrentToken(): string | null {
    const tokens = securityService.getValidTokens();
    return tokens?.token || null;
  }

  /**
   * Verifica si hay una sesión válida
   */
  public hasValidSession(): boolean {
    return securityService.hasValidSession();
  }

  /**
   * Cierra la sesión de forma segura
   */
  public logout(): void {
    securityService.clearSession();
    this.handleSessionExpired();
  }
}

export const authService = new AuthService();
