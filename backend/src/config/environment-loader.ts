import * as crypto from "crypto-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

/**
 * Servicio para cargar variables de entorno de forma segura
 * Soporta archivos encriptados y variables de sistema
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
   * Carga las variables de entorno usando la estrategia más apropiada
   */
  loadEnvironment(): void {
    if (this.loaded) return;

    console.log("🔧 Cargando configuración de entorno...");

    try {
      // Estrategia 1: Usar variables de sistema si están disponibles (producción)
      if (this.hasSystemVariables()) {
        console.log("✅ Usando variables de entorno del sistema");
        this.loaded = true;
        return;
      }

      // Estrategia 2: Cargar archivo .env si existe (desarrollo con archivos desencriptados)
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        console.log("✅ Cargando desde .env");
        dotenv.config({ path: envPath });
        this.loaded = true;
        return;
      }

      // Estrategia 3: Desencriptar archivo .env.encrypted
      const encryptedPath = path.join(process.cwd(), ".env.encrypted");
      if (fs.existsSync(encryptedPath)) {
        console.log("🔓 Desencriptando variables de entorno...");
        this.loadEncryptedEnvironment(encryptedPath);
        this.loaded = true;
        return;
      }

      // Estrategia 4: Cargar archivos separados (.env.public + .env.secrets)
      this.loadSeparatedFiles();
      this.loaded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Error cargando variables de entorno:", message);
      throw new Error(`Failed to load environment: ${message}`);
    }
  }

  /**
   * Verifica si las variables críticas están disponibles en el sistema
   */
  private hasSystemVariables(): boolean {
    const criticalVars = ["DB_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET"];
    return criticalVars.every((varName) => process.env[varName]);
  }

  /**
   * Desencripta y carga variables desde archivo .env.encrypted
   */
  private loadEncryptedEnvironment(encryptedPath: string): void {
    // Obtener clave de encriptación
    const encryptionKey =
      process.env.ENV_ENCRYPTION_KEY || this.getEncryptionKeyFromSecrets();

    if (!encryptionKey) {
      throw new Error(
        "ENV_ENCRYPTION_KEY no encontrada. Necesaria para desencriptar variables."
      );
    }

    // Leer archivo encriptado
    const fileContent = fs.readFileSync(encryptedPath, "utf8");
    const lines = fileContent.split("\n");
    const encryptedContent = lines.find(
      (line) => !line.startsWith("#") && line.trim().length > 0
    );

    if (!encryptedContent) {
      throw new Error("No se encontró contenido encriptado válido");
    }

    // Desencriptar
    const decrypted = crypto.AES.decrypt(
      encryptedContent,
      encryptionKey
    ).toString(crypto.enc.Utf8);

    if (!decrypted) {
      throw new Error("No se pudo desencriptar variables (clave incorrecta?)");
    }

    // Parsear y cargar variables
    this.parseAndLoadVariables(decrypted);
    console.log("✅ Variables de entorno desencriptadas y cargadas");
  }

  /**
   * Obtiene la clave de encriptación desde .env.secrets
   */
  private getEncryptionKeyFromSecrets(): string | null {
    const secretsPath = path.join(process.cwd(), ".env.secrets");

    if (!fs.existsSync(secretsPath)) {
      return null;
    }

    const content = fs.readFileSync(secretsPath, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.startsWith("ENV_ENCRYPTION_KEY=")) {
        const parts = line.split("=");
        return parts.length > 1 && parts[1] ? parts[1] : null;
      }
    }

    return null;
  }

  /**
   * Carga archivos separados .env.public y .env.secrets
   */
  private loadSeparatedFiles(): void {
    const publicPath = path.join(process.cwd(), ".env.public");
    const secretsPath = path.join(process.cwd(), ".env.secrets");

    // Cargar archivo público
    if (fs.existsSync(publicPath)) {
      dotenv.config({ path: publicPath });
      console.log("✅ Variables públicas cargadas desde .env.public");
    }

    // Cargar archivo de secretos
    if (fs.existsSync(secretsPath)) {
      dotenv.config({ path: secretsPath });
      console.log("✅ Variables secretas cargadas desde .env.secrets");
    }
  }

  /**
   * Parsea contenido de variables y las carga en process.env
   */
  private parseAndLoadVariables(content: string): void {
    const lines = content.split("\n");

    for (const line of lines) {
      // Ignorar comentarios y líneas vacías
      if (line.trim().startsWith("#") || !line.trim()) {
        continue;
      }

      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        process.env[key.trim()] = value;
      }
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
