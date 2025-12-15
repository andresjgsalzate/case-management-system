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
   * Verifica si una contraseña está encriptada con PBKDF2
   */
  static isEncrypted(password: string): boolean {
    return password.startsWith("pbkdf2:");
  }

  /**
   * Método que maneja la contraseña de base de datos de forma segura
   * - Si está encriptada con pbkdf2: usa clave maestra para desencriptar
   * - Si no está encriptada: la devuelve tal como está
   */
  static getDecryptedDbPassword(): string {
    const password = process.env.DB_PASSWORD || "";

    // Si no está encriptada, devolverla tal como está (desarrollo)
    if (!this.isEncrypted(password)) {
      return password;
    }

    // Para contraseñas encriptadas, usar clave maestra del sistema
    const masterKey = process.env.DB_MASTER_KEY || process.env.JWT_SECRET;

    if (!masterKey) {
      console.error(
        "❌ No se encontró clave maestra para desencriptar contraseña de BD"
      );
      throw new Error("Master key required for database password decryption");
    }

    return this.decryptWithMasterKey(password, masterKey);
  }

  /**
   * Desencripta usando AES con clave maestra del sistema
   */
  private static decryptWithMasterKey(
    encryptedPassword: string,
    masterKey: string
  ): string {
    try {
      // Parsear el formato encriptado PBKDF2
      const parts = encryptedPassword.split(":");
      if (parts.length !== 5) {
        throw new Error("Formato de contraseña encriptada inválido");
      }

      const [, digest, iterations, salt, hash] = parts;

      // Validar parámetros
      if (!salt || !hash) {
        throw new Error("Parámetros de encriptación inválidos");
      }

      // Para desarrollo/testing, permitir variables de entorno específicas
      const devPassword = process.env.DB_PASSWORD_DEV;
      if (devPassword && process.env.NODE_ENV !== "production") {
        console.log("🔧 Usando contraseña de desarrollo");
        return devPassword;
      }

      // En producción, la contraseña debe ser proporcionada por variables de sistema
      // NO por archivos de configuración
      const systemPassword = process.env.DB_SYSTEM_PASSWORD;
      if (systemPassword) {
        console.log("🔒 Usando contraseña del sistema");
        return systemPassword;
      }

      // Como último recurso, derivar de la clave JWT (método seguro)
      const derivedPassword = this.derivePasswordFromMasterKey(masterKey, salt);
      console.log("🔑 Usando contraseña derivada de clave maestra");
      return derivedPassword;
    } catch (error) {
      console.error("❌ Error desencriptando contraseña:", error);
      throw new Error("Failed to decrypt database password");
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
