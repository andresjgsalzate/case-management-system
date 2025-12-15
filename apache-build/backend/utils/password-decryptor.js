"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordDecryptor = void 0;
const crypto = __importStar(require("crypto"));
class PasswordDecryptor {
    static decryptPassword(encryptedPassword, originalPassword) {
        if (!encryptedPassword.startsWith("pbkdf2:")) {
            return encryptedPassword;
        }
        try {
            const parts = encryptedPassword.split(":");
            if (parts.length !== 5) {
                throw new Error("Formato de contraseña encriptada inválido");
            }
            const [, digest, iterations, salt, hash] = parts;
            if (!digest || !iterations || !salt || !hash) {
                throw new Error("Parámetros de encriptación inválidos");
            }
            const verificationHash = crypto
                .pbkdf2Sync(originalPassword, salt, parseInt(iterations), 64, digest)
                .toString("hex");
            if (verificationHash === hash) {
                return originalPassword;
            }
            else {
                throw new Error("La contraseña original no coincide con el hash encriptado");
            }
        }
        catch (error) {
            console.error("❌ Error desencriptando contraseña:", error);
            return encryptedPassword;
        }
    }
    static isEncrypted(password) {
        return password.startsWith("pbkdf2:") || password.startsWith("aes256:");
    }
    static getDecryptedDbPassword() {
        const password = process.env.DB_PASSWORD || "";
        const devPassword = process.env.DB_PASSWORD_DEV;
        if (devPassword && process.env.NODE_ENV !== "production") {
            console.log("🔧 Usando contraseña de desarrollo");
            return devPassword;
        }
        if (!this.isEncrypted(password)) {
            const systemPassword = process.env.DB_SYSTEM_PASSWORD;
            if (systemPassword) {
                console.log("🔒 Usando contraseña del sistema (no encriptada)");
                return systemPassword;
            }
            return password;
        }
        if (password.startsWith("aes256:")) {
            try {
                return this.decryptAES(password);
            }
            catch (err) {
                console.error("❌ Falló desencriptación AES:", err);
                const systemPassword = process.env.DB_SYSTEM_PASSWORD;
                if (systemPassword) {
                    console.log("� Usando contraseña del sistema como fallback");
                    return systemPassword;
                }
                throw err;
            }
        }
        const systemPassword = process.env.DB_SYSTEM_PASSWORD;
        if (systemPassword) {
            console.log("🔒 Usando contraseña del sistema (legacy)");
            return systemPassword;
        }
        return password;
    }
    static decryptAES(encryptedPassword) {
        try {
            const parts = encryptedPassword.split(":");
            if (parts.length !== 5 || parts[0] !== "aes256") {
                throw new Error("Formato AES inválido - debe ser aes256:salt:iv:authTag:encrypted");
            }
            const [, salt, ivHex, authTagHex, encryptedHex] = parts;
            if (!salt || !ivHex || !authTagHex || !encryptedHex) {
                throw new Error("Parámetros de encriptación AES incompletos");
            }
            const masterKey = process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET;
            if (!masterKey) {
                throw new Error("ENCRYPTION_MASTER_KEY o JWT_SECRET requerida para desencriptar");
            }
            const key = crypto.scryptSync(masterKey + "case-management-key", salt, 32);
            const algorithm = "aes-256-gcm";
            const iv = Buffer.from(ivHex, "hex");
            const authTag = Buffer.from(authTagHex, "hex");
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encryptedHex, "hex", "utf8");
            decrypted += decipher.final("utf8");
            console.log("✅ Contraseña desencriptada exitosamente con AES-256-GCM");
            return decrypted;
        }
        catch (error) {
            console.error("❌ Error desencriptando contraseña AES:", error);
            console.error("Detalles:", {
                format: encryptedPassword.substring(0, 20) + "...",
                parts: encryptedPassword.split(":").length,
            });
            console.error("");
            console.error("💡 SUGERENCIA: Asegúrate de tener configurado:");
            console.error("   export DB_SYSTEM_PASSWORD='tu-contraseña-original'");
            console.error("   o");
            console.error("   DB_PASSWORD_DEV=tu-contraseña-original (en .env)");
            throw new Error(`Failed to decrypt AES password: ${error}`);
        }
    }
    static derivePasswordFromMasterKey(masterKey, salt) {
        const derived = crypto.pbkdf2Sync(masterKey, salt, 10000, 32, "sha256");
        const password = derived.toString("base64").substring(0, 12);
        return `.${password}.Admin`;
    }
}
exports.PasswordDecryptor = PasswordDecryptor;
