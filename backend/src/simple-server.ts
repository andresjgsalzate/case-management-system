import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "./config/environment";
import { initializeDatabase } from "./config/database";

const app = express();

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

const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos
    await initializeDatabase();

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.env}`);
      console.log(
        `🏥 Health check: http://localhost:${config.port}/api/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
