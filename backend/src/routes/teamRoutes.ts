import { Router } from "express";
import { TeamController } from "../controllers/TeamController";
import { authenticateToken } from "../middleware/auth";
import { requireAnyPermission } from "../middleware/TeamAuthorizationMiddleware";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();
const teamController = new TeamController();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// ============================================
// RUTAS DE EQUIPOS
// ============================================

// Obtener todos los equipos con filtros
router.get(
  "/",
  requireAnyPermission(["teams.view.all"]),
  teamController.getAllTeams
);

// Crear nuevo equipo
router.post(
  "/",
  requireAnyPermission(["teams.create.all"]),
  AuditMiddleware.auditCreate("teams"),
  teamController.createTeam
);

// Obtener equipo específico por ID
router.get(
  "/:id",
  requireAnyPermission(["teams.view.all"]),
  teamController.getTeamById
);

// Actualizar equipo específico
router.put(
  "/:id",
  requireAnyPermission(["teams.edit.all"]),
  AuditMiddleware.auditUpdate("teams"),
  teamController.updateTeam
);

// Eliminar equipo específico
router.delete(
  "/:id",
  requireAnyPermission(["teams.delete.all"]),
  AuditMiddleware.auditDelete("teams"),
  teamController.deleteTeam
);

// Alternar estado del equipo (activo/inactivo)
router.patch(
  "/:id/toggle-status",
  requireAnyPermission(["teams.edit.all"]),
  AuditMiddleware.auditUpdate("teams"),
  teamController.toggleTeamStatus
);

// ============================================
// RUTAS DE MIEMBROS DE EQUIPOS
// ============================================

// Obtener miembros de un equipo
router.get(
  "/:teamId/members",
  requireAnyPermission(["teams.view.all", "teams.manage.members"]),
  teamController.getTeamMembers
);

// Agregar miembro a equipo
router.post(
  "/:teamId/members",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditCreate("team_members"),
  teamController.addTeamMember
);

// Actualizar miembro de equipo
router.put(
  "/:teamId/members/:memberId",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditUpdate("team_members"),
  teamController.updateTeamMember
);

// Actualizar rol de miembro
router.patch(
  "/:teamId/members/:memberId/role",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditUpdate("team_members"),
  teamController.updateMemberRole
);

// Eliminar miembro de equipo
router.delete(
  "/:teamId/members/:memberId",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditDelete("team_members"),
  teamController.removeTeamMember
);

// ============================================
// RUTAS DE GESTIÓN DE LIDERAZGO
// ============================================

// Transferir liderazgo de equipo
router.patch(
  "/:teamId/transfer-leadership",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditUpdate("team_members"),
  teamController.transferLeadership
);

// ============================================
// RUTAS MASIVAS DE MIEMBROS
// ============================================

// Agregar múltiples miembros
router.post(
  "/:teamId/members/bulk",
  requireAnyPermission(["teams.manage.members"]),
  AuditMiddleware.auditCreate("team_members"),
  teamController.addBulkMembers
);

// ============================================
// RUTAS DE USUARIO
// ============================================

// Obtener equipos del usuario actual
router.get("/user/my-teams", teamController.getMyTeams);

// Verificar membresía de usuario
router.get(
  "/user/:userId/membership/:teamId",
  requireAnyPermission(["teams.view.all"]),
  teamController.checkUserMembership
);

// ============================================
// RUTAS DE ESTADÍSTICAS
// ============================================

// Obtener estadísticas de equipo específico
router.get(
  "/:teamId/stats",
  requireAnyPermission(["teams.view.all"]),
  teamController.getTeamStats
);

export { router as teamRoutes };
