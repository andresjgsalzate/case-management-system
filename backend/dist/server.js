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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const case_routes_1 = __importDefault(require("./modules/cases/case.routes"));
const case_control_1 = __importDefault(require("./modules/case-control"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const common_routes_1 = __importDefault(require("./modules/common/common.routes"));
const health_routes_1 = __importDefault(require("./modules/health/health.routes"));
const time_entries_routes_1 = __importDefault(require("./modules/time-entries/time-entries.routes"));
const manual_time_entries_routes_1 = __importDefault(require("./modules/manual-time-entries/manual-time-entries.routes"));
const disposition_routes_1 = __importDefault(require("./modules/dispositions/disposition.routes"));
const todo_routes_1 = __importDefault(require("./modules/todos/todo.routes"));
const notes_routes_1 = __importDefault(require("./modules/notes/notes.routes"));
const archive_routes_1 = __importDefault(require("./modules/archive/archive.routes"));
const permissions_routes_1 = __importDefault(require("./routes/permissions.routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const userRoutes_1 = require("./routes/userRoutes");
const roleRoutes_1 = require("./routes/roleRoutes");
const teamRoutes_1 = require("./routes/teamRoutes");
const metrics_routes_1 = __importDefault(require("./routes/metrics.routes"));
const knowledge_simple_routes_1 = __importDefault(require("./routes/knowledge-simple.routes"));
const originRoutes_1 = require("./routes/originRoutes");
const applicationRoutes_1 = require("./routes/applicationRoutes");
const caseStatusRoutes_1 = require("./routes/caseStatusRoutes");
const todoPriorityRoutes_1 = require("./routes/todoPriorityRoutes");
const file_upload_simple_routes_1 = __importDefault(require("./routes/file-upload-simple.routes"));
const systemInfo_1 = __importDefault(require("./routes/systemInfo"));
const file_upload_simple_service_1 = require("./services/file-upload-simple.service");
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const session_cleanup_job_1 = require("./jobs/session-cleanup.job");
const database_2 = require("./config/database");
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.config.rateLimit.windowMs,
    max: environment_1.config.rateLimit.maxRequests,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "development" &&
        req.url.includes("/api/files")) {
        console.log(`📁 [FILES] ${req.method} ${req.url}`);
    }
    next();
});
app.use((0, cors_1.default)({
    origin: environment_1.config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/health", health_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/users", userRoutes_1.userRoutes);
app.use("/api/roles", roleRoutes_1.roleRoutes);
app.use("/api/teams", teamRoutes_1.teamRoutes);
app.use("/api/cases", case_routes_1.default);
app.use("/api/case-control", case_control_1.default);
app.use("/api/time-entries", time_entries_routes_1.default);
app.use("/api/manual-time-entries", manual_time_entries_routes_1.default);
app.use("/api/dispositions", disposition_routes_1.default);
app.use("/api/todos", todo_routes_1.default);
app.use("/api/notes", notes_routes_1.default);
app.use("/api/archive", archive_routes_1.default);
app.use("/api/files", file_upload_simple_routes_1.default);
app.use("/api", knowledge_simple_routes_1.default);
app.use("/api/metrics", metrics_routes_1.default);
app.use("/api", common_routes_1.default);
app.use("/api/case-statuses", caseStatusRoutes_1.caseStatusRoutes);
app.use("/api/applications", applicationRoutes_1.applicationRoutes);
app.use("/api/origins", originRoutes_1.originRoutes);
app.use("/api/admin/todo-priorities", todoPriorityRoutes_1.todoPriorityRoutes);
app.use("/api/system", systemInfo_1.default);
app.use("/api", permissions_routes_1.default);
app.use("/api/audit", audit_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        path: req.originalUrl,
        method: req.method,
    });
});
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        let retries = 0;
        const maxRetries = 10;
        while (database_2.AppDataSource.entityMetadatas.length === 0 && retries < maxRetries) {
            console.log(`⏳ Esperando carga de entidades... intento ${retries + 1}/${maxRetries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries++;
        }
        if (database_2.AppDataSource.entityMetadatas.length === 0) {
            throw new Error("Las entidades no se cargaron correctamente después de varios intentos");
        }
        console.log(`✅ Entidades cargadas: ${database_2.AppDataSource.entityMetadatas
            .map((meta) => meta.name)
            .join(", ")}`);
        const { initializeAuthController } = await Promise.resolve().then(() => __importStar(require("./modules/auth/auth.routes")));
        initializeAuthController();
        logger_1.logger.info("🔐 Auth controller initialized");
        await file_upload_simple_service_1.FileUploadService.initialize();
        logger_1.logger.info("📁 Upload directories initialized successfully");
        let sessionCleanupJob = null;
        setTimeout(() => {
            sessionCleanupJob = new session_cleanup_job_1.SessionCleanupJob();
            sessionCleanupJob.start(30);
        }, 5000);
        process.on("SIGINT", () => {
            if (sessionCleanupJob) {
                sessionCleanupJob.stop();
            }
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            if (sessionCleanupJob) {
                sessionCleanupJob.stop();
            }
            process.exit(0);
        });
        app.listen(environment_1.config.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${environment_1.config.port}`);
            logger_1.logger.info(`📝 Environment: ${environment_1.config.env}`);
            logger_1.logger.info(`🏥 Health check: http://127.0.0.1:${environment_1.config.port}/api/health`);
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start server:", error);
        process.exit(1);
    }
};
process.on("SIGTERM", () => {
    logger_1.logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_1.logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
process.on("unhandledRejection", (reason, promise) => {
    logger_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    logger_1.logger.error("Uncaught Exception thrown:", error);
    process.exit(1);
});
startServer();
