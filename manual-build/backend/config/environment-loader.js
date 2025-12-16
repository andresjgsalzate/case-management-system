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
exports.EnvironmentService = void 0;
const crypto = __importStar(require("crypto-js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
class EnvironmentService {
    constructor() {
        this.loaded = false;
    }
    static getInstance() {
        if (!EnvironmentService.instance) {
            EnvironmentService.instance = new EnvironmentService();
        }
        return EnvironmentService.instance;
    }
    loadEnvironment() {
        if (this.loaded)
            return;
        console.log("🔧 Cargando configuración de entorno...");
        try {
            if (this.hasSystemVariables()) {
                console.log("✅ Usando variables de entorno del sistema");
                this.loaded = true;
                return;
            }
            const envPath = path.join(process.cwd(), ".env");
            if (fs.existsSync(envPath)) {
                console.log("✅ Cargando desde .env");
                dotenv.config({ path: envPath });
                this.loaded = true;
                return;
            }
            const encryptedPath = path.join(process.cwd(), ".env.encrypted");
            if (fs.existsSync(encryptedPath)) {
                console.log("🔓 Desencriptando variables de entorno...");
                this.loadEncryptedEnvironment(encryptedPath);
                this.loaded = true;
                return;
            }
            this.loadSeparatedFiles();
            this.loaded = true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("❌ Error cargando variables de entorno:", message);
            throw new Error(`Failed to load environment: ${message}`);
        }
    }
    hasSystemVariables() {
        const criticalVars = ["DB_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET"];
        return criticalVars.every((varName) => process.env[varName]);
    }
    loadEncryptedEnvironment(encryptedPath) {
        const encryptionKey = process.env.ENV_ENCRYPTION_KEY || this.getEncryptionKeyFromSecrets();
        if (!encryptionKey) {
            throw new Error("ENV_ENCRYPTION_KEY no encontrada. Necesaria para desencriptar variables.");
        }
        const fileContent = fs.readFileSync(encryptedPath, "utf8");
        const lines = fileContent.split("\n");
        const encryptedContent = lines.find((line) => !line.startsWith("#") && line.trim().length > 0);
        if (!encryptedContent) {
            throw new Error("No se encontró contenido encriptado válido");
        }
        const decrypted = crypto.AES.decrypt(encryptedContent, encryptionKey).toString(crypto.enc.Utf8);
        if (!decrypted) {
            throw new Error("No se pudo desencriptar variables (clave incorrecta?)");
        }
        this.parseAndLoadVariables(decrypted);
        console.log("✅ Variables de entorno desencriptadas y cargadas");
    }
    getEncryptionKeyFromSecrets() {
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
    loadSeparatedFiles() {
        const publicPath = path.join(process.cwd(), ".env.public");
        const secretsPath = path.join(process.cwd(), ".env.secrets");
        if (fs.existsSync(publicPath)) {
            dotenv.config({ path: publicPath });
            console.log("✅ Variables públicas cargadas desde .env.public");
        }
        if (fs.existsSync(secretsPath)) {
            dotenv.config({ path: secretsPath });
            console.log("✅ Variables secretas cargadas desde .env.secrets");
        }
    }
    parseAndLoadVariables(content) {
        const lines = content.split("\n");
        for (const line of lines) {
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
    validateRequiredVariables() {
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
            throw new Error(`Variables de entorno requeridas no encontradas: ${missing.join(", ")}`);
        }
        console.log("✅ Todas las variables requeridas están disponibles");
    }
}
exports.EnvironmentService = EnvironmentService;
