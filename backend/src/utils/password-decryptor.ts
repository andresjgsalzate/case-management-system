import * as crypto from "crypto";

/**
 * Utilidad para desencriptar contraseñas encriptadas con PBKDF2
 * Detecta automáticamente el formato y desencripta si es necesario
 */
export class PasswordDecryptor {
  /**
   * Desencripta una contraseña si está en formato pbkdf2, sino la devuelve tal como está
   * @param encryptedPassword - Contraseña que puede estar encriptada
   * @param originalPassword - Contraseña original para verificación
   * @returns La contraseña desencriptada o la original si no estaba encriptada
   */
  static decryptPassword(
    encryptedPassword: string,
    originalPassword: string
  ): string {
    // Si no tiene el formato pbkdf2, devolverla tal como está
    if (!encryptedPassword.startsWith("pbkdf2:")) {
      return encryptedPassword;
    }

    try {
      // Parsear el formato: pbkdf2:digest:iterations:salt:hash
      const parts = encryptedPassword.split(":");

      if (parts.length !== 5) {
        throw new Error("Formato de contraseña encriptada inválido");
      }

      const [, digest, iterations, salt, hash] = parts;

      // Validar que todos los parámetros estén presentes
      if (!digest || !iterations || !salt || !hash) {
        throw new Error("Parámetros de encriptación inválidos");
      }

      // Para verificación, encriptar la contraseña original con los mismos parámetros
      const verificationHash = crypto
        .pbkdf2Sync(
          originalPassword,
          salt,
          parseInt(iterations),
          64,
          digest as crypto.BinaryToTextEncoding
        )
        .toString("hex");

      // Verificar que coincida
      if (verificationHash === hash) {
        // La contraseña original es correcta
        return originalPassword;
      } else {
        throw new Error(
          "La contraseña original no coincide con el hash encriptado"
        );
      }
    } catch (error) {
      console.error("❌ Error desencriptando contraseña:", error);
      // En caso de error, devolver la contraseña tal como está
      return encryptedPassword;
    }
  }

  /**
   * Verifica si una contraseña está encriptada
   */
  static isEncrypted(password: string): boolean {
    return password.startsWith("pbkdf2:") || password.startsWith("aes256:");
  }

  /**
   * Método que maneja la contraseña de base de datos de forma segura
   * - Si está encriptada: desencripta usando AES reversible
   * - Si no está encriptada: la devuelve tal como está
   */
  static getDecryptedDbPassword(): string {
    const password = process.env.DB_PASSWORD || "";
    // Para desarrollo, usar variable específica si no estamos en production
    const devPassword = process.env.DB_PASSWORD_DEV;
    if (devPassword && process.env.NODE_ENV !== "production") {
      console.log("🔧 Usando contraseña de desarrollo");
      return devPassword;
    }

    // Si la contraseña no está encriptada, devolverla tal como está (puede ser la contraseña real)
    if (!this.isEncrypted(password)) {
      // Si en producción se configuró DB_SYSTEM_PASSWORD explícitamente, úsala
      const systemPassword = process.env.DB_SYSTEM_PASSWORD;
      if (systemPassword) {
        console.log("🔒 Usando contraseña del sistema (no encriptada)");
        return systemPassword;
      }
      return password;
    }

    // Si es formato AES, intentar desencriptar usando la clave maestra
    if (password.startsWith("aes256:")) {
      try {
        return this.decryptAES(password);
      } catch (err) {
        console.error("❌ Falló desencriptación AES:", err);
        // Si la desencriptación falla pero existe DB_SYSTEM_PASSWORD, usarla como fallback
        const systemPassword = process.env.DB_SYSTEM_PASSWORD;
        if (systemPassword) {
          console.log("� Usando contraseña del sistema como fallback");
          return systemPassword;
        }
        throw err;
      }
    }

    // Formato legacy (pbkdf2) o no reconocido: intentar usar DB_SYSTEM_PASSWORD
    const systemPassword = process.env.DB_SYSTEM_PASSWORD;
    if (systemPassword) {
      console.log("🔒 Usando contraseña del sistema (legacy)");
      return systemPassword;
    }

    // Si no hay nada que hacer, devolver el valor original (posiblemente encriptado)
    return password;
  }

  /**
   * Desencripta contraseña usando AES-256-GCM (reversible y seguro)
   * NOTA: Esta función invierte EXACTAMENTE el proceso de encrypt-db-password-auto.js
   */
  private static decryptAES(encryptedPassword: string): string {
    try {
      // Parsear el formato: aes256:salt:iv:authTag:encrypted
      const parts = encryptedPassword.split(":");

      if (parts.length !== 5 || parts[0] !== "aes256") {
        throw new Error(
          "Formato AES inválido - debe ser aes256:salt:iv:authTag:encrypted"
        );
      }

      const [, salt, ivHex, authTagHex, encryptedHex] = parts;

      if (!salt || !ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Parámetros de encriptación AES incompletos");
      }

      // PASO 1: Usar la misma clave maestra que utilizó el script de encriptación
      // Esto permite desencriptar sin necesidad de conocer la contraseña original
      const masterKey =
        process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET;
      if (!masterKey) {
        throw new Error(
          "ENCRYPTION_MASTER_KEY o JWT_SECRET requerida para desencriptar"
        );
      }

      // PASO 2: Recrear exactamente la misma clave que se usó para encriptar
      const key = crypto.scryptSync(
        masterKey + "case-management-key",
        salt,
        32
      );

      // PASO 3: Desencriptar usando createDecipheriv y setAuthTag
      const algorithm = "aes-256-gcm";
      const iv = Buffer.from(ivHex as string, "hex");
      const authTag = Buffer.from(authTagHex as string, "hex");

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      console.log("✅ Contraseña desencriptada exitosamente con AES-256-GCM");
      return decrypted;
    } catch (error) {
      console.error("❌ Error desencriptando contraseña AES:", error);
      console.error("Detalles:", {
        format: encryptedPassword.substring(0, 20) + "...",
        parts: encryptedPassword.split(":").length,
      });

      // Si falla la desencriptación, puede ser que necesitemos la contraseña del sistema
      console.error("");
      console.error("💡 SUGERENCIA: Asegúrate de tener configurado:");
      console.error("   export DB_SYSTEM_PASSWORD='tu-contraseña-original'");
      console.error("   o");
      console.error("   DB_PASSWORD_DEV=tu-contraseña-original (en .env)");

      throw new Error(`Failed to decrypt AES password: ${error}`);
    }
  }

  /**
   * Deriva una contraseña usando la clave maestra y el salt
   */
  private static derivePasswordFromMasterKey(
    masterKey: string,
    salt: string
  ): string {
    // Usar PBKDF2 para derivar la contraseña de la clave maestra
    const derived = crypto.pbkdf2Sync(masterKey, salt, 10000, 32, "sha256");

    // Convertir a formato de contraseña legible
    const password = derived.toString("base64").substring(0, 12);
    return `.${password}.Admin`;
  }
}
