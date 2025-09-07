import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ArchivedCase } from "../entities/archive/ArchivedCase.entity";
import { ArchivedTodo } from "../entities/archive/ArchivedTodo.entity";
import { UserProfile } from "../entities/UserProfile";
import {
  CreateArchivedCaseDto,
  CreateArchivedTodoDto,
  RestoreArchivedItemDto,
  DeleteArchivedItemDto,
  ArchiveStatsDto,
  ArchiveFiltersDto,
  ArchivedCaseResponseDto,
  ArchivedTodoResponseDto,
  ArchivedItemResponseDto,
} from "../dto/archive.dto";

@Injectable()
export class ArchiveService {
  constructor(
    @InjectRepository(ArchivedCase)
    private archivedCaseRepository: Repository<ArchivedCase>,

    @InjectRepository(ArchivedTodo)
    private archivedTodoRepository: Repository<ArchivedTodo>,

    @InjectRepository(UserProfile)
    private userRepository: Repository<UserProfile>
  ) {}

  // =============================================
  // MÉTODOS PARA CASOS ARCHIVADOS
  // =============================================

  /**
   * Crear un caso archivado
   */
  async archiveCase(
    createDto: CreateArchivedCaseDto,
    archivedBy: string
  ): Promise<ArchivedCaseResponseDto> {
    try {
      // Verificar que no esté ya archivado
      const existingArchive = await this.archivedCaseRepository.findOne({
        where: { originalCaseId: createDto.originalCaseId },
      });

      if (existingArchive) {
        throw new BadRequestException("Este caso ya está archivado");
      }

      // Crear el caso archivado
      const archivedCase = this.archivedCaseRepository.create({
        ...createDto,
        archivedBy,
        archivedAt: new Date(),
      });

      const savedCase = await this.archivedCaseRepository.save(archivedCase);
      return this.mapArchivedCaseToDto(savedCase);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        "Error al archivar el caso: " + error.message
      );
    }
  }

  /**
   * Obtener casos archivados con filtros
   */
  async getArchivedCases(
    filters: ArchiveFiltersDto,
    userId: string
  ): Promise<ArchivedCaseResponseDto[]> {
    try {
      const query = this.archivedCaseRepository
        .createQueryBuilder("ac")
        .leftJoinAndSelect("ac.user", "user")
        .leftJoinAndSelect("ac.assignedUser", "assignedUser")
        .leftJoinAndSelect("ac.archivedByUser", "archivedByUser")
        .leftJoinAndSelect("ac.restoredByUser", "restoredByUser");

      // Filtrar por permisos del usuario (solo puede ver casos relacionados con él)
      query.where(
        "(ac.userId = :userId OR ac.assignedUserId = :userId OR ac.archivedBy = :userId OR ac.createdByUserId = :userId)",
        { userId }
      );

      // Aplicar filtros
      if (filters.archivedBy) {
        query.andWhere("ac.archivedBy = :archivedBy", {
          archivedBy: filters.archivedBy,
        });
      }

      if (filters.dateFrom) {
        query.andWhere("ac.archivedAt >= :dateFrom", {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters.dateTo) {
        query.andWhere("ac.archivedAt <= :dateTo", { dateTo: filters.dateTo });
      }

      if (filters.classification) {
        query.andWhere("ac.classification = :classification", {
          classification: filters.classification,
        });
      }

      if (filters.priority) {
        query.andWhere("ac.priority = :priority", {
          priority: filters.priority,
        });
      }

      if (filters.search) {
        query.andWhere(
          "(ac.caseNumber ILIKE :search OR ac.title ILIKE :search OR ac.description ILIKE :search)",
          { search: `%${filters.search}%` }
        );
      }

      if (filters.showRestored !== undefined) {
        query.andWhere("ac.isRestored = :showRestored", {
          showRestored: filters.showRestored,
        });
      }

      // Ordenar por fecha de archivo (más recientes primero)
      query.orderBy("ac.archivedAt", "DESC");

      // Paginación
      if (filters.limit) {
        query.limit(filters.limit);
      }
      if (filters.offset) {
        query.offset(filters.offset);
      }

      const cases = await query.getMany();
      return Promise.all(cases.map((c) => this.mapArchivedCaseToDto(c)));
    } catch (error) {
      throw new BadRequestException(
        "Error al obtener casos archivados: " + error.message
      );
    }
  }

  /**
   * Restaurar un caso archivado
   */
  async restoreCase(
    id: string,
    restoreDto: RestoreArchivedItemDto,
    userId: string
  ): Promise<ArchivedCaseResponseDto> {
    try {
      const archivedCase = await this.archivedCaseRepository.findOne({
        where: { id },
        relations: ["user", "assignedUser", "archivedByUser"],
      });

      if (!archivedCase) {
        throw new NotFoundException("Caso archivado no encontrado");
      }

      // Verificar permisos de restauración
      if (
        archivedCase.userId !== userId &&
        archivedCase.assignedUserId !== userId &&
        archivedCase.archivedBy !== userId
      ) {
        throw new ForbiddenException(
          "No tienes permisos para restaurar este caso"
        );
      }

      if (archivedCase.isRestored) {
        throw new BadRequestException("Este caso ya está restaurado");
      }

      // Actualizar el caso como restaurado
      archivedCase.isRestored = true;
      archivedCase.restoredAt = new Date();
      archivedCase.restoredBy = userId;

      const restoredCase = await this.archivedCaseRepository.save(archivedCase);
      return this.mapArchivedCaseToDto(restoredCase);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Error al restaurar el caso: " + error.message
      );
    }
  }

  // =============================================
  // MÉTODOS PARA TODOS ARCHIVADOS
  // =============================================

  /**
   * Crear un TODO archivado
   */
  async archiveTodo(
    createDto: CreateArchivedTodoDto,
    archivedBy: string
  ): Promise<ArchivedTodoResponseDto> {
    try {
      // Verificar que no esté ya archivado
      const existingArchive = await this.archivedTodoRepository.findOne({
        where: { originalTodoId: createDto.originalTodoId },
      });

      if (existingArchive) {
        throw new BadRequestException("Este TODO ya está archivado");
      }

      // Crear el TODO archivado
      const archivedTodo = this.archivedTodoRepository.create({
        ...createDto,
        archivedBy,
        archivedAt: new Date(),
      });

      const savedTodo = await this.archivedTodoRepository.save(archivedTodo);
      return this.mapArchivedTodoToDto(savedTodo);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        "Error al archivar el TODO: " + error.message
      );
    }
  }

  /**
   * Obtener TODOs archivados con filtros
   */
  async getArchivedTodos(
    filters: ArchiveFiltersDto,
    userId: string
  ): Promise<ArchivedTodoResponseDto[]> {
    try {
      const query = this.archivedTodoRepository
        .createQueryBuilder("at")
        .leftJoinAndSelect("at.createdByUser", "createdByUser")
        .leftJoinAndSelect("at.assignedUser", "assignedUser")
        .leftJoinAndSelect("at.archivedByUser", "archivedByUser")
        .leftJoinAndSelect("at.restoredByUser", "restoredByUser");

      // Filtrar por permisos del usuario
      query.where(
        "(at.createdByUserId = :userId OR at.assignedUserId = :userId OR at.archivedBy = :userId)",
        { userId }
      );

      // Aplicar filtros
      if (filters.archivedBy) {
        query.andWhere("at.archivedBy = :archivedBy", {
          archivedBy: filters.archivedBy,
        });
      }

      if (filters.dateFrom) {
        query.andWhere("at.archivedAt >= :dateFrom", {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters.dateTo) {
        query.andWhere("at.archivedAt <= :dateTo", { dateTo: filters.dateTo });
      }

      if (filters.priority) {
        query.andWhere("at.priority = :priority", {
          priority: filters.priority,
        });
      }

      if (filters.search) {
        query.andWhere(
          "(at.title ILIKE :search OR at.description ILIKE :search)",
          { search: `%${filters.search}%` }
        );
      }

      if (filters.showRestored !== undefined) {
        query.andWhere("at.isRestored = :showRestored", {
          showRestored: filters.showRestored,
        });
      }

      // Ordenar por fecha de archivo (más recientes primero)
      query.orderBy("at.archivedAt", "DESC");

      // Paginación
      if (filters.limit) {
        query.limit(filters.limit);
      }
      if (filters.offset) {
        query.offset(filters.offset);
      }

      const todos = await query.getMany();
      return Promise.all(todos.map((t) => this.mapArchivedTodoToDto(t)));
    } catch (error) {
      throw new BadRequestException(
        "Error al obtener TODOs archivados: " + error.message
      );
    }
  }

  /**
   * Restaurar un TODO archivado
   */
  async restoreTodo(
    id: string,
    restoreDto: RestoreArchivedItemDto,
    userId: string
  ): Promise<ArchivedTodoResponseDto> {
    try {
      const archivedTodo = await this.archivedTodoRepository.findOne({
        where: { id },
        relations: ["createdByUser", "assignedUser", "archivedByUser"],
      });

      if (!archivedTodo) {
        throw new NotFoundException("TODO archivado no encontrado");
      }

      // Verificar permisos de restauración
      if (
        archivedTodo.createdByUserId !== userId &&
        archivedTodo.assignedUserId !== userId &&
        archivedTodo.archivedBy !== userId
      ) {
        throw new ForbiddenException(
          "No tienes permisos para restaurar este TODO"
        );
      }

      if (archivedTodo.isRestored) {
        throw new BadRequestException("Este TODO ya está restaurado");
      }

      // Actualizar el TODO como restaurado
      archivedTodo.isRestored = true;
      archivedTodo.restoredAt = new Date();
      archivedTodo.restoredBy = userId;

      const restoredTodo = await this.archivedTodoRepository.save(archivedTodo);
      return this.mapArchivedTodoToDto(restoredTodo);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Error al restaurar el TODO: " + error.message
      );
    }
  }

  // =============================================
  // MÉTODOS GENERALES
  // =============================================

  /**
   * Obtener elementos archivados combinados
   */
  async getArchivedItems(
    filters: ArchiveFiltersDto,
    userId: string
  ): Promise<ArchivedItemResponseDto[]> {
    try {
      const items: ArchivedItemResponseDto[] = [];

      // Obtener casos archivados si corresponde
      if (!filters.type || filters.type === "cases" || filters.type === "all") {
        const cases = await this.getArchivedCases(filters, userId);
        items.push(...cases.map((c) => this.mapCaseToArchivedItem(c)));
      }

      // Obtener TODOs archivados si corresponde
      if (!filters.type || filters.type === "todos" || filters.type === "all") {
        const todos = await this.getArchivedTodos(filters, userId);
        items.push(...todos.map((t) => this.mapTodoToArchivedItem(t)));
      }

      // Ordenar por fecha de archivo (más recientes primero)
      items.sort(
        (a, b) =>
          new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      );

      return items;
    } catch (error) {
      throw new BadRequestException(
        "Error al obtener elementos archivados: " + error.message
      );
    }
  }

  /**
   * Obtener estadísticas del archivo
   */
  async getArchiveStats(userId: string): Promise<ArchiveStatsDto> {
    try {
      // Usar la función SQL personalizada
      const result = await this.archivedCaseRepository.query(
        "SELECT get_archive_stats($1) as stats",
        [userId]
      );

      if (result && result[0] && result[0].stats) {
        return {
          totalArchivedCases: result[0].stats.totalArchivedCases || 0,
          totalArchivedTodos: result[0].stats.totalArchivedTodos || 0,
          totalArchivedTimeMinutes:
            result[0].stats.totalArchivedTimeMinutes || 0,
          archivedThisMonth: result[0].stats.archivedThisMonth || 0,
          restoredThisMonth: result[0].stats.restoredThisMonth || 0,
        };
      }

      // Fallback en caso de que la función SQL falle
      return {
        totalArchivedCases: 0,
        totalArchivedTodos: 0,
        totalArchivedTimeMinutes: 0,
        archivedThisMonth: 0,
        restoredThisMonth: 0,
      };
    } catch (error) {
      throw new BadRequestException(
        "Error al obtener estadísticas del archivo: " + error.message
      );
    }
  }

  /**
   * Eliminar permanentemente un caso archivado
   */
  async deleteArchivedCase(
    id: string,
    deleteDto: DeleteArchivedItemDto,
    userId: string
  ): Promise<void> {
    try {
      const archivedCase = await this.archivedCaseRepository.findOne({
        where: { id },
      });

      if (!archivedCase) {
        throw new NotFoundException("Caso archivado no encontrado");
      }

      // Solo administradores pueden eliminar permanentemente
      // En una implementación real, verificarías los roles aquí

      await this.archivedCaseRepository.remove(archivedCase);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        "Error al eliminar el caso: " + error.message
      );
    }
  }

  /**
   * Eliminar permanentemente un TODO archivado
   */
  async deleteArchivedTodo(
    id: string,
    deleteDto: DeleteArchivedItemDto,
    userId: string
  ): Promise<void> {
    try {
      const archivedTodo = await this.archivedTodoRepository.findOne({
        where: { id },
      });

      if (!archivedTodo) {
        throw new NotFoundException("TODO archivado no encontrado");
      }

      await this.archivedTodoRepository.remove(archivedTodo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        "Error al eliminar el TODO: " + error.message
      );
    }
  }

  // =============================================
  // MÉTODOS AUXILIARES DE MAPEO
  // =============================================

  private async mapArchivedCaseToDto(
    archivedCase: ArchivedCase
  ): Promise<ArchivedCaseResponseDto> {
    const user = await archivedCase.user;
    const assignedUser = archivedCase.assignedUserId
      ? await archivedCase.assignedUser
      : null;
    const archivedByUser = await archivedCase.archivedByUser;
    const restoredByUser = archivedCase.restoredBy
      ? await archivedCase.restoredByUser
      : null;

    return {
      id: archivedCase.id,
      originalCaseId: archivedCase.originalCaseId,
      caseNumber: archivedCase.caseNumber,
      title: archivedCase.title,
      description: archivedCase.description,
      status: archivedCase.status,
      priority: archivedCase.priority,
      classification: archivedCase.classification,
      userId: archivedCase.userId,
      assignedUserId: archivedCase.assignedUserId,
      createdByUserId: archivedCase.createdByUserId,
      originalCreatedAt: archivedCase.originalCreatedAt.toISOString(),
      originalUpdatedAt: archivedCase.originalUpdatedAt.toISOString(),
      completedAt: archivedCase.completedAt?.toISOString(),
      archivedAt: archivedCase.archivedAt.toISOString(),
      archivedBy: archivedCase.archivedBy,
      archiveReason: archivedCase.archiveReason,
      restoredAt: archivedCase.restoredAt?.toISOString(),
      restoredBy: archivedCase.restoredBy,
      isRestored: archivedCase.isRestored,
      totalTimeMinutes: archivedCase.totalTimeMinutes,
      createdAt: archivedCase.createdAt.toISOString(),
      updatedAt: archivedCase.updatedAt.toISOString(),
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          }
        : undefined,
      assignedUser: assignedUser
        ? {
            id: assignedUser.id,
            fullName: assignedUser.fullName,
            email: assignedUser.email,
          }
        : undefined,
      archivedByUser: archivedByUser
        ? {
            id: archivedByUser.id,
            fullName: archivedByUser.fullName,
            email: archivedByUser.email,
          }
        : undefined,
      restoredByUser: restoredByUser
        ? {
            id: restoredByUser.id,
            fullName: restoredByUser.fullName,
            email: restoredByUser.email,
          }
        : undefined,
    };
  }

  private async mapArchivedTodoToDto(
    archivedTodo: ArchivedTodo
  ): Promise<ArchivedTodoResponseDto> {
    const createdByUser = await archivedTodo.createdByUser;
    const assignedUser = archivedTodo.assignedUserId
      ? await archivedTodo.assignedUser
      : null;
    const archivedByUser = await archivedTodo.archivedByUser;
    const restoredByUser = archivedTodo.restoredBy
      ? await archivedTodo.restoredByUser
      : null;

    return {
      id: archivedTodo.id,
      originalTodoId: archivedTodo.originalTodoId,
      title: archivedTodo.title,
      description: archivedTodo.description,
      priority: archivedTodo.priority,
      category: archivedTodo.category,
      isCompleted: archivedTodo.isCompleted,
      dueDate: archivedTodo.dueDate?.toISOString(),
      originalCreatedAt: archivedTodo.originalCreatedAt.toISOString(),
      originalUpdatedAt: archivedTodo.originalUpdatedAt.toISOString(),
      completedAt: archivedTodo.completedAt?.toISOString(),
      createdByUserId: archivedTodo.createdByUserId,
      assignedUserId: archivedTodo.assignedUserId,
      caseId: archivedTodo.caseId,
      archivedAt: archivedTodo.archivedAt.toISOString(),
      archivedBy: archivedTodo.archivedBy,
      archiveReason: archivedTodo.archiveReason,
      restoredAt: archivedTodo.restoredAt?.toISOString(),
      restoredBy: archivedTodo.restoredBy,
      isRestored: archivedTodo.isRestored,
      totalTimeMinutes: archivedTodo.totalTimeMinutes,
      createdAt: archivedTodo.createdAt.toISOString(),
      updatedAt: archivedTodo.updatedAt.toISOString(),
      createdByUser: createdByUser
        ? {
            id: createdByUser.id,
            fullName: createdByUser.fullName,
            email: createdByUser.email,
          }
        : undefined,
      assignedUser: assignedUser
        ? {
            id: assignedUser.id,
            fullName: assignedUser.fullName,
            email: assignedUser.email,
          }
        : undefined,
      archivedByUser: archivedByUser
        ? {
            id: archivedByUser.id,
            fullName: archivedByUser.fullName,
            email: archivedByUser.email,
          }
        : undefined,
      restoredByUser: restoredByUser
        ? {
            id: restoredByUser.id,
            fullName: restoredByUser.fullName,
            email: restoredByUser.email,
          }
        : undefined,
    };
  }

  private mapCaseToArchivedItem(
    archivedCase: ArchivedCaseResponseDto
  ): ArchivedItemResponseDto {
    return {
      id: archivedCase.id,
      itemType: "case",
      title: archivedCase.title,
      description: archivedCase.description,
      archivedAt: archivedCase.archivedAt,
      archivedBy: archivedCase.archivedBy,
      isRestored: archivedCase.isRestored,
      totalTimeMinutes: archivedCase.totalTimeMinutes,
      caseNumber: archivedCase.caseNumber,
      status: archivedCase.status,
      classification: archivedCase.classification,
      archivedByUser: archivedCase.archivedByUser,
    };
  }

  private mapTodoToArchivedItem(
    archivedTodo: ArchivedTodoResponseDto
  ): ArchivedItemResponseDto {
    return {
      id: archivedTodo.id,
      itemType: "todo",
      title: archivedTodo.title,
      description: archivedTodo.description,
      archivedAt: archivedTodo.archivedAt,
      archivedBy: archivedTodo.archivedBy,
      isRestored: archivedTodo.isRestored,
      totalTimeMinutes: archivedTodo.totalTimeMinutes,
      priority: archivedTodo.priority,
      category: archivedTodo.category,
      isCompleted: archivedTodo.isCompleted,
      archivedByUser: archivedTodo.archivedByUser,
    };
  }
}
