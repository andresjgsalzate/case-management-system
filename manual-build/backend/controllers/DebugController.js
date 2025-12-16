"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugController = void 0;
const database_1 = require("../config/database");
class DebugController {
    static async inspectTables(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            console.log("=== INSPECCIÓN DE BASE DE DATOS ===");
            const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
            const tables = await database_1.AppDataSource.query(tablesQuery);
            console.log("📋 Tablas disponibles:", tables.map((t) => t.table_name));
            const caseControlStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'case_control'
        ORDER BY ordinal_position;
      `;
            const caseControlCols = await database_1.AppDataSource.query(caseControlStructure);
            console.log("🔍 Estructura de case_control:", caseControlCols);
            const caseControlData = `
        SELECT id, "totalTimeMinutes", "userId", "isTimerActive"
        FROM case_control 
        LIMIT 10;
      `;
            const caseControlRows = await database_1.AppDataSource.query(caseControlData);
            console.log("📊 Datos en case_control:", caseControlRows);
            const dispositionsStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'dispositions'
        ORDER BY ordinal_position;
      `;
            const dispositionsCols = await database_1.AppDataSource.query(dispositionsStructure);
            console.log("🔍 Estructura de dispositions:", dispositionsCols);
            const dispositionsData = `
        SELECT * FROM dispositions LIMIT 5;
      `;
            const dispositionsRecords = await database_1.AppDataSource.query(dispositionsData);
            console.log("📋 Datos de dispositions:", dispositionsRecords);
            const casesWithTime = `
        SELECT id, "totalTimeMinutes", "userId"
        FROM case_control 
        WHERE "totalTimeMinutes" > 0
        ORDER BY "totalTimeMinutes" DESC;
      `;
            const casesWithTimeRows = await database_1.AppDataSource.query(casesWithTime);
            console.log("⏱️ Casos con tiempo > 0:", casesWithTimeRows);
            const timeEntriesStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'time_entries'
        ORDER BY ordinal_position;
      `;
            const timeEntriesCols = await database_1.AppDataSource.query(timeEntriesStructure);
            console.log("🔍 Estructura de time_entries:", timeEntriesCols);
            let timeEntriesData = [];
            try {
                const timeEntriesDataQuery = `
          SELECT id, case_id, user_id, duration_minutes, start_date
          FROM time_entries 
          LIMIT 10;
        `;
                timeEntriesData = await database_1.AppDataSource.query(timeEntriesDataQuery);
                console.log("📊 Datos en time_entries:", timeEntriesData);
            }
            catch (error) {
                console.log("❌ time_entries no existe o error:", error?.message);
            }
            const userCases = `
        SELECT 
          id, 
          "totalTimeMinutes", 
          "userId",
          "isTimerActive"
        FROM case_control 
        WHERE "userId" = $1;
      `;
            const userCasesRows = await database_1.AppDataSource.query(userCases, [userId]);
            console.log(`👤 Casos del usuario ${userId}:`, userCasesRows);
            res.json({
                success: true,
                data: {
                    tables: tables.map((t) => t.table_name),
                    caseControlStructure: caseControlCols,
                    caseControlData: caseControlRows,
                    casesWithTime: casesWithTimeRows,
                    timeEntriesStructure: timeEntriesCols,
                    timeEntriesData: timeEntriesData,
                    userCases: userCasesRows,
                    currentUserId: userId,
                },
            });
        }
        catch (error) {
            console.error("Error en inspectTables:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async testMetricsQueries(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            console.log("=== PRUEBA DE CONSULTAS DE MÉTRICAS ===");
            let originalQuery = `
        SELECT 
          cc.id as case_id,
          'Caso #' || cc.id as case_number,
          'Caso de trabajo' as title,
          'Descripción del caso' as description,
          'En progreso' as status,
          '#3b82f6' as status_color,
          cc."totalTimeMinutes" as total_time_minutes
        FROM case_control cc
        WHERE cc."totalTimeMinutes" > 0
        AND cc."userId" = $1
        ORDER BY cc."totalTimeMinutes" DESC
        LIMIT 10
      `;
            const originalResult = await database_1.AppDataSource.query(originalQuery, [userId]);
            console.log("📊 Consulta original resultado:", originalResult);
            let withoutUserFilter = `
        SELECT 
          cc.id as case_id,
          'Caso #' || cc.id as case_number,
          cc."totalTimeMinutes" as total_time_minutes
        FROM case_control cc
        WHERE cc."totalTimeMinutes" > 0
        ORDER BY cc."totalTimeMinutes" DESC
        LIMIT 10
      `;
            const withoutUserResult = await database_1.AppDataSource.query(withoutUserFilter);
            console.log("📊 Sin filtro de usuario:", withoutUserResult);
            let simpleQuery = `
        SELECT 
          id,
          "totalTimeMinutes",
          "userId"
        FROM case_control
        LIMIT 10
      `;
            const simpleResult = await database_1.AppDataSource.query(simpleQuery);
            console.log("📊 Consulta simple:", simpleResult);
            res.json({
                success: true,
                data: {
                    originalQuery: originalResult,
                    withoutUserFilter: withoutUserResult,
                    simpleQuery: simpleResult,
                    currentUserId: userId,
                },
            });
        }
        catch (error) {
            console.error("Error en testMetricsQueries:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async cleanupOrphanRecords(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            console.log("=== LIMPIEZA DE REGISTROS HUÉRFANOS ===");
            const orphanCaseControls = await database_1.AppDataSource.query(`
        SELECT cc.id, cc."caseId", cc."totalTimeMinutes"
        FROM case_control cc
        LEFT JOIN cases c ON c.id = cc."caseId"
        WHERE c.id IS NULL
      `);
            console.log("🗑️ Registros huérfanos en case_control:", orphanCaseControls);
            if (orphanCaseControls.length > 0) {
                await database_1.AppDataSource.query(`
          DELETE FROM time_entries 
          WHERE "caseControlId" IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);
                await database_1.AppDataSource.query(`
          DELETE FROM manual_time_entries 
          WHERE "caseControlId" IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);
                await database_1.AppDataSource.query(`
          DELETE FROM case_control 
          WHERE id IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);
                console.log(`✅ Eliminados ${orphanCaseControls.length} registros huérfanos`);
            }
            else {
                console.log("✅ No se encontraron registros huérfanos");
            }
            const finalCaseControls = await database_1.AppDataSource.query(`
        SELECT COUNT(*) as count FROM case_control
      `);
            res.json({
                success: true,
                data: {
                    orphansFound: orphanCaseControls.length,
                    orphansRemoved: orphanCaseControls.length,
                    remainingCaseControls: finalCaseControls[0].count,
                    orphanRecords: orphanCaseControls,
                },
            });
        }
        catch (error) {
            console.error("Error en cleanupOrphanRecords:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
}
exports.DebugController = DebugController;
