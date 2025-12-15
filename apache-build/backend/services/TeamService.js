"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const entities_1 = require("../entities");
const errorHandler_1 = require("../middleware/errorHandler");
class TeamService {
    constructor() {
        this.teamRepository = database_1.AppDataSource.getRepository(entities_1.Team);
        this.teamMemberRepository = database_1.AppDataSource.getRepository(entities_1.TeamMember);
        this.userRepository = database_1.AppDataSource.getRepository(entities_1.UserProfile);
    }
    async createTeam(createTeamDto) {
        const team = this.teamRepository.create(createTeamDto);
        const validationErrors = team.validate();
        if (validationErrors.length > 0) {
            throw new Error(`Errores de validación: ${validationErrors.join(", ")}`);
        }
        const existingTeam = await this.teamRepository.findOne({
            where: [{ code: createTeamDto.code }, { name: createTeamDto.name }],
        });
        if (existingTeam) {
            throw new Error("Ya existe un equipo con ese código o nombre");
        }
        if (createTeamDto.managerId) {
            const manager = await this.userRepository.findOne({
                where: { id: createTeamDto.managerId, isActive: true },
            });
            if (!manager) {
                throw new Error("El usuario especificado como manager no existe o no está activo");
            }
        }
        try {
            const savedTeam = await this.teamRepository.save(team);
            if (createTeamDto.managerId) {
                await this.addMember(savedTeam.id, {
                    userId: createTeamDto.managerId,
                    role: "manager",
                    isActive: true,
                });
            }
            return await this.getTeamById(savedTeam.id);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("duplicate key")) {
                throw new Error("Ya existe un equipo con ese código o nombre");
            }
            throw error;
        }
    }
    async getTeamById(id) {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                manager: true,
                members: {
                    user: true,
                },
            },
        });
        if (!team) {
            throw new Error("Equipo no encontrado");
        }
        return team;
    }
    async getAllTeams(query = {}) {
        const queryBuilder = this.createTeamQueryBuilder(query);
        const page = parseInt(query.page || "1");
        const limit = parseInt(query.limit || "20");
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [teams, total] = await queryBuilder.getManyAndCount();
        teams.forEach((team) => {
            const memberCount = team.getActiveMembersCount();
            console.log(`🔍 Team "${team.name}" - Calculando memberCount: ${memberCount}, members: ${team.members?.length || 0}`);
        });
        return {
            teams,
            total,
            page,
            limit,
        };
    }
    async updateTeam(id, updateTeamDto) {
        const team = await this.getTeamById(id);
        if (updateTeamDto.code || updateTeamDto.name) {
            const conditions = [];
            if (updateTeamDto.code)
                conditions.push({ code: updateTeamDto.code });
            if (updateTeamDto.name)
                conditions.push({ name: updateTeamDto.name });
            const existingTeam = await this.teamRepository.findOne({
                where: [...conditions, { id: (0, typeorm_1.Not)(id) }],
            });
            if (existingTeam) {
                throw new Error("Ya existe un equipo con ese código o nombre");
            }
        }
        if (updateTeamDto.managerId !== undefined) {
            if (updateTeamDto.managerId) {
                const manager = await this.userRepository.findOne({
                    where: { id: updateTeamDto.managerId, isActive: true },
                });
                if (!manager) {
                    throw new Error("El usuario especificado como manager no existe o no está activo");
                }
                const membership = await this.teamMemberRepository.findOne({
                    where: {
                        teamId: id,
                        userId: updateTeamDto.managerId,
                        isActive: true,
                    },
                });
                if (!membership) {
                    await this.addMember(id, {
                        userId: updateTeamDto.managerId,
                        role: "manager",
                        isActive: true,
                    });
                }
                else if (membership.role !== "manager") {
                    await this.updateMemberRole(id, updateTeamDto.managerId, "manager");
                }
            }
        }
        Object.assign(team, updateTeamDto);
        const validationErrors = team.validate();
        if (validationErrors.length > 0) {
            throw new Error(`Errores de validación: ${validationErrors.join(", ")}`);
        }
        await this.teamRepository.save(team);
        return await this.getTeamById(id);
    }
    async deleteTeam(id) {
        const team = await this.getTeamById(id);
        const activeMembersCount = team.getActiveMembersCount();
        if (activeMembersCount > 0) {
            team.isActive = false;
            await this.teamRepository.save(team);
            return {
                message: `Equipo marcado como inactivo porque tiene ${activeMembersCount} miembros activos`,
                action: "deactivated",
            };
        }
        else {
            if (team.members && team.members.length > 0) {
                await this.teamMemberRepository.delete({ teamId: id });
            }
            await this.teamRepository.delete(id);
            return {
                message: "Equipo eliminado permanentemente ya que no tenía miembros",
                action: "deleted",
            };
        }
    }
    async toggleTeamStatus(id) {
        const team = await this.getTeamById(id);
        team.isActive = !team.isActive;
        return await this.teamRepository.save(team);
    }
    async addMember(teamId, addMemberDto) {
        const team = await this.getTeamById(teamId);
        if (!team.isActive) {
            throw new Error("No se pueden agregar miembros a un equipo inactivo");
        }
        const user = await this.userRepository.findOne({
            where: { id: addMemberDto.userId, isActive: true },
        });
        if (!user) {
            throw new Error("El usuario no existe o no está activo");
        }
        const existingMembership = await this.teamMemberRepository.findOne({
            where: {
                teamId,
                userId: addMemberDto.userId,
                isActive: true,
            },
        });
        if (existingMembership) {
            throw (0, errorHandler_1.createError)("El usuario ya es miembro activo de este equipo", 400);
        }
        if (addMemberDto.role === "manager") {
            const existingManager = await this.teamMemberRepository.findOne({
                where: {
                    teamId,
                    role: "manager",
                    isActive: true,
                },
            });
            if (existingManager) {
                throw (0, errorHandler_1.createError)("El equipo ya tiene un manager activo", 400);
            }
        }
        const teamMember = this.teamMemberRepository.create({
            teamId,
            ...addMemberDto,
            isActive: addMemberDto.isActive !== false,
            joinedAt: new Date(),
        });
        console.log("🔍 Debug - Datos del nuevo miembro antes de validar:", {
            teamId,
            userId: addMemberDto.userId,
            role: addMemberDto.role,
            isActive: teamMember.isActive,
            leftAt: teamMember.leftAt,
            joinedAt: teamMember.joinedAt,
        });
        const validationErrors = teamMember.validate();
        if (validationErrors.length > 0) {
            console.error("❌ Errores de validación en TeamMember:", validationErrors);
            throw (0, errorHandler_1.createError)(`Errores de validación: ${validationErrors.join(", ")}`, 400);
        }
        const savedMember = await this.teamMemberRepository.save(teamMember);
        if (addMemberDto.role === "manager") {
            team.managerId = addMemberDto.userId;
            await this.teamRepository.save(team);
        }
        return await this.getMemberById(savedMember.id);
    }
    async getMemberById(id) {
        const member = await this.teamMemberRepository.findOne({
            where: { id },
            relations: {
                user: true,
                team: true,
            },
        });
        if (!member) {
            throw new Error("Miembro no encontrado");
        }
        return member;
    }
    async getTeamMembers(teamId, query = {}) {
        const queryBuilder = this.teamMemberRepository
            .createQueryBuilder("tm")
            .leftJoinAndSelect("tm.user", "user")
            .leftJoinAndSelect("tm.team", "team")
            .where("tm.teamId = :teamId", { teamId });
        if (query.role) {
            queryBuilder.andWhere("tm.role = :role", { role: query.role });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere("tm.isActive = :isActive", {
                isActive: query.isActive,
            });
        }
        if (query.search) {
            queryBuilder.andWhere("(user.fullName ILIKE :search OR user.email ILIKE :search)", { search: `%${query.search}%` });
        }
        const sortBy = query.sortBy || "joinedAt";
        const sortOrder = query.sortOrder || "ASC";
        if (sortBy.includes("user.")) {
            queryBuilder.orderBy(sortBy, sortOrder);
        }
        else {
            queryBuilder.orderBy(`tm.${sortBy}`, sortOrder);
        }
        return await queryBuilder.getMany();
    }
    async updateMember(teamId, userId, updateMemberDto) {
        const member = await this.teamMemberRepository.findOne({
            where: { teamId, userId },
            relations: { team: true, user: true },
        });
        if (!member) {
            throw new Error("Miembro no encontrado");
        }
        if (updateMemberDto.role === "manager" && member.role !== "manager") {
            const existingManager = await this.teamMemberRepository.findOne({
                where: {
                    teamId,
                    role: "manager",
                    isActive: true,
                    id: (0, typeorm_1.Not)(member.id),
                },
            });
            if (existingManager) {
                throw new Error("El equipo ya tiene un manager activo");
            }
        }
        Object.assign(member, updateMemberDto);
        const validationErrors = member.validate();
        if (validationErrors.length > 0) {
            throw new Error(`Errores de validación: ${validationErrors.join(", ")}`);
        }
        await this.teamMemberRepository.save(member);
        if (updateMemberDto.role === "manager") {
            const team = await this.teamRepository.findOne({ where: { id: teamId } });
            if (team) {
                team.managerId = userId;
                await this.teamRepository.save(team);
            }
        }
        return await this.getMemberById(member.id);
    }
    async removeMember(teamId, userId) {
        const member = await this.teamMemberRepository.findOne({
            where: { teamId, userId, isActive: true },
        });
        if (!member) {
            throw new Error("Miembro no encontrado o ya inactivo");
        }
        if (member.role === "manager") {
            const team = await this.teamRepository.findOne({ where: { id: teamId } });
            if (team?.managerId === userId) {
                throw new Error("No se puede remover al manager del equipo. Primero transfiera el liderazgo.");
            }
        }
        member.deactivate();
        await this.teamMemberRepository.save(member);
    }
    async updateMemberRole(teamId, userId, newRole) {
        return await this.updateMember(teamId, userId, { role: newRole });
    }
    async getUserTeams(userId) {
        const memberships = await this.teamMemberRepository.find({
            where: { userId, isActive: true },
            relations: { team: true },
        });
        return memberships
            .map((membership) => membership.team)
            .filter((team) => team && team.isActive);
    }
    async isUserInTeam(userId, teamId) {
        const membership = await this.teamMemberRepository.findOne({
            where: { userId, teamId, isActive: true },
        });
        return !!membership;
    }
    async isUserTeamManager(userId, teamId) {
        const membership = await this.teamMemberRepository.findOne({
            where: {
                userId,
                teamId,
                role: "manager",
                isActive: true,
            },
        });
        return !!membership;
    }
    async getUserManagedTeamIds(userId) {
        const memberships = await this.teamMemberRepository.find({
            where: {
                userId,
                role: (0, typeorm_1.In)(["manager", "lead"]),
                isActive: true,
            },
            select: ["teamId"],
        });
        return memberships.map((membership) => membership.teamId);
    }
    async transferLeadership(teamId, transferDto, currentManagerId) {
        const isManager = await this.isUserTeamManager(currentManagerId, teamId);
        if (!isManager) {
            throw new Error("Solo el manager actual puede transferir el liderazgo");
        }
        const newManagerMembership = await this.teamMemberRepository.findOne({
            where: {
                teamId,
                userId: transferDto.newManagerId,
                isActive: true,
            },
        });
        if (!newManagerMembership) {
            throw new Error("El nuevo manager debe ser miembro activo del equipo");
        }
        await this.updateMemberRole(teamId, currentManagerId, "lead");
        await this.updateMemberRole(teamId, transferDto.newManagerId, "manager");
        return await this.getTeamById(teamId);
    }
    async addBulkMembers(teamId, bulkMemberDto) {
        const results = [];
        const errors = [];
        for (const userId of bulkMemberDto.userIds) {
            try {
                const member = await this.addMember(teamId, {
                    userId,
                    role: bulkMemberDto.role,
                    isActive: true,
                });
                results.push(member);
            }
            catch (error) {
                if (error instanceof Error) {
                    errors.push(`Usuario ${userId}: ${error.message}`);
                }
            }
        }
        if (errors.length > 0 && results.length === 0) {
            throw new Error(`Errores al agregar miembros: ${errors.join("; ")}`);
        }
        return results;
    }
    async getTeamStats(teamId) {
        const team = await this.getTeamById(teamId);
        const members = await this.getTeamMembers(teamId, {});
        const activeMembers = members.filter((m) => m.isActive);
        const inactiveMembers = members.filter((m) => !m.isActive);
        const durations = members
            .filter((m) => m.joinedAt)
            .map((m) => m.getMembershipDurationInDays());
        const averageDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentJoins = members.filter((m) => m.joinedAt && m.joinedAt > thirtyDaysAgo).length;
        const recentLeaves = members.filter((m) => m.leftAt && m.leftAt > thirtyDaysAgo).length;
        return {
            teamId: team.id,
            teamName: team.name,
            teamCode: team.code,
            totalMembers: members.length,
            activeMembers: activeMembers.length,
            inactiveMembers: inactiveMembers.length,
            membersByRole: {
                managers: activeMembers.filter((m) => m.role === "manager").length,
                leads: activeMembers.filter((m) => m.role === "lead").length,
                seniors: activeMembers.filter((m) => m.role === "senior").length,
                members: activeMembers.filter((m) => m.role === "member").length,
            },
            averageMembershipDuration: Math.round(averageDuration),
            recentJoins,
            recentLeaves,
            isActive: team.isActive,
        };
    }
    createTeamQueryBuilder(query) {
        const queryBuilder = this.teamRepository
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.manager", "manager")
            .leftJoinAndSelect("team.members", "members", "members.isActive = true")
            .leftJoinAndSelect("members.user", "memberUser");
        if (query.search) {
            queryBuilder.andWhere("(team.name ILIKE :search OR team.code ILIKE :search OR team.description ILIKE :search)", { search: `%${query.search}%` });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere("team.isActive = :isActive", {
                isActive: query.isActive,
            });
        }
        if (query.managerId) {
            queryBuilder.andWhere("team.managerId = :managerId", {
                managerId: query.managerId,
            });
        }
        if (query.code) {
            queryBuilder.andWhere("team.code = :code", { code: query.code });
        }
        const sortBy = query.sortBy || "name";
        const sortOrder = query.sortOrder || "ASC";
        if (sortBy === "membersCount") {
            queryBuilder
                .addSelect("COUNT(members.id)", "membersCount")
                .groupBy("team.id, manager.id")
                .orderBy("membersCount", sortOrder);
        }
        else {
            queryBuilder.orderBy(`team.${sortBy}`, sortOrder);
        }
        return queryBuilder;
    }
}
exports.TeamService = TeamService;
