"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const environment_simple_1 = require("./environment-simple");
const password_decryptor_1 = require("../utils/password-decryptor");
const envService = environment_simple_1.EnvironmentService.getInstance();
envService.loadEnvironment();
envService.validateRequiredVariables();
exports.config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    database: {
        host: process.env.DB_HOST || "127.0.0.1",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: password_decryptor_1.PasswordDecryptor.getDecryptedDbPassword() || "password",
        database: process.env.DB_DATABASE || "case_management",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "fallback-secret-key",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    cors: {
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
            : ["http://127.0.0.1:5173"],
    },
    upload: {
        path: process.env.UPLOAD_PATH || "./uploads",
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
    },
    email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM,
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    },
    log: {
        level: process.env.LOG_LEVEL || "info",
    },
};
