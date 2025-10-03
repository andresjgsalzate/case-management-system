import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { AuthRequest } from "../middleware/auth";

// Helper interfaces
interface UserPermissions {
  canReadOwn: boolean;
  canReadAll: boolean;
  isAdmin: boolean;
}

export class DashboardMetricsController {
  /**
   * Helper function to verify user permissions for metrics
   * @param user User object with role and permissions
   * @param metricType Type of metric (time, cases, general, etc.)
   * @returns Object with permission flags
   */
  private static async verifyMetricPermissions(
    user: any,
    metricType: string
  ): Promise<UserPermissions> {
    const permissions = user?.role?.rolePermissions || [];

    // Check for admin permissions
    const isAdmin = permissions.some(
      (rp: any) => rp.permission.name === "admin.full"
    );

    // Check for specific metric permissions
    const canReadOwn = permissions.some(
      (rp: any) =>
        rp.permission.name === `metrics.${metricType}.read.own` ||
        rp.permission.name === `dashboard.read.own`
    );

    const canReadAll = permissions.some(
      (rp: any) =>
        rp.permission.name === `metrics.${metricType}.read.all` ||
        rp.permission.name === `dashboard.read.all` ||
        isAdmin
    );

    return {
      canReadOwn,
      canReadAll,
      isAdmin,
    };
  }

  /**
   * Helper function to get user with permissions
   * @param userId User ID to lookup
   * @returns User object with role and permissions
   */
  private static async getUserWithPermissions(userId: string) {
    const userRepo = AppDataSource.getRepository("UserProfile");
    return await userRepo.findOne({
      where: { id: userId },
      relations: [
        "role",
        "role.rolePermissions",
        "role.rolePermissions.permission",
      ],
    });
  }
  // GET /api/metrics/general - Métricas generales del dashboard
  static async getGeneralMetrics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Get user with permissions
      const user = await DashboardMetricsController.getUserWithPermissions(
        userId
      );
      const permissions =
        await DashboardMetricsController.verifyMetricPermissions(
          user,
          "general"
        );

      // Check if user has any permission to read metrics
      if (!permissions.canReadOwn && !permissions.canReadAll) {
        return res.status(403).json({
          error: "No tienes permisos para ver métricas generales",
        });
      }

      let totalCasesQuery = `SELECT COUNT(*) as count FROM case_control`;
      let activeCasesQuery = `SELECT COUNT(*) as count FROM case_control WHERE "isTimerActive" = true`;
      let totalUsersQuery = `SELECT COUNT(*) as count FROM user_profiles WHERE "isActive" = true`;

      // Apply filtering based on permissions
      if (!permissions.canReadAll && permissions.canReadOwn) {
        // User can only see their own metrics
        totalCasesQuery += ` WHERE "userId" = $1`;
        activeCasesQuery += ` AND "userId" = $1`;
        // For own scope, don't show total users
        totalUsersQuery = `SELECT 0 as count`;
      }

      const [totalCases, activeCases, totalUsers] = await Promise.all([
        AppDataSource.query(
          totalCasesQuery,
          !permissions.canReadAll ? [userId] : []
        ),
        AppDataSource.query(
          activeCasesQuery,
          !permissions.canReadAll ? [userId] : []
        ),
        permissions.canReadAll
          ? AppDataSource.query(totalUsersQuery)
          : [{ count: 0 }],
      ]);

      const metrics = {
        totalCases: parseInt(totalCases[0]?.count || 0),
        activeCases: parseInt(activeCases[0]?.count || 0),
        totalUsers: parseInt(totalUsers[0]?.count || 0),
        completedCases:
          parseInt(totalCases[0]?.count || 0) -
          parseInt(activeCases[0]?.count || 0),
        scope: permissions.canReadAll ? "all" : "own", // Include scope info
      };

      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error en getGeneralMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/time - Métricas de tiempo total
  static async getTimeMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Get user with permissions
      const user = await DashboardMetricsController.getUserWithPermissions(
        userId
      );
      const permissions =
        await DashboardMetricsController.verifyMetricPermissions(user, "time");

