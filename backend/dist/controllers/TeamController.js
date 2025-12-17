"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamController = void 0;
const class_validator_1 = require("class-validator");
const TeamService_1 = require("../services/TeamService");
const team_dto_1 = require("../dto/team.dto");
class TeamController {
    constructor() {
        this.createTeam = async (req, res, next) => {
            try {
                const createTeamDto = Object.assign(new team_dto_1.CreateTeamDto(), req.body);
                const errors = await (0, class_validator_1.validate)(createTeamDto);
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
            }
            catch (error) {
                next(error);
            }
        };
        this.getAllTeams = async (req, res, next) => {
            try {
                const query = req.query;
                const result = await this.teamService.getAllTeams(query);
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
            }
            catch (error) {
                next(error);
            }
        };
        this.getTeamById = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.updateTeam = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateTeamDto = Object.assign(new team_dto_1.UpdateTeamDto(), req.body);
                if (!id) {
                    return res.status(400).json({
                        error: "ID del equipo es requerido",
                    });
                }
                const errors = await (0, class_validator_1.validate)(updateTeamDto);
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
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteTeam = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.toggleTeamStatus = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({
                        error: "ID del equipo es requerido",
                    });
                }
                const team = await this.teamService.toggleTeamStatus(id);
                res.json({
                    message: `Equipo ${team.isActive ? "activado" : "desactivado"} exitosamente`,
                    data: team.toJSON(),
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getTeamMembers = async (req, res, next) => {
            try {
                const { teamId } = req.params;
                const query = req.query;
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
            }
            catch (error) {
                next(error);
            }
        };
        this.addTeamMember = async (req, res, next) => {
            try {
                const { teamId } = req.params;
                const addMemberDto = Object.assign(new team_dto_1.AddTeamMemberDto(), req.body);
                if (!teamId) {
                    return res.status(400).json({
                        error: "ID del equipo es requerido",
                    });
                }
                const errors = await (0, class_validator_1.validate)(addMemberDto);
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
            }
            catch (error) {
                next(error);
            }
        };
        this.updateTeamMember = async (req, res, next) => {
            try {
                const { teamId, userId } = req.params;
                const updateMemberDto = Object.assign(new team_dto_1.UpdateTeamMemberDto(), req.body);
                if (!teamId || !userId) {
                    return res.status(400).json({
                        error: "ID del equipo y ID del usuario son requeridos",
                    });
                }
                const errors = await (0, class_validator_1.validate)(updateMemberDto);
                if (errors.length > 0) {
                    return res.status(400).json({
                        error: "Datos de entrada inválidos",
                        details: errors.map((error) => ({
                            field: error.property,
                            constraints: error.constraints,
                        })),
                    });
                }
                const member = await this.teamService.updateMember(teamId, userId, updateMemberDto);
                res.json({
                    message: "Miembro del equipo actualizado exitosamente",
                    data: member.toJSON(),
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.removeTeamMember = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.updateMemberRole = async (req, res, next) => {
            try {
                const { teamId, memberId: userId } = req.params;
                const { role } = req.body;
                if (!teamId || !userId) {
                    return res.status(400).json({
                        error: "ID del equipo y ID del usuario son requeridos",
                    });
                }
                if (!role || !["manager", "lead", "senior", "member"].includes(role)) {
                    return res.status(400).json({
                        error: "Rol válido es requerido (manager, lead, senior, member)",
                    });
                }
                const member = await this.teamService.updateMemberRole(teamId, userId, role);
                res.json({
                    message: "Rol del miembro actualizado exitosamente",
                    data: member.toJSON(),
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.transferLeadership = async (req, res, next) => {
            try {
                const { teamId } = req.params;
                const transferDto = Object.assign(new team_dto_1.TransferTeamLeadershipDto(), req.body);
                const currentUserId = req.user?.id;
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
                const errors = await (0, class_validator_1.validate)(transferDto);
                if (errors.length > 0) {
                    return res.status(400).json({
                        error: "Datos de entrada inválidos",
                        details: errors.map((error) => ({
                            field: error.property,
                            constraints: error.constraints,
                        })),
                    });
                }
                const team = await this.teamService.transferLeadership(teamId, transferDto, currentUserId);
                res.json({
                    message: "Liderazgo del equipo transferido exitosamente",
                    data: team.toJSON(),
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.addBulkMembers = async (req, res, next) => {
            try {
                const { teamId } = req.params;
                const bulkMemberDto = Object.assign(new team_dto_1.BulkTeamMemberDto(), req.body);
                if (!teamId) {
                    return res.status(400).json({
                        error: "ID del equipo es requerido",
                    });
                }
                const errors = await (0, class_validator_1.validate)(bulkMemberDto);
                if (errors.length > 0) {
                    return res.status(400).json({
                        error: "Datos de entrada inválidos",
                        details: errors.map((error) => ({
                            field: error.property,
                            constraints: error.constraints,
                        })),
                    });
                }
                const members = await this.teamService.addBulkMembers(teamId, bulkMemberDto);
                res.status(201).json({
                    message: `${members.length} miembros agregados exitosamente`,
                    data: members.map((member) => member.toJSON()),
                    count: members.length,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getMyTeams = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.checkUserMembership = async (req, res, next) => {
            try {
                const { teamId, userId } = req.params;
                if (!teamId || !userId) {
                    return res.status(400).json({
                        error: "ID del equipo y ID del usuario son requeridos",
                    });
                }
                const isMember = await this.teamService.isUserInTeam(userId, teamId);
                const isManager = await this.teamService.isUserTeamManager(userId, teamId);
                res.json({
                    message: "Estado de membresía verificado",
                    data: {
                        isMember,
                        isManager,
                        teamId,
                        userId,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getTeamStats = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.getTeamsOverview = async (req, res, next) => {
            try {
                const query = req.query;
                const result = await this.teamService.getAllTeams(query);
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
                        averageMembersPerTeam: activeTeams > 0 ? Math.round(totalActiveMembers / activeTeams) : 0,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.handleError = (error, res) => {
            console.error("Error en TeamController:", error);
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
            res.status(500).json({
                error: "Error interno del servidor",
                message: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        };
        this.teamService = new TeamService_1.TeamService();
    }
    validateCommonParams(req, res) {
        const { teamId, userId } = req.params;
        if (req.path.includes("/teams/") && !teamId) {
            res.status(400).json({
                error: "ID del equipo es requerido",
            });
            return false;
        }
        if (req.path.includes("/members/") &&
            req.path.split("/").length > 5 &&
            !userId) {
            res.status(400).json({
                error: "ID del usuario es requerido",
            });
            return false;
        }
        return true;
    }
}
exports.TeamController = TeamController;
