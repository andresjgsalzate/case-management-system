import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { config } from "./config/environment";

const app = express();

// Configuración simplificada de base de datos sin entidades
const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: true,
  entities: [],
});

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// Test database connection endpoint
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await AppDataSource.query("SELECT NOW() as current_time");
    res.json({
      status: "Database connected",
      result: result[0],
    });
  } catch (error) {
    res.status(500).json({
      status: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully");

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.env}`);
      console.log(
        `🏥 Health check: http://localhost:${config.port}/api/health`
      );
      console.log(
        `🗄️  Database test: http://localhost:${config.port}/api/db-test`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
