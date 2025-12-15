// Configuración de la aplicación frontend

// Función para obtener la URL base de la API
const getApiBaseUrl = (): string => {
  // En desarrollo, usar variable de entorno o proxy de Vite
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || "/api";
  }

  // En producción, usar variable de entorno o construir dinámicamente
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback: construir URL basada en el origen actual
  const origin = window.location.origin;
  return `${origin}/api`;
};

// Función para obtener la URL del backend
const getBackendUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Fallback: usar el origen actual
  return window.location.origin;
};

export const config = {
  api: {
    baseUrl: getApiBaseUrl(),
    backendUrl: getBackendUrl(),
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || "Case Management System",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    nodeEnv: import.meta.env.VITE_NODE_ENV || "development",
  },
} as const;

export default config;