      // Check if user has any permission to read metrics
      if (!permissions.canReadOwn && !permissions.canReadAll) {
        return res.status(403).json({
          error: "No tienes permisos para ver métricas de tiempo",
        });
      }

      // Construir parámetros para filtros de fecha
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Para casos: calcular tiempo solo de entries en el rango de fechas especificado
      let casesTimeQuery = `
        SELECT 
          COALESCE(SUM(
            -- Tiempo de timer entries del período
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                  ELSE COALESCE(te."durationMinutes", 0)
                END
              ) FROM time_entries te 
               WHERE te."caseControlId" = cc.id`;

      // Agregar filtros de fecha para time_entries
      if (startDate) {
        casesTimeQuery += ` AND te."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        casesTimeQuery += ` AND te."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      casesTimeQuery += `), 0
            ) +
            -- Tiempo de manual entries del período
            COALESCE(
              (SELECT SUM(mte."durationMinutes") 
               FROM manual_time_entries mte 
               WHERE mte."caseControlId" = cc.id`;

      // Agregar filtros de fecha para manual_time_entries
      if (startDate) {
        casesTimeQuery += ` AND mte."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        casesTimeQuery += ` AND mte."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      casesTimeQuery += `), 0
            )
          ), 0) as total_time_minutes
        FROM case_control cc
        WHERE 1=1`;

      // Apply filtering based on permissions
      if (!permissions.canReadAll && permissions.canReadOwn) {
        casesTimeQuery += ` AND cc."userId" = $${paramIndex}`;
        queryParams.push(userId);
        paramIndex++;
      }

      // Solo incluir casos que tengan actividad en el período especificado
      if (startDate || endDate) {
        casesTimeQuery += ` AND (
          EXISTS (
            SELECT 1 FROM time_entries te 
            WHERE te."caseControlId" = cc.id`;

        if (startDate) {
          casesTimeQuery += ` AND te."createdAt" >= $${paramIndex}`;
          queryParams.push(startDate);
          paramIndex++;
        }

        if (endDate) {
          casesTimeQuery += ` AND te."createdAt" <= $${paramIndex}`;
          queryParams.push(endDate);
          paramIndex++;
        }

        casesTimeQuery += `) OR EXISTS (
            SELECT 1 FROM manual_time_entries mte 
            WHERE mte."caseControlId" = cc.id`;

        if (startDate) {
          casesTimeQuery += ` AND mte."createdAt" >= $${paramIndex}`;
          queryParams.push(startDate);
          paramIndex++;
        }

        if (endDate) {
          casesTimeQuery += ` AND mte."createdAt" <= $${paramIndex}`;
          queryParams.push(endDate);
          paramIndex++;
        }

        casesTimeQuery += `))`;
      }

      // Consulta para tiempo de TODOs (filtrar por actividad reciente en time entries)
      let todosTimeQuery = `
        SELECT 
          COALESCE(SUM(
            -- Tiempo de timer entries del período
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN tte.end_time IS NOT NULL AND tte.start_time IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (tte.end_time - tte.start_time)) / 60
                  ELSE COALESCE(tte.duration_minutes, 0)
                END
              ) FROM todo_time_entries tte 
               WHERE tte.todo_control_id = tc.id`;

      // Agregar filtros de fecha para TODO time entries si existen
      const todoQueryParams: any[] = [];
      let todoParamIndex = 1;

      if (startDate) {
        todosTimeQuery += ` AND tte.created_at >= $${todoParamIndex}`;
        todoQueryParams.push(startDate);
        todoParamIndex++;
      }

      if (endDate) {
        todosTimeQuery += ` AND tte.created_at <= $${todoParamIndex}`;
        todoQueryParams.push(endDate);
        todoParamIndex++;
      }

      todosTimeQuery += `), 0
            ) +
            -- Tiempo de manual entries del período
            COALESCE(
              (SELECT SUM(tmte.duration_minutes) 
               FROM todo_manual_time_entries tmte 
               WHERE tmte.todo_control_id = tc.id`;

      if (startDate) {
        todosTimeQuery += ` AND tmte.created_at >= $${todoParamIndex}`;
        todoQueryParams.push(startDate);
        todoParamIndex++;
      }

      if (endDate) {
        todosTimeQuery += ` AND tmte.created_at <= $${todoParamIndex}`;
        todoQueryParams.push(endDate);
        todoParamIndex++;
      }

      todosTimeQuery += `), 0
            )
          ), 0) as total_time_minutes
        FROM todo_control tc
        WHERE 1=1`;

      if (!permissions.canReadAll && permissions.canReadOwn) {
        todosTimeQuery += ` AND tc.user_id = $${todoParamIndex}`;
        todoQueryParams.push(userId);
        todoParamIndex++;
      }

      // Solo incluir TODOs que tengan actividad en el período especificado
      if (startDate || endDate) {
        todosTimeQuery += ` AND (
          EXISTS (
            SELECT 1 FROM todo_time_entries tte 
            WHERE tte.todo_control_id = tc.id`;

        if (startDate) {
          todosTimeQuery += ` AND tte.created_at >= $${todoParamIndex}`;
          todoQueryParams.push(startDate);
          todoParamIndex++;
        }

        if (endDate) {
          todosTimeQuery += ` AND tte.created_at <= $${todoParamIndex}`;
          todoQueryParams.push(endDate);
          todoParamIndex++;
        }

        todosTimeQuery += `) OR EXISTS (
            SELECT 1 FROM todo_manual_time_entries tmte 
            WHERE tmte.todo_control_id = tc.id`;

        if (startDate) {
          todosTimeQuery += ` AND tmte.created_at >= $${todoParamIndex}`;
          todoQueryParams.push(startDate);
          todoParamIndex++;
        }

        if (endDate) {
          todosTimeQuery += ` AND tmte.created_at <= $${todoParamIndex}`;
          todoQueryParams.push(endDate);
          todoParamIndex++;
        }

        todosTimeQuery += `))`;
      }

      // Consulta separada para timers activos
      let activeTimersQuery = `
        SELECT COUNT(*) as active_timers
        FROM case_control cc
        WHERE cc."isTimerActive" = true
      `;

      if (!permissions.canReadAll && permissions.canReadOwn) {
        activeTimersQuery += ` AND cc."userId" = $${queryParams.length}`;
        // No necesitamos agregar el parámetro de nuevo, ya lo tenemos
      }

      console.log("Executing cases time query:", casesTimeQuery);
      console.log("Cases query parameters:", queryParams);
      console.log("Executing todos time query:", todosTimeQuery);
      console.log("TODOs query parameters:", todoQueryParams);
      console.log("Executing active timers query:", activeTimersQuery);

      // Ejecutar consulta para tiempo de casos
      const casesTimeResult = await AppDataSource.query(
        casesTimeQuery,
        queryParams
      );

      // Ejecutar consulta para tiempo de TODOs
      const todosTimeResult = await AppDataSource.query(
        todosTimeQuery,
        todoQueryParams
      );

      // Ejecutar consulta separada para timers activos con los mismos parámetros de usuario
      const activeTimersParams = permissions.canReadAll ? [] : [userId];
      const activeTimersResult = await AppDataSource.query(
        activeTimersQuery,
        activeTimersParams
      );

      console.log("Cases time result:", casesTimeResult);
      console.log("TODOs time result:", todosTimeResult);
      console.log("Active timers result:", activeTimersResult);

      // Calcular totales combinando casos y TODOs
      const casesTotalMinutes = parseInt(
        casesTimeResult[0]?.total_time_minutes || 0
      );
      const todosTotalMinutes = parseInt(
        todosTimeResult[0]?.total_time_minutes || 0
      );
      const totalMinutes = casesTotalMinutes + todosTotalMinutes;
      const totalHours = totalMinutes / 60.0;

      const now = new Date();
      const timeMetrics = {
        totalTimeMinutes: totalMinutes,
        totalHours: parseFloat(totalHours.toFixed(2)),
        casesTimeMinutes: casesTotalMinutes,
        casesTimeHours: parseFloat((casesTotalMinutes / 60.0).toFixed(2)),
        todosTimeMinutes: todosTotalMinutes,
        todosTimeHours: parseFloat((todosTotalMinutes / 60.0).toFixed(2)),
        averageTimePerCase: casesTimeResult[0]?.total_time_minutes
          ? parseFloat(
              (casesTotalMinutes / (casesTimeResult.length || 1)).toFixed(2)
            )
          : 0,
        activeTimers: parseInt(activeTimersResult[0]?.active_timers || 0),
        currentMonth: now.toLocaleString("es-ES", { month: "long" }),
        currentYear: now.getFullYear(),
        scope: permissions.canReadAll ? "all" : "own", // Include scope info
      };

      res.json({ success: true, data: timeMetrics });
    } catch (error) {
      console.error("Error en getTimeMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/users/time - Métricas de tiempo por usuario
  static async getUserTimeMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Verificar permisos (solo supervisores y admins)
      const userRepo = AppDataSource.getRepository("UserProfile");
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: [
          "role",
          "role.rolePermissions",
          "role.rolePermissions.permission",
        ],
      });

      const canReadUserMetrics = user?.role?.rolePermissions?.some(
        (rp: any) =>
          rp.permission.name === "metrics.users.read.team" ||
          rp.permission.name === "metrics.users.read.all" ||
          rp.permission.name === "admin.full"
      );

      if (!canReadUserMetrics) {
        return res
          .status(403)
          .json({ error: "Sin permisos para ver métricas de usuarios" });
      }

      let userQuery = `
        SELECT 
          u.id as user_id,
          u."fullName" as user_name,
          COALESCE(SUM(
            -- Calcular tiempo solo del período especificado
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                  ELSE COALESCE(te."durationMinutes", 0)
                END
              ) FROM time_entries te 
               WHERE te."caseControlId" = cc.id`;

      const queryParams: any[] = [];
      let paramIndex = 1;

      // Agregar filtros de fecha para time_entries
      if (startDate) {
        userQuery += ` AND te."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        userQuery += ` AND te."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      userQuery += `), 0
            ) +
            COALESCE(
              (SELECT SUM(mte."durationMinutes") 
               FROM manual_time_entries mte 
               WHERE mte."caseControlId" = cc.id`;

      // Agregar filtros de fecha para manual_time_entries
      if (startDate) {
        userQuery += ` AND mte."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        userQuery += ` AND mte."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      userQuery += `), 0
            )
          ), 0) as total_time_minutes,
          COUNT(DISTINCT CASE 
            WHEN (
              EXISTS (
                SELECT 1 FROM time_entries te 
                WHERE te."caseControlId" = cc.id`;

      // Contar casos solo si tienen actividad en el período
      if (startDate) {
        userQuery += ` AND te."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        userQuery += ` AND te."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      userQuery += `) OR EXISTS (
                SELECT 1 FROM manual_time_entries mte 
                WHERE mte."caseControlId" = cc.id`;

      if (startDate) {
        userQuery += ` AND mte."createdAt" >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        userQuery += ` AND mte."createdAt" <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      userQuery += `)
            ) THEN cc."caseId" 
            ELSE NULL 
          END) as cases_worked
        FROM user_profiles u
        LEFT JOIN case_control cc ON u.id = cc."userId"
        WHERE 1=1`;

      userQuery += ` GROUP BY u.id, u."fullName" ORDER BY total_time_minutes DESC`;

      const result = await AppDataSource.query(userQuery, queryParams);

      const userTimeMetrics = result.map((row: any) => ({
        userId: row.user_id,
        userName: row.user_name,
        totalTimeMinutes: parseInt(row.total_time_minutes || 0),
        casesWorked: parseInt(row.cases_worked || 0),
      }));

      res.json({ success: true, data: userTimeMetrics });
    } catch (error) {
      console.error("Error en getUserTimeMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/cases/time - Métricas de tiempo por caso
  static async getCaseTimeMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Get user with permissions
      const user = await DashboardMetricsController.getUserWithPermissions(
        userId
      );
      const permissions =
        await DashboardMetricsController.verifyMetricPermissions(user, "cases");

      // Check if user has any permission to read case metrics
      if (!permissions.canReadOwn && !permissions.canReadAll) {
        return res.status(403).json({
          error: "No tienes permisos para ver métricas de casos",
        });
      }

      console.log("=== DEBUG: Usuario y permisos ===");
      console.log("Usuario:", user?.fullName, "Rol:", user?.role?.name);
      console.log("Permisos de casos:", {
        canReadOwn: permissions.canReadOwn,
        canReadAll: permissions.canReadAll,
      });

      // Consulta que obtiene casos con tiempo registrado en el período especificado
      let caseQuery = `
        SELECT 
          cc.id as case_id,
          COALESCE(c."numeroCaso", 'Caso #' || LEFT(cc.id::text, 8)) as case_number,
          COALESCE(c."descripcion", 'Caso sin título') as title,
          COALESCE(c."descripcion", 'Sin descripción') as description,
          COALESCE(cs.name, 'En progreso') as status,
          COALESCE(cs.color, '#3b82f6') as status_color,
          -- Calcular tiempo solo del período especificado
          (COALESCE(
            (SELECT SUM(
              CASE 
                WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                ELSE COALESCE(te."durationMinutes", 0)
              END
            ) FROM time_entries te 
             WHERE te."caseControlId" = cc.id`;

      const queryParams: any[] = [];

      // Aplicar filtros de fecha a time_entries
      if (startDate) {
        caseQuery += ` AND te."createdAt" >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        caseQuery += ` AND te."createdAt" <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      caseQuery += `), 0
          ) +
          COALESCE(
            (SELECT SUM(mte."durationMinutes") 
             FROM manual_time_entries mte 
             WHERE mte."caseControlId" = cc.id`;

      // Aplicar filtros de fecha a manual_time_entries
      if (startDate) {
        caseQuery += ` AND mte."createdAt" >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        caseQuery += ` AND mte."createdAt" <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      caseQuery += `), 0
          )) as total_time_minutes,
          c."clasificacion" as complexity
        FROM case_control cc
        LEFT JOIN cases c ON cc."caseId" = c.id
        LEFT JOIN case_status_control cs ON cc."statusId" = cs.id
        WHERE 1=1`;

      // Filtrar por permisos: si no tiene permisos para ver todos, solo mostrar sus casos
      if (!permissions.canReadAll && permissions.canReadOwn) {
        console.log("Aplicando filtro por usuario actual:", userId);
        caseQuery += ` AND cc."userId" = $${queryParams.length + 1}`;
        queryParams.push(userId);
      } else {
        console.log("Usuario tiene permisos para ver todos los casos");
      }

      // Solo incluir casos que tengan actividad en el período especificado
      if (startDate || endDate) {
        caseQuery += ` AND (
          EXISTS (
            SELECT 1 FROM time_entries te 
            WHERE te."caseControlId" = cc.id`;

        if (startDate) {
          caseQuery += ` AND te."createdAt" >= $${queryParams.length + 1}`;
          queryParams.push(startDate);
        }

        if (endDate) {
          caseQuery += ` AND te."createdAt" <= $${queryParams.length + 1}`;
          queryParams.push(endDate);
        }

        caseQuery += `) OR EXISTS (
            SELECT 1 FROM manual_time_entries mte 
            WHERE mte."caseControlId" = cc.id`;

        if (startDate) {
          caseQuery += ` AND mte."createdAt" >= $${queryParams.length + 1}`;
          queryParams.push(startDate);
        }

        if (endDate) {
          caseQuery += ` AND mte."createdAt" <= $${queryParams.length + 1}`;
          queryParams.push(endDate);
        }

        caseQuery += `))`;
      }

      // Agregar condición WHERE para filtrar casos con tiempo > 0 y ordenar
      caseQuery += `
        AND (COALESCE(
          (SELECT SUM(
            CASE 
              WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
              ELSE COALESCE(te."durationMinutes", 0)
            END
          ) FROM time_entries te 
           WHERE te."caseControlId" = cc.id`;

      // Repetir filtros de fecha para la condición final
      if (startDate) {
        caseQuery += ` AND te."createdAt" >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        caseQuery += ` AND te."createdAt" <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      caseQuery += `), 0
        ) +
        COALESCE(
          (SELECT SUM(mte."durationMinutes") 
           FROM manual_time_entries mte 
           WHERE mte."caseControlId" = cc.id`;

      if (startDate) {
        caseQuery += ` AND mte."createdAt" >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        caseQuery += ` AND mte."createdAt" <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      caseQuery += `), 0
        )) > 0
        ORDER BY total_time_minutes DESC
        LIMIT 10
      `;

      const result = await AppDataSource.query(caseQuery, queryParams);

      const caseTimeMetrics = result.map((row: any) => ({
        caseId: row.case_id,
        caseNumber: row.case_number,
        title: row.title,
        description: row.description,
        status: row.status,
        statusColor: row.status_color,
        totalTimeMinutes: parseInt(row.total_time_minutes) || 0,
        complexity: row.complexity,
      }));

      res.json({
        success: true,
        data: {
          cases: caseTimeMetrics,
          scope: permissions.canReadAll ? "all" : "own",
        },
      });
    } catch (error) {
      console.error("Error en getCaseTimeMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/status - Métricas por estado
  static async getStatusMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Get user with permissions
      const user = await DashboardMetricsController.getUserWithPermissions(
        userId
      );
      const permissions =
        await DashboardMetricsController.verifyMetricPermissions(
          user,
          "status"
        );

      // Check if user has any permission to read status metrics
      if (!permissions.canReadOwn && !permissions.canReadAll) {
        return res.status(403).json({
          error: "No tienes permisos para ver métricas de estados",
        });
      }

      let statusQuery = `
        SELECT 
          cs.id as status_id,
          cs.name as status_name,
          cs.color as status_color,
          COUNT(cc.id) as cases_count,
          COALESCE(SUM(
            -- Calcular tiempo dinámicamente como en Control de casos
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                  ELSE COALESCE(te."durationMinutes", 0)
                END
              ) FROM time_entries te WHERE te."caseControlId" = cc.id), 0
            ) +
            COALESCE(
              (SELECT SUM(mte."durationMinutes") 
               FROM manual_time_entries mte 
               WHERE mte."caseControlId" = cc.id), 0
            )
          ), 0) as total_time_minutes
        FROM case_status_control cs
        LEFT JOIN case_control cc ON cs.id = cc."statusId"
        WHERE cs."isActive" = true
      `;

      const queryParams: any[] = [];
      let paramIndex = 1;

      if (startDate) {
        statusQuery += ` AND (cc."assignedAt" IS NULL OR cc."assignedAt" >= $${paramIndex})`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        statusQuery += ` AND (cc."assignedAt" IS NULL OR cc."assignedAt" <= $${paramIndex})`;
        queryParams.push(endDate);
        paramIndex++;
      }

      // Apply filtering based on permissions
      if (!permissions.canReadAll && permissions.canReadOwn) {
        statusQuery += ` AND (cc."userId" IS NULL OR cc."userId" = $${paramIndex})`;
        queryParams.push(userId);
      }

      statusQuery += ` GROUP BY cs.id, cs.name, cs.color 
        HAVING COUNT(cc.id) > 0 OR COALESCE(SUM(
          -- Calcular tiempo dinámicamente como en Control de casos
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                ELSE COALESCE(te."durationMinutes", 0)
              END
            ) FROM time_entries te WHERE te."caseControlId" = cc.id), 0
          ) +
          COALESCE(
            (SELECT SUM(mte."durationMinutes") 
             FROM manual_time_entries mte 
             WHERE mte."caseControlId" = cc.id), 0
          )
        ), 0) > 0
        ORDER BY cases_count DESC`;

      const result = await AppDataSource.query(statusQuery, queryParams);

      const statusMetrics = result.map((row: any) => ({
        statusId: row.status_id,
        statusName: row.status_name,
        statusColor: row.status_color,
        casesCount: parseInt(row.cases_count || 0),
        totalTimeMinutes: parseInt(row.total_time_minutes || 0),
      }));

      res.json({
        success: true,
        data: {
          statuses: statusMetrics,
          scope: permissions.canReadAll ? "all" : "own",
        },
      });
    } catch (error) {
      console.error("Error en getStatusMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/applications - Métricas por aplicación
  static async getApplicationMetrics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Get user with permissions
      const user = await DashboardMetricsController.getUserWithPermissions(
        userId
      );
      const permissions =
        await DashboardMetricsController.verifyMetricPermissions(
          user,
          "applications"
        );

      // Check if user has any permission to read application metrics
      if (!permissions.canReadOwn && !permissions.canReadAll) {
        return res.status(403).json({
          error: "No tienes permisos para ver métricas de aplicaciones",
        });
      }

      // Consulta simplificada que obtiene aplicaciones desde los casos existentes
      let appQuery = `
        SELECT 
          app.id as app_id,
          app.nombre as app_name,
          COUNT(DISTINCT c.id) as cases_count,
          COALESCE(SUM(
            -- Calcular tiempo dinámicamente como en Control de casos
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN te."endTime" IS NOT NULL AND te."startTime" IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (te."endTime" - te."startTime")) / 60
                  ELSE COALESCE(te."durationMinutes", 0)
                END
              ) FROM time_entries te WHERE te."caseControlId" = cc.id), 0
            ) +
            COALESCE(
              (SELECT SUM(mte."durationMinutes") 
               FROM manual_time_entries mte 
               WHERE mte."caseControlId" = cc.id), 0
            )
          ), 0) as total_time_minutes
        FROM cases c
        INNER JOIN aplicaciones app ON c."applicationId" = app.id
        LEFT JOIN case_control cc ON c.id = cc."caseId"
        WHERE 1=1
      `;

      const queryParams: any[] = [];
      let paramIndex = 1;

      if (startDate) {
        appQuery += ` AND (cc."assignedAt" IS NULL OR cc."assignedAt" >= $${paramIndex})`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        appQuery += ` AND (cc."assignedAt" IS NULL OR cc."assignedAt" <= $${paramIndex})`;
        queryParams.push(endDate);
        paramIndex++;
      }

      // Filtrar por permisos
      const canReadAllMetrics = user?.role?.rolePermissions?.some(
        (rp: any) =>
          rp.permission.name === "metrics.applications.read.all" ||
          rp.permission.name === "admin.full"
      );

      if (!canReadAllMetrics) {
        appQuery += ` AND (cc."userId" IS NULL OR cc."userId" = $${paramIndex})`;
        queryParams.push(userId);
      }

      appQuery += ` GROUP BY app.id, app.nombre HAVING COUNT(DISTINCT c.id) > 0 ORDER BY cases_count DESC`;

      const result = await AppDataSource.query(appQuery, queryParams);

      const applicationMetrics = result.map((row: any) => ({
        applicationId: row.app_id,
        applicationName: row.app_name,
        casesCount: parseInt(row.cases_count) || 0,
        totalTimeMinutes: parseInt(row.total_time_minutes) || 0,
      }));

      res.json({ success: true, data: applicationMetrics });
    } catch (error) {
      console.error("Error en getApplicationMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/performance - Métricas de rendimiento
  static async getPerformanceMetrics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Verificar permisos del usuario
      const userRepo = AppDataSource.getRepository("UserProfile");
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: [
          "role",
          "role.rolePermissions",
          "role.rolePermissions.permission",
        ],
      });

      const canReadAllMetrics = user?.role?.rolePermissions?.some(
        (rp: any) =>
          rp.permission.name === "metrics.performance.read.all" ||
          rp.permission.name === "admin.full"
      );

      // Métricas básicas de rendimiento
      let performanceQuery = `
        SELECT 
          COUNT(*) as total_cases,
          COUNT(CASE WHEN cc."completedAt" IS NOT NULL THEN 1 END) as completed_cases,
          AVG(CASE 
            WHEN cc."completedAt" IS NOT NULL AND cc."startedAt" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (cc."completedAt" - cc."startedAt")) / 3600 
          END) as avg_completion_hours,
          AVG(cc."totalTimeMinutes") as avg_time_minutes
        FROM case_control cc
        WHERE 1=1
      `;

      const queryParams: any[] = [];

      if (!canReadAllMetrics) {
        performanceQuery += ` AND cc."userId" = $1`;
        queryParams.push(userId);
      }

      const result = await AppDataSource.query(performanceQuery, queryParams);

      const performanceMetrics = {
        totalCases: parseInt(result[0]?.total_cases || 0),
        completedCases: parseInt(result[0]?.completed_cases || 0),
        completionRate:
          result[0]?.total_cases > 0
            ? (
                (result[0]?.completed_cases / result[0]?.total_cases) *
                100
              ).toFixed(1)
            : "0",
        avgCompletionHours: parseFloat(
          result[0]?.avg_completion_hours || 0
        ).toFixed(1),
        avgTimeMinutes: parseFloat(result[0]?.avg_time_minutes || 0).toFixed(0),
      };

      res.json({ success: true, data: performanceMetrics });
    } catch (error) {
      console.error("Error en getPerformanceMetrics:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // GET /api/metrics/dashboard-stats - Estadísticas completas del dashboard
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // Verificar permisos del usuario
      const userRepo = AppDataSource.getRepository("UserProfile");
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: [
          "role",
          "role.rolePermissions",
          "role.rolePermissions.permission",
        ],
      });

      // Verificar si tiene permisos para ver métricas generales
      const canReadAllMetrics = user?.role?.rolePermissions?.some(
        (rp: any) =>
          rp.permission.name === "metrics.general.read.all" ||
          rp.permission.name === "admin.full"
      );

      // Consulta para obtener estadísticas de complejidad de TODOS los casos (asignados o no)
      let complexityQuery = `
        SELECT 
          c."clasificacion" as complexity,
          COUNT(DISTINCT c.id) as cases_count
        FROM cases c
        WHERE 1=1
      `;

      // Para admin, mostrar todos los casos
      // Para usuarios normales, solo casos asignados a ellos O casos sin asignar
      if (!canReadAllMetrics) {
        complexityQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $1)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
      }

      complexityQuery += ` GROUP BY c."clasificacion"`;

      const complexityResult = await AppDataSource.query(
        complexityQuery,
        canReadAllMetrics ? [] : [userId]
      );

      // Procesar resultados de complejidad
      const complexityStats = {
        lowComplexity: 0,
        mediumComplexity: 0,
        highComplexity: 0,
      };

      complexityResult.forEach((row: any) => {
        const count = parseInt(row.cases_count) || 0;
        switch (row.complexity) {
          case "Baja Complejidad":
            complexityStats.lowComplexity = count;
            break;
          case "Media Complejidad":
            complexityStats.mediumComplexity = count;
            break;
          case "Alta Complejidad":
            complexityStats.highComplexity = count;
            break;
        }
      });

      // Obtener total de casos (todos los casos, no solo los asignados)
      let totalCasesQuery = `SELECT COUNT(DISTINCT c.id) as count FROM cases c WHERE 1=1`;
      if (!canReadAllMetrics) {
        totalCasesQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $1)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
      }

      const totalCasesResult = await AppDataSource.query(
        totalCasesQuery,
        canReadAllMetrics ? [] : [userId]
      );

      const totalCases = parseInt(totalCasesResult[0]?.count || 0);

      // Calcular casos de este mes y semana
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let thisMonthQuery = `
        SELECT COUNT(DISTINCT c.id) as count 
        FROM cases c 
        WHERE c."createdAt" >= $1
      `;

      let thisWeekQuery = `
        SELECT COUNT(DISTINCT c.id) as count 
        FROM cases c 
        WHERE c."createdAt" >= $1
      `;

      const queryParamsMonth = [firstDayOfMonth];
      const queryParamsWeek = [oneWeekAgo];

      if (!canReadAllMetrics) {
        thisMonthQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $2)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
        thisWeekQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $2)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
        queryParamsMonth.push(userId);
        queryParamsWeek.push(userId);
      }
      const [thisMonthResult, thisWeekResult] = await Promise.all([
        AppDataSource.query(thisMonthQuery, queryParamsMonth),
        AppDataSource.query(thisWeekQuery, queryParamsWeek),
      ]);

      const dashboardStats = {
        totalCases,
        ...complexityStats,
        thisMonth: parseInt(thisMonthResult[0]?.count || 0),
        thisWeek: parseInt(thisWeekResult[0]?.count || 0),
      };

      res.json({ success: true, data: dashboardStats });
    } catch (error) {
      console.error("Error en getDashboardStats:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
