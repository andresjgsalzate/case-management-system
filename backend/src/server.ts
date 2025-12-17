import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/environment";
import { initializeDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { AuditMiddleware } from "./middleware/auditMiddleware";

// Importar rutas cuando las creemos
// import authRoutes from "./modules/auth/auth.routes";
// import userRoutes from './modules/users/user.routes';
import caseRoutes from "./modules/cases/case.routes";
import caseControlRoutes from "./modules/case-control";
import authRoutes from "./modules/auth/auth.routes";
import commonRoutes from "./modules/common/common.routes";
import healthRoutes from "./modules/health/health.routes";
import timeEntriesRoutes from "./modules/time-entries/time-entries.routes";
import manualTimeEntriesRoutes from "./modules/manual-time-entries/manual-time-entries.routes";
import dispositionRoutes from "./modules/dispositions/disposition.routes";
import todoRoutes from "./modules/todos/todo.routes";
import noteRoutes from "./modules/notes/notes.routes";
import archiveRoutes from "./modules/archive/archive.routes";
import permissionsRoutes from "./routes/permissions.routes";
import testRoutes from "./routes/test.routes";
import authPermissionRoutes from "./routes/auth";
import { userRoutes } from "./routes/userRoutes";
import { roleRoutes } from "./routes/roleRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import metricsRoutes from "./routes/metrics.routes";
import knowledgeRoutes from "./routes/knowledge-simple.routes";
import knowledgeTagRoutes from "./routes/knowledge.routes";
import debugRoutes from "./routes/debug";
import migrationRoutes from "./routes/migration.routes";
import { originRoutes } from "./routes/originRoutes";
import { applicationRoutes } from "./routes/applicationRoutes";
import { caseStatusRoutes } from "./routes/caseStatusRoutes";
import { todoPriorityRoutes } from "./routes/todoPriorityRoutes";
import fileUploadRoutes from "./routes/file-upload-simple.routes";
import adminStorageRoutes from "./routes/admin-storage.routes";
import systemInfoRoutes from "./routes/systemInfo";
import { FileUploadService } from "./services/file-upload-simple.service";
import auditRoutes from "./routes/audit.routes";
import { SessionCleanupJob } from "./jobs/session-cleanup.job";

import { AppDataSource } from "./config/database";

const app = express();

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de seguridad
app.use(helmet());
// app.use(limiter); // Desactivado temporalmente para desarrollo

// Log minimal para requests de archivos (solo en desarrollo)
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "development" &&
    req.url.includes("/api/files")
  ) {
    console.log(`📁 [FILES] ${req.method} ${req.url}`);
  }
  next();
});

// Configuración de CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middlewares para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", authPermissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/case-control", caseControlRoutes);
app.use("/api/time-entries", timeEntriesRoutes);
app.use("/api/manual-time-entries", manualTimeEntriesRoutes);
app.use("/api/dispositions", dispositionRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/files", fileUploadRoutes); // MOVER ANTES de knowledgeRoutes
// app.use("/api", knowledgeTagRoutes); // Rutas de etiquetas movidas a knowledge-simple.routes.ts
app.use("/api", knowledgeRoutes); // Rutas de base de conocimiento
app.use("/api/metrics", metricsRoutes);
app.use("/api", commonRoutes);

// Rutas administrativas
app.use("/api/case-statuses", caseStatusRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/origins", originRoutes);
app.use("/api/admin/todo-priorities", todoPriorityRoutes);
app.use("/api/system", systemInfoRoutes);
app.use("/api", permissionsRoutes);
app.use("/api/audit", auditRoutes); // Rutas del sistema de auditoría

// Error handling middleware (debe ir al final)
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos
    await initializeDatabase();

    // Esperar a que las entidades estén completamente cargadas
    let retries = 0;
    const maxRetries = 10;
    while (AppDataSource.entityMetadatas.length === 0 && retries < maxRetries) {
      console.log(
        `⏳ Esperando carga de entidades... intento ${
          retries + 1
        }/${maxRetries}`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }

    if (AppDataSource.entityMetadatas.length === 0) {
      throw new Error(
        "Las entidades no se cargaron correctamente después de varios intentos"
      );
    }

    console.log(
      `✅ Entidades cargadas: ${AppDataSource.entityMetadatas
        .map((meta) => meta.name)
        .join(", ")}`
    );

    // Inicializar controlador de autenticación después de que la DB esté lista
    const { initializeAuthController } = await import(
      "./modules/auth/auth.routes"
    );
    initializeAuthController();
    logger.info("🔐 Auth controller initialized");

    // Inicializar rutas de equipos después de que la DB esté lista

    // Inicializar directorios de uploads de forma automática
    await FileUploadService.initialize();
    logger.info("📁 Upload directories initialized successfully");

    // Inicializar job de limpieza de sesiones después de un pequeño delay
    // para asegurar que todas las entidades estén cargadas
    let sessionCleanupJob: SessionCleanupJob | null = null;

    setTimeout(() => {
      sessionCleanupJob = new SessionCleanupJob();
      sessionCleanupJob.start(30); // Limpieza cada 30 minutos
    }, 5000); // 5 segundos de delay

    // Manejar shutdown graceful del job
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

    // Iniciar servidor
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(
        `🏥 Health check: http://127.0.0.1:${config.port}/api/health`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Manejo de shutdown graceful
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception thrown:", error);
  process.exit(1);
});

startServer();
