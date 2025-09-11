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

const API_BASE_URL = config.api.baseUrl;

class AuthService {
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
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expirado, intentar renovar
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshResponse = await this.refreshToken(refreshToken);
          if (refreshResponse.success && refreshResponse.data) {
            localStorage.setItem("token", refreshResponse.data.token);
            // Reintentar la petición original
            return this.authenticatedRequest(url, options);
          }
        } catch (error) {
          // Error al renovar token, limpiar localStorage y redirigir a login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          throw new Error("Session expired");
        }
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const authService = new AuthService();
