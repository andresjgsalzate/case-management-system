import { config } from "../config/config";

/**
 * Servicio centralizado para realizar llamadas a la API
 * Utiliza la configuración centralizada para las URLs
 */
class ApiService {
  private baseUrl: string;
  private backendUrl: string;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.backendUrl = config.api.backendUrl;
  }

  /**
   * Obtiene la URL completa de la API
   */
  getApiUrl(endpoint: string = ""): string {
    // Asegurar que el endpoint comience con '/'
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Obtiene la URL del backend (sin /api)
   */
  getBackendUrl(path: string = ""): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.backendUrl}${cleanPath}`;
  }

  /**
   * Realizar petición GET
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Realizar petición POST
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Realizar petición PUT
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Realizar petición DELETE
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Realizar petición con autenticación
   */
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    // Obtener token del localStorage si no se proporciona
    const authToken = token || localStorage.getItem("token");

    return this.get<T>(endpoint, {
      ...fetchOptions,
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...fetchOptions.headers,
      },
    });
  }
}

// Exportar una instancia singleton
export const apiService = new ApiService();
export default apiService;
