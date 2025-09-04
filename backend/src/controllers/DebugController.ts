import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { AuthRequest } from "../middleware/auth";

export class DebugController {
  // GET /debug/database/tables - Inspeccionar estructura de tablas
  static async inspectTables(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      console.log("=== INSPECCIÓN DE BASE DE DATOS ===");

      // 1. Verificar qué tablas existen
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;

      const tables = await AppDataSource.query(tablesQuery);
      console.log(
        "📋 Tablas disponibles:",
        tables.map((t: any) => t.table_name)
      );

      // 2. Inspeccionar estructura de case_control
      const caseControlStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'case_control'
        ORDER BY ordinal_position;
      `;

      const caseControlCols = await AppDataSource.query(caseControlStructure);
      console.log("🔍 Estructura de case_control:", caseControlCols);

      // 3. Verificar datos en case_control
      const caseControlData = `
        SELECT id, "totalTimeMinutes", "userId", "isTimerActive"
        FROM case_control 
        LIMIT 10;
      `;

      const caseControlRows = await AppDataSource.query(caseControlData);
      console.log("📊 Datos en case_control:", caseControlRows);

      // 3. Inspeccionar estructura de dispositions
      const dispositionsStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'dispositions'
        ORDER BY ordinal_position;
      `;

      const dispositionsCols = await AppDataSource.query(dispositionsStructure);
      console.log("🔍 Estructura de dispositions:", dispositionsCols);

      // 4. Ver algunos registros de dispositions
      const dispositionsData = `
        SELECT * FROM dispositions LIMIT 5;
      `;

      const dispositionsRecords = await AppDataSource.query(dispositionsData);
      console.log("📋 Datos de dispositions:", dispositionsRecords);

      // 4. Ver casos con tiempo registrado
      const casesWithTime = `
        SELECT id, "totalTimeMinutes", "userId"
        FROM case_control 
        WHERE "totalTimeMinutes" > 0
        ORDER BY "totalTimeMinutes" DESC;
      `;

      const casesWithTimeRows = await AppDataSource.query(casesWithTime);
      console.log("⏱️ Casos con tiempo > 0:", casesWithTimeRows);

      // 5. Verificar estructura de otras tablas relacionadas
      const timeEntriesStructure = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'time_entries'
        ORDER BY ordinal_position;
      `;

      const timeEntriesCols = await AppDataSource.query(timeEntriesStructure);
      console.log("🔍 Estructura de time_entries:", timeEntriesCols);

      // 6. Verificar datos en time_entries si existe
      let timeEntriesData = [];
      try {
        const timeEntriesDataQuery = `
          SELECT id, case_id, user_id, duration_minutes, start_date
          FROM time_entries 
          LIMIT 10;
        `;
        timeEntriesData = await AppDataSource.query(timeEntriesDataQuery);
        console.log("📊 Datos en time_entries:", timeEntriesData);
      } catch (error: any) {
        console.log("❌ time_entries no existe o error:", error?.message);
      }

      // 7. Verificar casos específicos del usuario actual
      const userCases = `
        SELECT 
          id, 
          "totalTimeMinutes", 
          "userId",
          "isTimerActive"
        FROM case_control 
        WHERE "userId" = $1;
      `;

      const userCasesRows = await AppDataSource.query(userCases, [userId]);
      console.log(`👤 Casos del usuario ${userId}:`, userCasesRows);

      res.json({
        success: true,
        data: {
          tables: tables.map((t: any) => t.table_name),
          caseControlStructure: caseControlCols,
          caseControlData: caseControlRows,
          casesWithTime: casesWithTimeRows,
          timeEntriesStructure: timeEntriesCols,
          timeEntriesData: timeEntriesData,
          userCases: userCasesRows,
          currentUserId: userId,
        },
      });
    } catch (error) {
      console.error("Error en inspectTables:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /debug/metrics/test - Probar diferentes consultas de métricas
  static async testMetricsQueries(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      console.log("=== PRUEBA DE CONSULTAS DE MÉTRICAS ===");

      // 1. Consulta original que no funciona
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

      const originalResult = await AppDataSource.query(originalQuery, [userId]);
      console.log("📊 Consulta original resultado:", originalResult);

      // 2. Consulta sin filtro de usuario
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

      const withoutUserResult = await AppDataSource.query(withoutUserFilter);
      console.log("📊 Sin filtro de usuario:", withoutUserResult);

      // 3. Consulta muy simple - todos los registros
      let simpleQuery = `
        SELECT 
          id,
          "totalTimeMinutes",
          "userId"
        FROM case_control
        LIMIT 10
      `;

      const simpleResult = await AppDataSource.query(simpleQuery);
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
    } catch (error) {
      console.error("Error en testMetricsQueries:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /debug/database/cleanup - Limpiar registros huérfanos
  static async cleanupOrphanRecords(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      console.log("=== LIMPIEZA DE REGISTROS HUÉRFANOS ===");

      // 1. Encontrar registros en case_control que no tienen caso correspondiente
      const orphanCaseControls = await AppDataSource.query(`
        SELECT cc.id, cc."caseId", cc."totalTimeMinutes"
        FROM case_control cc
        LEFT JOIN cases c ON c.id = cc."caseId"
        WHERE c.id IS NULL
      `);

      console.log(
        "🗑️ Registros huérfanos en case_control:",
        orphanCaseControls
      );

      if (orphanCaseControls.length > 0) {
        // 2. Eliminar time_entries relacionados con estos case_control huérfanos
        await AppDataSource.query(`
          DELETE FROM time_entries 
          WHERE "caseControlId" IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);

        // 3. Eliminar manual_time_entries relacionados con estos case_control huérfanos
        await AppDataSource.query(`
          DELETE FROM manual_time_entries 
          WHERE "caseControlId" IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);

        // 4. Eliminar los registros huérfanos de case_control
        await AppDataSource.query(`
          DELETE FROM case_control 
          WHERE id IN (
            SELECT cc.id 
            FROM case_control cc
            LEFT JOIN cases c ON c.id = cc."caseId"
            WHERE c.id IS NULL
          )
        `);

        console.log(
          `✅ Eliminados ${orphanCaseControls.length} registros huérfanos`
        );
      } else {
        console.log("✅ No se encontraron registros huérfanos");
      }

      // 5. Verificar estado final
      const finalCaseControls = await AppDataSource.query(`
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
    } catch (error) {
      console.error("Error en cleanupOrphanRecords:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
