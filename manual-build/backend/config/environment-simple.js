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
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
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
            if (process.env.NODE_ENV === "production") {
                const prodPath = path.join(process.cwd(), ".env.production");
                dotenv.config({ path: prodPath });
                console.log("✅ Configuración de producción cargada (.env.production)");
            }
            else {
                dotenv.config();
                console.log("✅ Configuración de desarrollo cargada (.env)");
            }
            this.loaded = true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("❌ Error cargando variables de entorno:", message);
            throw new Error(`Failed to load environment: ${message}`);
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
