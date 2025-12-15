import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Servicio SIMPLIFICADO para cargar variables de entorno
 * Solo dos archivos: .env (desarrollo) y .env.production (producción)
 */
export class EnvironmentService {
  private static instance: EnvironmentService;
  private loaded = false;

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  /**
   * Carga las variables de entorno de forma simple
   */
  loadEnvironment(): void {
    if (this.loaded) return;

    console.log("🔧 Cargando configuración de entorno...");

    try {
      // Estrategia SIMPLE:
      if (process.env.NODE_ENV === "production") {
        // Producción: cargar .env.production
        const prodPath = path.join(process.cwd(), ".env.production");
        dotenv.config({ path: prodPath });
        console.log("✅ Configuración de producción cargada (.env.production)");
      } else {
        // Desarrollo: cargar .env
        dotenv.config();
        console.log("✅ Configuración de desarrollo cargada (.env)");
      }

      this.loaded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Error cargando variables de entorno:", message);
      throw new Error(`Failed to load environment: ${message}`);
    }
  }

  /**
   * Valida que todas las variables críticas estén disponibles
   */
  validateRequiredVariables(): void {
    const required = [
      "NODE_ENV",
      "PORT",
      "DB_HOST",
      "DB_PORT",
      "DB_USERNAME",
      "DB_PASSWORD",
      "DB_DATABASE",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
    ];

    const missing = required.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Variables de entorno requeridas no encontradas: ${missing.join(", ")}`
      );
    }

    console.log("✅ Todas las variables requeridas están disponibles");
  }
}
