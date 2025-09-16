// Configuración de la aplicación frontend

export const config = {
  api: {
    baseUrl: "http://localhost:3000/api", // TODO: Hacer configurable con variables de entorno
  },
  app: {
    name: "Case Management System",
    version: "1.1.0",
  },
} as const;

export default config;
