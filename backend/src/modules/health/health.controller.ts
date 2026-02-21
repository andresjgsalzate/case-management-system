import { Request, Response } from "express";

export class HealthController {
  // Endpoint para verificar el estado del servidor
  async getHealth(req: Request, res: Response) {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      res.json({
        success: true,
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        },
        environment: process.env.NODE_ENV || "development",
        version: "1.1.0",
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
