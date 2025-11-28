import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { DataSource } from "typeorm";
import { TeamService } from "../services/TeamService";
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  TeamQueryDto,
  TeamMemberQueryDto,
  TransferTeamLeadershipDto,
  BulkTeamMemberDto,
  TeamStatsQueryDto,
} from "../dto/team.dto";

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  // ============================================
  // CRUD DE EQUIPOS
  // ============================================

  /**
   * Crear nuevo equipo
   * POST /api/teams
   */
  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createTeamDto = Object.assign(new CreateTeamDto(), req.body);

      // Validar DTO
      const errors = await validate(createTeamDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const team = await this.teamService.createTeam(createTeamDto);

      res.status(201).json({
        message: "Equipo creado exitosamente",
        data: team.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener todos los equipos con filtros
   * GET /api/teams
   */
  getAllTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as TeamQueryDto;
      const result = await this.teamService.getAllTeams(query);

      // Mapear equipos usando el método toJSON que incluye memberCount
      const teamsData = result.teams.map((team) => team.toJSON());

      res.json({
        message: "Equipos obtenidos exitosamente",
        data: teamsData,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener equipo por ID
   * GET /api/teams/:id
   */
  getTeamById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      const team = await this.teamService.getTeamById(id);

      res.json({
        message: "Equipo obtenido exitosamente",
        data: team.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar equipo
   * PUT /api/teams/:id
   */
  updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateTeamDto = Object.assign(new UpdateTeamDto(), req.body);

      if (!id) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      // Validar DTO
      const errors = await validate(updateTeamDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const team = await this.teamService.updateTeam(id, updateTeamDto);

      res.json({
        message: "Equipo actualizado exitosamente",
        data: team.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar equipo
   * DELETE /api/teams/:id
   */
  deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      const result = await this.teamService.deleteTeam(id);

      res.json({
        message: result.message,
        action: result.action,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Alternar estado del equipo (activo/inactivo)
   * PATCH /api/teams/:id/toggle-status
   */
  toggleTeamStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      const team = await this.teamService.toggleTeamStatus(id);

      res.json({
        message: `Equipo ${
          team.isActive ? "activado" : "desactivado"
        } exitosamente`,
        data: team.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // GESTIÓN DE MIEMBROS
  // ============================================

  /**
   * Obtener miembros de un equipo
   * GET /api/teams/:teamId/members
   */
  getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;
      const query = req.query as unknown as TeamMemberQueryDto;

      if (!teamId) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      const members = await this.teamService.getTeamMembers(teamId, query);

      res.json({
        message: "Miembros del equipo obtenidos exitosamente",
        data: members.map((member) => member.toJSON()),
        count: members.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Agregar miembro al equipo
   * POST /api/teams/:teamId/members
   */
  addTeamMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;
      const addMemberDto = Object.assign(new AddTeamMemberDto(), req.body);

      if (!teamId) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      // Validar DTO
      const errors = await validate(addMemberDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const member = await this.teamService.addMember(teamId, addMemberDto);

      res.status(201).json({
        message: "Miembro agregado al equipo exitosamente",
        data: member.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar miembro del equipo
   * PUT /api/teams/:teamId/members/:userId
   */
  updateTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId, userId } = req.params;
      const updateMemberDto = Object.assign(
        new UpdateTeamMemberDto(),
        req.body
      );

      if (!teamId || !userId) {
        return res.status(400).json({
          error: "ID del equipo y ID del usuario son requeridos",
        });
      }

      // Validar DTO
      const errors = await validate(updateMemberDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const member = await this.teamService.updateMember(
        teamId,
        userId,
        updateMemberDto
      );

      res.json({
        message: "Miembro del equipo actualizado exitosamente",
        data: member.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remover miembro del equipo
   * DELETE /api/teams/:teamId/members/:userId
   */
  removeTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId, userId } = req.params;

      if (!teamId || !userId) {
        return res.status(400).json({
          error: "ID del equipo y ID del usuario son requeridos",
        });
      }

      await this.teamService.removeMember(teamId, userId);

      res.json({
        message: "Miembro removido del equipo exitosamente",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar rol de miembro
   * PATCH /api/teams/:teamId/members/:userId/role
   */
  updateMemberRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId, memberId: userId } = req.params;
      const { role } = req.body;

      console.log("🔍 UpdateMemberRole - Params:", { teamId, userId, role });
      console.log("🔍 UpdateMemberRole - All params:", req.params);
      console.log("🔍 UpdateMemberRole - Body:", req.body);

      if (!teamId || !userId) {
        console.log("❌ Missing params validation failed:", { teamId, userId });
        return res.status(400).json({
          error: "ID del equipo y ID del usuario son requeridos",
        });
      }

      if (!role || !["manager", "lead", "senior", "member"].includes(role)) {
        return res.status(400).json({
          error: "Rol válido es requerido (manager, lead, senior, member)",
        });
      }

      const member = await this.teamService.updateMemberRole(
        teamId,
        userId,
        role
      );

      res.json({
        message: "Rol del miembro actualizado exitosamente",
        data: member.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // OPERACIONES AVANZADAS
  // ============================================

  /**
   * Transferir liderazgo del equipo
   * POST /api/teams/:teamId/transfer-leadership
   */
  transferLeadership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId } = req.params;
      const transferDto = Object.assign(
        new TransferTeamLeadershipDto(),
        req.body
      );
      const currentUserId = req.user?.id; // Asumiendo middleware de autenticación

      if (!teamId) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      if (!currentUserId) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      // Validar DTO
      const errors = await validate(transferDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const team = await this.teamService.transferLeadership(
        teamId,
        transferDto,
        currentUserId
      );

      res.json({
        message: "Liderazgo del equipo transferido exitosamente",
        data: team.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Agregar múltiples miembros al equipo
   * POST /api/teams/:teamId/bulk-members
   */
  addBulkMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;
      const bulkMemberDto = Object.assign(new BulkTeamMemberDto(), req.body);

      if (!teamId) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      // Validar DTO
      const errors = await validate(bulkMemberDto);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        });
      }

      const members = await this.teamService.addBulkMembers(
        teamId,
        bulkMemberDto
      );

      res.status(201).json({
        message: `${members.length} miembros agregados exitosamente`,
        data: members.map((member) => member.toJSON()),
        count: members.length,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // CONSULTAS ESPECÍFICAS
  // ============================================

  /**
   * Obtener equipos del usuario autenticado
   * GET /api/teams/my-teams
   */
  getMyTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      const teams = await this.teamService.getUserTeams(userId);

      res.json({
        message: "Mis equipos obtenidos exitosamente",
        data: teams.map((team) => team.toJSON()),
        count: teams.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar membresía de usuario en equipo
   * GET /api/teams/:teamId/members/:userId/check
   */
  checkUserMembership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { teamId, userId } = req.params;

      if (!teamId || !userId) {
        return res.status(400).json({
          error: "ID del equipo y ID del usuario son requeridos",
        });
      }

      const isMember = await this.teamService.isUserInTeam(userId, teamId);
      const isManager = await this.teamService.isUserTeamManager(
        userId,
        teamId
      );

      res.json({
        message: "Estado de membresía verificado",
        data: {
          isMember,
          isManager,
          teamId,
          userId,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================

  /**
   * Obtener estadísticas de un equipo
   * GET /api/teams/:teamId/stats
   */
  getTeamStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;

      if (!teamId) {
        return res.status(400).json({
          error: "ID del equipo es requerido",
        });
      }

      const stats = await this.teamService.getTeamStats(teamId);

      res.json({
        message: "Estadísticas del equipo obtenidas exitosamente",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener estadísticas generales de equipos
   * GET /api/teams/stats/overview
   */
  getTeamsOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const query = req.query as unknown as TeamQueryDto;
      const result = await this.teamService.getAllTeams(query);

      // Calcular estadísticas generales
      const totalTeams = result.total;
      const activeTeams = result.teams.filter((t) => t.isActive).length;
      const inactiveTeams = totalTeams - activeTeams;

      let totalMembers = 0;
      let totalActiveMembers = 0;

      result.teams.forEach((team) => {
        const activeMembers = team.getActiveMembersCount();
        totalMembers += team.members?.length || 0;
        totalActiveMembers += activeMembers;
      });

      res.json({
        message: "Resumen de equipos obtenido exitosamente",
        data: {
          totalTeams,
          activeTeams,
          inactiveTeams,
          totalMembers,
          totalActiveMembers,
          averageMembersPerTeam:
            activeTeams > 0 ? Math.round(totalActiveMembers / activeTeams) : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Validar parámetros comunes
   */
  private validateCommonParams(req: Request, res: Response): boolean {
    const { teamId, userId } = req.params;

    if (req.path.includes("/teams/") && !teamId) {
      res.status(400).json({
        error: "ID del equipo es requerido",
      });
      return false;
    }

    if (
      req.path.includes("/members/") &&
      req.path.split("/").length > 5 &&
      !userId
    ) {
      res.status(400).json({
        error: "ID del usuario es requerido",
      });
      return false;
    }

    return true;
  }

  /**
   * Manejo de errores centralizado
   */
  private handleError = (error: Error, res: Response): void => {
    console.error("Error en TeamController:", error);

    // Errores conocidos
    if (error.message.includes("no encontrado")) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    if (error.message.includes("ya existe")) {
      res.status(409).json({
        error: error.message,
      });
      return;
    }

    if (error.message.includes("Errores de validación")) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: "Error interno del servidor",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  };
}
