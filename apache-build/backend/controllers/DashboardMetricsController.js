"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMetricsController = void 0;
const database_1 = require("../config/database");
class DashboardMetricsController {
    static async verifyMetricPermissions(user, metricType) {
        const permissions = user?.role?.rolePermissions || [];
        const isAdmin = permissions.some((rp) => rp.permission.name === "admin.full");
        const canReadOwn = permissions.some((rp) => rp.permission.name === `metrics.${metricType}.read.own` ||
            rp.permission.name === `dashboard.read.own`);
        const canReadAll = permissions.some((rp) => rp.permission.name === `metrics.${metricType}.read.all` ||
            rp.permission.name === `dashboard.read.all` ||
            isAdmin);
        return {
            canReadOwn,
            canReadAll,
            isAdmin,
        };
    }
    static async getUserWithPermissions(userId) {
        const userRepo = database_1.AppDataSource.getRepository("UserProfile");
        return await userRepo.findOne({
            where: { id: userId },
            relations: [
                "role",
                "role.rolePermissions",
                "role.rolePermissions.permission",
            ],
        });
    }
    static async getGeneralMetrics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const user = await DashboardMetricsController.getUserWithPermissions(userId);
            const permissions = await DashboardMetricsController.verifyMetricPermissions(user, "general");
            if (!permissions.canReadOwn && !permissions.canReadAll) {
                return res.status(403).json({
                    error: "No tienes permisos para ver métricas generales",
                });
            }
            let totalCasesQuery = `SELECT COUNT(*) as count FROM case_control`;
            let activeCasesQuery = `SELECT COUNT(*) as count FROM case_control WHERE "isTimerActive" = true`;
            let totalUsersQuery = `SELECT COUNT(*) as count FROM user_profiles WHERE "isActive" = true`;
            if (!permissions.canReadAll && permissions.canReadOwn) {
                totalCasesQuery += ` WHERE "userId" = $1`;
                activeCasesQuery += ` AND "userId" = $1`;
                totalUsersQuery = `SELECT 0 as count`;
            }
            const [totalCases, activeCases, totalUsers] = await Promise.all([
                database_1.AppDataSource.query(totalCasesQuery, !permissions.canReadAll ? [userId] : []),
                database_1.AppDataSource.query(activeCasesQuery, !permissions.canReadAll ? [userId] : []),
                permissions.canReadAll
                    ? database_1.AppDataSource.query(totalUsersQuery)
                    : [{ count: 0 }],
            ]);
            const metrics = {
                totalCases: parseInt(totalCases[0]?.count || 0),
                activeCases: parseInt(activeCases[0]?.count || 0),
                totalUsers: parseInt(totalUsers[0]?.count || 0),
                completedCases: parseInt(totalCases[0]?.count || 0) -
                    parseInt(activeCases[0]?.count || 0),
                scope: permissions.canReadAll ? "all" : "own",
            };
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            console.error("Error en getGeneralMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getTimeMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const user = await DashboardMetricsController.getUserWithPermissions(userId);
            const permissions = await DashboardMetricsController.verifyMetricPermissions(user, "time");
            if (!permissions.canReadOwn && !permissions.canReadAll) {
                return res.status(403).json({
                    error: "No tienes permisos para ver métricas de tiempo",
                });
            }
            const queryParams = [];
            let paramIndex = 1;
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
            if (!permissions.canReadAll && permissions.canReadOwn) {
                casesTimeQuery += ` AND cc."userId" = $${paramIndex}`;
                queryParams.push(userId);
                paramIndex++;
            }
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
            const todoQueryParams = [];
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
            let activeTimersQuery = `
        SELECT COUNT(*) as active_timers
        FROM case_control cc
        WHERE cc."isTimerActive" = true
      `;
            if (!permissions.canReadAll && permissions.canReadOwn) {
                activeTimersQuery += ` AND cc."userId" = $${queryParams.length}`;
            }
            console.log("Executing cases time query:", casesTimeQuery);
            console.log("Cases query parameters:", queryParams);
            console.log("Executing todos time query:", todosTimeQuery);
            console.log("TODOs query parameters:", todoQueryParams);
            console.log("Executing active timers query:", activeTimersQuery);
            const casesTimeResult = await database_1.AppDataSource.query(casesTimeQuery, queryParams);
            const todosTimeResult = await database_1.AppDataSource.query(todosTimeQuery, todoQueryParams);
            const activeTimersParams = permissions.canReadAll ? [] : [userId];
            const activeTimersResult = await database_1.AppDataSource.query(activeTimersQuery, activeTimersParams);
            console.log("Cases time result:", casesTimeResult);
            console.log("TODOs time result:", todosTimeResult);
            console.log("Active timers result:", activeTimersResult);
            const casesTotalMinutes = parseInt(casesTimeResult[0]?.total_time_minutes || 0);
            const todosTotalMinutes = parseInt(todosTimeResult[0]?.total_time_minutes || 0);
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
                    ? parseFloat((casesTotalMinutes / (casesTimeResult.length || 1)).toFixed(2))
                    : 0,
                activeTimers: parseInt(activeTimersResult[0]?.active_timers || 0),
                currentMonth: now.toLocaleString("es-ES", { month: "long" }),
                currentYear: now.getFullYear(),
                scope: permissions.canReadAll ? "all" : "own",
            };
            res.json({ success: true, data: timeMetrics });
        }
        catch (error) {
            console.error("Error en getTimeMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getUserTimeMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const userRepo = database_1.AppDataSource.getRepository("UserProfile");
            const user = await userRepo.findOne({
                where: { id: userId },
                relations: [
                    "role",
                    "role.rolePermissions",
                    "role.rolePermissions.permission",
                ],
            });
            const canReadUserMetrics = user?.role?.rolePermissions?.some((rp) => rp.permission.name === "metrics.users.read.team" ||
                rp.permission.name === "metrics.users.read.all" ||
                rp.permission.name === "admin.full");
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
            const queryParams = [];
            let paramIndex = 1;
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
            const result = await database_1.AppDataSource.query(userQuery, queryParams);
            const userTimeMetrics = result.map((row) => ({
                userId: row.user_id,
                userName: row.user_name,
                totalTimeMinutes: parseInt(row.total_time_minutes || 0),
                casesWorked: parseInt(row.cases_worked || 0),
            }));
            res.json({ success: true, data: userTimeMetrics });
        }
        catch (error) {
            console.error("Error en getUserTimeMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getCaseTimeMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const user = await DashboardMetricsController.getUserWithPermissions(userId);
            const permissions = await DashboardMetricsController.verifyMetricPermissions(user, "cases");
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
            const queryParams = [];
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
          )) as total_time_minutes,
          c."clasificacion" as complexity
        FROM case_control cc
        LEFT JOIN cases c ON cc."caseId" = c.id
        LEFT JOIN case_status_control cs ON cc."statusId" = cs.id
        WHERE 1=1`;
            if (!permissions.canReadAll && permissions.canReadOwn) {
                console.log("Aplicando filtro por usuario actual:", userId);
                caseQuery += ` AND cc."userId" = $${queryParams.length + 1}`;
                queryParams.push(userId);
            }
            else {
                console.log("Usuario tiene permisos para ver todos los casos");
            }
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
            const result = await database_1.AppDataSource.query(caseQuery, queryParams);
            const caseTimeMetrics = result.map((row) => ({
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
        }
        catch (error) {
            console.error("Error en getCaseTimeMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getStatusMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const user = await DashboardMetricsController.getUserWithPermissions(userId);
            const permissions = await DashboardMetricsController.verifyMetricPermissions(user, "status");
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
            const queryParams = [];
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
            const result = await database_1.AppDataSource.query(statusQuery, queryParams);
            const statusMetrics = result.map((row) => ({
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
        }
        catch (error) {
            console.error("Error en getStatusMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getApplicationMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const user = await DashboardMetricsController.getUserWithPermissions(userId);
            const permissions = await DashboardMetricsController.verifyMetricPermissions(user, "applications");
            if (!permissions.canReadOwn && !permissions.canReadAll) {
                return res.status(403).json({
                    error: "No tienes permisos para ver métricas de aplicaciones",
                });
            }
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
            const queryParams = [];
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
            const canReadAllMetrics = user?.role?.rolePermissions?.some((rp) => rp.permission.name === "metrics.applications.read.all" ||
                rp.permission.name === "admin.full");
            if (!canReadAllMetrics) {
                appQuery += ` AND (cc."userId" IS NULL OR cc."userId" = $${paramIndex})`;
                queryParams.push(userId);
            }
            appQuery += ` GROUP BY app.id, app.nombre HAVING COUNT(DISTINCT c.id) > 0 ORDER BY cases_count DESC`;
            const result = await database_1.AppDataSource.query(appQuery, queryParams);
            const applicationMetrics = result.map((row) => ({
                applicationId: row.app_id,
                applicationName: row.app_name,
                casesCount: parseInt(row.cases_count) || 0,
                totalTimeMinutes: parseInt(row.total_time_minutes) || 0,
            }));
            res.json({ success: true, data: applicationMetrics });
        }
        catch (error) {
            console.error("Error en getApplicationMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getPerformanceMetrics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const userRepo = database_1.AppDataSource.getRepository("UserProfile");
            const user = await userRepo.findOne({
                where: { id: userId },
                relations: [
                    "role",
                    "role.rolePermissions",
                    "role.rolePermissions.permission",
                ],
            });
            const canReadAllMetrics = user?.role?.rolePermissions?.some((rp) => rp.permission.name === "metrics.performance.read.all" ||
                rp.permission.name === "admin.full");
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
            const queryParams = [];
            if (!canReadAllMetrics) {
                performanceQuery += ` AND cc."userId" = $1`;
                queryParams.push(userId);
            }
            const result = await database_1.AppDataSource.query(performanceQuery, queryParams);
            const performanceMetrics = {
                totalCases: parseInt(result[0]?.total_cases || 0),
                completedCases: parseInt(result[0]?.completed_cases || 0),
                completionRate: result[0]?.total_cases > 0
                    ? ((result[0]?.completed_cases / result[0]?.total_cases) *
                        100).toFixed(1)
                    : "0",
                avgCompletionHours: parseFloat(result[0]?.avg_completion_hours || 0).toFixed(1),
                avgTimeMinutes: parseFloat(result[0]?.avg_time_minutes || 0).toFixed(0),
            };
            res.json({ success: true, data: performanceMetrics });
        }
        catch (error) {
            console.error("Error en getPerformanceMetrics:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }
            const userRepo = database_1.AppDataSource.getRepository("UserProfile");
            const user = await userRepo.findOne({
                where: { id: userId },
                relations: [
                    "role",
                    "role.rolePermissions",
                    "role.rolePermissions.permission",
                ],
            });
            const canReadAllMetrics = user?.role?.rolePermissions?.some((rp) => rp.permission.name === "metrics.general.read.all" ||
                rp.permission.name === "admin.full");
            let complexityQuery = `
        SELECT 
          c."clasificacion" as complexity,
          COUNT(DISTINCT c.id) as cases_count
        FROM cases c
        WHERE 1=1
      `;
            if (!canReadAllMetrics) {
                complexityQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $1)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
            }
            complexityQuery += ` GROUP BY c."clasificacion"`;
            const complexityResult = await database_1.AppDataSource.query(complexityQuery, canReadAllMetrics ? [] : [userId]);
            const complexityStats = {
                lowComplexity: 0,
                mediumComplexity: 0,
                highComplexity: 0,
            };
            complexityResult.forEach((row) => {
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
            let totalCasesQuery = `SELECT COUNT(DISTINCT c.id) as count FROM cases c WHERE 1=1`;
            if (!canReadAllMetrics) {
                totalCasesQuery += ` AND (
          c.id IN (SELECT cc."caseId" FROM case_control cc WHERE cc."userId" = $1)
          OR c.id NOT IN (SELECT cc."caseId" FROM case_control cc)
        )`;
            }
            const totalCasesResult = await database_1.AppDataSource.query(totalCasesQuery, canReadAllMetrics ? [] : [userId]);
            const totalCases = parseInt(totalCasesResult[0]?.count || 0);
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
                database_1.AppDataSource.query(thisMonthQuery, queryParamsMonth),
                database_1.AppDataSource.query(thisWeekQuery, queryParamsWeek),
            ]);
            const dashboardStats = {
                totalCases,
                ...complexityStats,
                thisMonth: parseInt(thisMonthResult[0]?.count || 0),
                thisWeek: parseInt(thisWeekResult[0]?.count || 0),
            };
            res.json({ success: true, data: dashboardStats });
        }
        catch (error) {
            console.error("Error en getDashboardStats:", error);
            res.status(500).json({
                error: "Error interno del servidor",
                details: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
}
exports.DashboardMetricsController = DashboardMetricsController;
