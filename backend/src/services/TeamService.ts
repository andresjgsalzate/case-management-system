import { Repository, DataSource, SelectQueryBuilder, In, Not } from "typeorm";
import { AppDataSource } from "../config/database";
import { Team, TeamMember, UserProfile } from "../entities";
import { createError } from "../middleware/errorHandler";
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
  TeamResponseDto,
  TeamMemberResponseDto,
  TeamStatsResponseDto,
} from "../dto/team.dto";

export class TeamService {
  private teamRepository: Repository<Team>;
  private teamMemberRepository: Repository<TeamMember>;
  private userRepository: Repository<UserProfile>;

  constructor() {
    this.teamRepository = AppDataSource.getRepository(Team);
    this.teamMemberRepository = AppDataSource.getRepository(TeamMember);
    this.userRepository = AppDataSource.getRepository(UserProfile);
  }

  // ============================================
  // CRUD DE EQUIPOS
  // ============================================

  /**
   * Crear un nuevo equipo
   */
  async createTeam(createTeamDto: CreateTeamDto): Promise<Team> {
    const team = this.teamRepository.create(createTeamDto);

    // Validar datos del equipo
    const validationErrors = team.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Errores de validación: ${validationErrors.join(", ")}`);
    }

    // Verificar que el código no exista
    const existingTeam = await this.teamRepository.findOne({
      where: [{ code: createTeamDto.code }, { name: createTeamDto.name }],
    });

    if (existingTeam) {
      throw new Error("Ya existe un equipo con ese código o nombre");
    }

    // Si se especifica un manager, verificar que existe y está activo
    if (createTeamDto.managerId) {
      const manager = await this.userRepository.findOne({
        where: { id: createTeamDto.managerId, isActive: true },
      });

      if (!manager) {
        throw new Error(
          "El usuario especificado como manager no existe o no está activo"
        );
      }
    }

    try {
      const savedTeam = await this.teamRepository.save(team);

      // Si se especificó un manager, agregarlo automáticamente como miembro
      if (createTeamDto.managerId) {
        await this.addMember(savedTeam.id, {
          userId: createTeamDto.managerId,
          role: "manager",
          isActive: true,
        });
      }

      return await this.getTeamById(savedTeam.id);
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new Error("Ya existe un equipo con ese código o nombre");
      }
      throw error;
    }
  }

  /**
   * Obtener equipo por ID
   */
  async getTeamById(id: string): Promise<Team> {
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

  /**
   * Obtener todos los equipos con filtros
   */
  async getAllTeams(query: TeamQueryDto = {}): Promise<{
    teams: Team[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.createTeamQueryBuilder(query);

    // Paginación
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [teams, total] = await queryBuilder.getManyAndCount();

    // Log para debug - memberCount se calcula automáticamente via getter
    teams.forEach((team) => {
      const memberCount = team.getActiveMembersCount();
      console.log(
        `🔍 Team "${
          team.name
        }" - Calculando memberCount: ${memberCount}, members: ${
          team.members?.length || 0
        }`
      );
    });

    return {
      teams,
      total,
      page,
      limit,
    };
  }

  /**
   * Actualizar equipo
   */
  async updateTeam(id: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.getTeamById(id);

    // Verificar unicidad de código y nombre si se están cambiando
    if (updateTeamDto.code || updateTeamDto.name) {
      const conditions = [];
      if (updateTeamDto.code) conditions.push({ code: updateTeamDto.code });
      if (updateTeamDto.name) conditions.push({ name: updateTeamDto.name });

      const existingTeam = await this.teamRepository.findOne({
        where: [...conditions, { id: Not(id) }],
      });

      if (existingTeam) {
        throw new Error("Ya existe un equipo con ese código o nombre");
      }
    }

    // Si se cambia el manager, verificar que existe y está activo
    if (updateTeamDto.managerId !== undefined) {
      if (updateTeamDto.managerId) {
        const manager = await this.userRepository.findOne({
          where: { id: updateTeamDto.managerId, isActive: true },
        });

        if (!manager) {
          throw new Error(
            "El usuario especificado como manager no existe o no está activo"
          );
        }

        // Verificar que el nuevo manager sea miembro del equipo
        const membership = await this.teamMemberRepository.findOne({
          where: {
            teamId: id,
            userId: updateTeamDto.managerId,
            isActive: true,
          },
        });

        if (!membership) {
          // Agregar como miembro automáticamente
          await this.addMember(id, {
            userId: updateTeamDto.managerId,
            role: "manager",
            isActive: true,
          });
        } else if (membership.role !== "manager") {
          // Actualizar rol a manager
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

  /**
   * Eliminar equipo (elimina físicamente si no tiene miembros, sino soft delete)
   */
  async deleteTeam(id: string): Promise<{ message: string; action: string }> {
    const team = await this.getTeamById(id);

    // Verificar el número de miembros activos
    const activeMembersCount = team.getActiveMembersCount();

    if (activeMembersCount > 0) {
      // Si tiene miembros activos, solo marcar como inactivo (soft delete)
      team.isActive = false;
      await this.teamRepository.save(team);

      return {
        message: `Equipo marcado como inactivo porque tiene ${activeMembersCount} miembros activos`,
        action: "deactivated",
      };
    } else {
      // Si no tiene miembros, eliminar físicamente
      // Primero eliminar cualquier registro de miembros inactivos
      if (team.members && team.members.length > 0) {
        await this.teamMemberRepository.delete({ teamId: id });
      }

      // Luego eliminar el equipo
      await this.teamRepository.delete(id);

      return {
        message: "Equipo eliminado permanentemente ya que no tenía miembros",
        action: "deleted",
      };
    }
  }

  /**
   * Alternar estado activo/inactivo del equipo
   */
  async toggleTeamStatus(id: string): Promise<Team> {
    const team = await this.getTeamById(id);

    // Alternar el estado
    team.isActive = !team.isActive;

    return await this.teamRepository.save(team);
  }

  // ============================================
  // GESTIÓN DE MIEMBROS
  // ============================================

  /**
   * Agregar miembro al equipo
   */
  async addMember(
    teamId: string,
    addMemberDto: AddTeamMemberDto
  ): Promise<TeamMember> {
    // Verificar que el equipo existe y está activo
    const team = await this.getTeamById(teamId);
    if (!team.isActive) {
      throw new Error("No se pueden agregar miembros a un equipo inactivo");
    }

    // Verificar que el usuario existe y está activo
    const user = await this.userRepository.findOne({
      where: { id: addMemberDto.userId, isActive: true },
    });

    if (!user) {
      throw new Error("El usuario no existe o no está activo");
    }

    // Verificar que no sea ya miembro activo del equipo
    const existingMembership = await this.teamMemberRepository.findOne({
      where: {
        teamId,
        userId: addMemberDto.userId,
        isActive: true,
      },
    });

    if (existingMembership) {
      throw createError("El usuario ya es miembro activo de este equipo", 400);
    }

    // Si el rol es manager, verificar que no haya otro manager activo
    if (addMemberDto.role === "manager") {
      const existingManager = await this.teamMemberRepository.findOne({
        where: {
          teamId,
          role: "manager",
          isActive: true,
        },
      });

      if (existingManager) {
        throw createError("El equipo ya tiene un manager activo", 400);
      }
    }

    const teamMember = this.teamMemberRepository.create({
      teamId,
      ...addMemberDto,
      isActive: addMemberDto.isActive !== false, // Por defecto true, solo false si se especifica explícitamente
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
      console.error(
        "❌ Errores de validación en TeamMember:",
        validationErrors
      );
      throw createError(
        `Errores de validación: ${validationErrors.join(", ")}`,
        400
      );
    }

    const savedMember = await this.teamMemberRepository.save(teamMember);

    // Si es manager, actualizar el equipo
    if (addMemberDto.role === "manager") {
      team.managerId = addMemberDto.userId;
      await this.teamRepository.save(team);
    }

    return await this.getMemberById(savedMember.id);
  }

  /**
   * Obtener miembro por ID
   */
  async getMemberById(id: string): Promise<TeamMember> {
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

  /**
   * Obtener miembros de un equipo
   */
  async getTeamMembers(
    teamId: string,
    query: TeamMemberQueryDto = {}
  ): Promise<TeamMember[]> {
    const queryBuilder = this.teamMemberRepository
      .createQueryBuilder("tm")
      .leftJoinAndSelect("tm.user", "user")
      .leftJoinAndSelect("tm.team", "team")
      .where("tm.teamId = :teamId", { teamId });

    // Aplicar filtros
    if (query.role) {
      queryBuilder.andWhere("tm.role = :role", { role: query.role });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere("tm.isActive = :isActive", {
        isActive: query.isActive,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        "(user.fullName ILIKE :search OR user.email ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    // Ordenamiento
    const sortBy = query.sortBy || "joinedAt";
    const sortOrder = query.sortOrder || "ASC";

    if (sortBy.includes("user.")) {
      queryBuilder.orderBy(sortBy, sortOrder);
    } else {
      queryBuilder.orderBy(`tm.${sortBy}`, sortOrder);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Actualizar miembro del equipo
   */
  async updateMember(
    teamId: string,
    userId: string,
    updateMemberDto: UpdateTeamMemberDto
  ): Promise<TeamMember> {
    const member = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
      relations: { team: true, user: true },
    });

    if (!member) {
      throw new Error("Miembro no encontrado");
    }

    // Si se cambia el rol a manager, verificar que no haya otro manager
    if (updateMemberDto.role === "manager" && member.role !== "manager") {
      const existingManager = await this.teamMemberRepository.findOne({
        where: {
          teamId,
          role: "manager",
          isActive: true,
          id: Not(member.id),
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

    // Si se cambió a manager, actualizar el equipo
    if (updateMemberDto.role === "manager") {
      const team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (team) {
        team.managerId = userId;
        await this.teamRepository.save(team);
      }
    }

    return await this.getMemberById(member.id);
  }

  /**
   * Remover miembro del equipo
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    const member = await this.teamMemberRepository.findOne({
      where: { teamId, userId, isActive: true },
    });

    if (!member) {
      throw new Error("Miembro no encontrado o ya inactivo");
    }

    // Si es manager, no se puede remover sin transferir liderazgo
    if (member.role === "manager") {
      const team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (team?.managerId === userId) {
        throw new Error(
          "No se puede remover al manager del equipo. Primero transfiera el liderazgo."
        );
      }
    }

    member.deactivate();
    await this.teamMemberRepository.save(member);
  }

  /**
   * Actualizar rol de miembro
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    newRole: "manager" | "lead" | "senior" | "member"
  ): Promise<TeamMember> {
    return await this.updateMember(teamId, userId, { role: newRole });
  }

  // ============================================
  // MÉTODOS DE CONSULTA PARA PERMISOS
  // ============================================

  /**
   * Obtener equipos de un usuario
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId, isActive: true },
      relations: { team: true },
    });

    return memberships
      .map((membership) => membership.team)
      .filter((team) => team && team.isActive);
  }

  /**
   * Verificar si un usuario es miembro de un equipo
   */
  async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const membership = await this.teamMemberRepository.findOne({
      where: { userId, teamId, isActive: true },
    });

    return !!membership;
  }

  /**
   * Verificar si un usuario es manager de un equipo
   */
  async isUserTeamManager(userId: string, teamId: string): Promise<boolean> {
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

  /**
   * Obtener IDs de equipos donde el usuario tiene permisos de gestión
   */
  async getUserManagedTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.teamMemberRepository.find({
      where: {
        userId,
        role: In(["manager", "lead"]),
        isActive: true,
      },
      select: ["teamId"],
    });

    return memberships.map((membership) => membership.teamId);
  }

  // ============================================
  // OPERACIONES AVANZADAS
  // ============================================

  /**
   * Transferir liderazgo del equipo
   */
  async transferLeadership(
    teamId: string,
    transferDto: TransferTeamLeadershipDto,
    currentManagerId: string
  ): Promise<Team> {
    // Verificar que el usuario actual es manager
    const isManager = await this.isUserTeamManager(currentManagerId, teamId);
    if (!isManager) {
      throw new Error("Solo el manager actual puede transferir el liderazgo");
    }

    // Verificar que el nuevo manager es miembro del equipo
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

    // Actualizar roles
    await this.updateMemberRole(teamId, currentManagerId, "lead");
    await this.updateMemberRole(teamId, transferDto.newManagerId, "manager");

    return await this.getTeamById(teamId);
  }

  /**
   * Agregar múltiples miembros al equipo
   */
  async addBulkMembers(
    teamId: string,
    bulkMemberDto: BulkTeamMemberDto
  ): Promise<TeamMember[]> {
    const results: TeamMember[] = [];
    const errors: string[] = [];

    for (const userId of bulkMemberDto.userIds) {
      try {
        const member = await this.addMember(teamId, {
          userId,
          role: bulkMemberDto.role,
          isActive: true,
        });
        results.push(member);
      } catch (error) {
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

  // ============================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================

  /**
   * Obtener estadísticas de un equipo
   */
  async getTeamStats(teamId: string): Promise<TeamStatsResponseDto> {
    const team = await this.getTeamById(teamId);
    const members = await this.getTeamMembers(teamId, {});

    const activeMembers = members.filter((m) => m.isActive);
    const inactiveMembers = members.filter((m) => !m.isActive);

    // Calcular promedio de duración de membresía
    const durations = members
      .filter((m) => m.joinedAt)
      .map((m) => m.getMembershipDurationInDays());
    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Miembros recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJoins = members.filter(
      (m) => m.joinedAt && m.joinedAt > thirtyDaysAgo
    ).length;

    const recentLeaves = members.filter(
      (m) => m.leftAt && m.leftAt > thirtyDaysAgo
    ).length;

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

  // ============================================
  // MÉTODOS HELPER PRIVADOS
  // ============================================

  private createTeamQueryBuilder(
    query: TeamQueryDto
  ): SelectQueryBuilder<Team> {
    const queryBuilder = this.teamRepository
      .createQueryBuilder("team")
      .leftJoinAndSelect("team.manager", "manager")
      .leftJoinAndSelect("team.members", "members", "members.isActive = true")
      .leftJoinAndSelect("members.user", "memberUser");

    // Filtros
    if (query.search) {
      queryBuilder.andWhere(
        "(team.name ILIKE :search OR team.code ILIKE :search OR team.description ILIKE :search)",
        { search: `%${query.search}%` }
      );
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

    // Ordenamiento
    const sortBy = query.sortBy || "name";
    const sortOrder = query.sortOrder || "ASC";

    if (sortBy === "membersCount") {
      queryBuilder
        .addSelect("COUNT(members.id)", "membersCount")
        .groupBy("team.id, manager.id")
        .orderBy("membersCount", sortOrder);
    } else {
      queryBuilder.orderBy(`team.${sortBy}`, sortOrder);
    }

    return queryBuilder;
  }
}
