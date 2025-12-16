"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const DebugController_1 = require("../controllers/DebugController");
const router = (0, express_1.Router)();
router.get("/debug/case-control", auth_1.authenticateToken, async (req, res) => {
    try {
        console.log("=== DEBUG CASE-CONTROL ===");
        const tableInfo = await database_1.AppDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'case_control' 
      ORDER BY ordinal_position
    `);
        console.log("Estructura de case_control:", tableInfo);
        const allRecords = await database_1.AppDataSource.query(`
      SELECT * FROM case_control LIMIT 5
    `);
        console.log("Primeros 5 registros:", allRecords);
        const timeRecords = await database_1.AppDataSource.query(`
      SELECT id, "totalTimeMinutes", "userId" 
      FROM case_control 
      WHERE "totalTimeMinutes" IS NOT NULL
      ORDER BY "totalTimeMinutes" DESC
      LIMIT 5
    `);
        console.log("Registros con tiempo:", timeRecords);
        const positiveTimeRecords = await database_1.AppDataSource.query(`
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
    }
    catch (error) {
        console.error("Error en debug:", error);
        res.status(500).json({ error: "Error en debug", details: error });
    }
});
router.get("/database/tables", auth_1.authenticateToken, DebugController_1.DebugController.inspectTables);
router.get("/metrics/test", auth_1.authenticateToken, DebugController_1.DebugController.testMetricsQueries);
router.get("/database/cleanup", auth_1.authenticateToken, DebugController_1.DebugController.cleanupOrphanRecords);
exports.default = router;
