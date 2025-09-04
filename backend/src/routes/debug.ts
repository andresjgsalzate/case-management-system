import { Router } from "express";
import { AppDataSource } from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { DebugController } from "../controllers/DebugController";

const router = Router();

// Endpoint temporal para debug de case_control
router.get("/debug/case-control", authenticateToken, async (req, res) => {
  try {
    console.log("=== DEBUG CASE-CONTROL ===");

    // Consulta 1: Verificar estructura de la tabla
    const tableInfo = await AppDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'case_control' 
      ORDER BY ordinal_position
    `);
    console.log("Estructura de case_control:", tableInfo);

    // Consulta 2: Ver todos los registros
    const allRecords = await AppDataSource.query(`
      SELECT * FROM case_control LIMIT 5
    `);
    console.log("Primeros 5 registros:", allRecords);

    // Consulta 3: Verificar totalTimeMinutes
    const timeRecords = await AppDataSource.query(`
      SELECT id, "totalTimeMinutes", "userId" 
      FROM case_control 
      WHERE "totalTimeMinutes" IS NOT NULL
      ORDER BY "totalTimeMinutes" DESC
      LIMIT 5
    `);
    console.log("Registros con tiempo:", timeRecords);

    // Consulta 4: Verificar si hay registros con tiempo > 0
    const positiveTimeRecords = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM case_control 
      WHERE "totalTimeMinutes" > 0
    `);
    console.log("Cantidad con tiempo > 0:", positiveTimeRecords);

    res.json({
      success: true,
      data: {
        tableStructure: tableInfo,
        allRecords: allRecords,
        timeRecords: timeRecords,
        positiveTimeCount: positiveTimeRecords[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error en debug:", error);
    res.status(500).json({ error: "Error en debug", details: error });
  }
});

// Nuevos endpoints de debug más completos
router.get(
  "/database/tables",
  authenticateToken,
  DebugController.inspectTables
);
router.get(
  "/metrics/test",
  authenticateToken,
  DebugController.testMetricsQueries
);
router.get(
  "/database/cleanup",
  authenticateToken,
  DebugController.cleanupOrphanRecords
);

export default router;
