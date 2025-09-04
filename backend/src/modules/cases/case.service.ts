import { Repository, SelectQueryBuilder, ILike } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Case } from "../../entities/Case";
import { UserProfile } from "../../entities/UserProfile";
import { Origin } from "../../entities/Origin";
import { Application } from "../../entities/Application";
import {
  CreateCaseDto,
  UpdateCaseDto,
  CaseFiltersDto,
  CaseResponse,
} from "./case.dto";
import { createError } from "../../middleware/errorHandler";

export class CaseService {
  private caseRepository: Repository<Case>;
  private userRepository: Repository<UserProfile>;
  private originRepository: Repository<Origin>;
  private applicationRepository: Repository<Application>;

  constructor() {
    this.caseRepository = AppDataSource.getRepository(Case);
    this.userRepository = AppDataSource.getRepository(UserProfile);
    this.originRepository = AppDataSource.getRepository(Origin);
    this.applicationRepository = AppDataSource.getRepository(Application);
  }

  async createCase(
    createCaseDto: CreateCaseDto,
    userId: string
  ): Promise<CaseResponse> {
    // Verificar que el número de caso no exista
    const existingCase = await this.caseRepository.findOne({
      where: { numeroCaso: createCaseDto.numeroCaso },
    });

    if (existingCase) {
      throw createError("Ya existe un caso con este número", 400);
    }

    // Verificar que el usuario existe - Temporal: comentado hasta tener auth
    // const user = await this.userRepository.findOne({
    //   where: { id: userId },
    // });

    // if (!user) {
    //   throw createError("Usuario no encontrado", 404);
    // }

    // Verificar origen si se proporciona
    if (createCaseDto.originId) {
      const origin = await this.originRepository.findOne({
        where: { id: createCaseDto.originId, activo: true },
      });
      if (!origin) {
        throw createError("Origen no encontrado o inactivo", 404);
      }
    }

    // Verificar aplicación si se proporciona
    if (createCaseDto.applicationId) {
      const application = await this.applicationRepository.findOne({
        where: { id: createCaseDto.applicationId, activo: true },
      });
      if (!application) {
        throw createError("Aplicación no encontrada o inactiva", 404);
      }
    }

    // Crear el caso - temporal sin userId real
    const newCase = this.caseRepository.create({
      ...createCaseDto,
      fecha: new Date(createCaseDto.fecha),
      // userId, // Comentado temporalmente
    });

    // Calcular puntuación y clasificación antes de guardar
    newCase.calculateScoring();

    const savedCase = await this.caseRepository.save(newCase);

    return this.mapCaseToResponse(savedCase);
  }

  async getCases(
    filters: CaseFiltersDto,
    userId?: string
  ): Promise<CaseResponse[]> {
    const queryBuilder = this.caseRepository
      .createQueryBuilder("case")
      .leftJoinAndSelect("case.origin", "origin")
      .leftJoinAndSelect("case.application", "application")
      .leftJoinAndSelect("case.user", "user")
      .leftJoinAndSelect("case.assignedTo", "assignedTo");

    // Aplicar filtros
    this.applyFilters(queryBuilder, filters);

    // Ordenar por fecha de creación más reciente
    queryBuilder.orderBy("case.createdAt", "DESC");

    const cases = await queryBuilder.getMany();
    return cases.map(this.mapCaseToResponse);
  }

  async getCaseById(id: string, userId?: string): Promise<CaseResponse> {
    const caseEntity = await this.caseRepository.findOne({
      where: { id },
      relations: ["origin", "application", "user", "assignedTo"],
    });

    if (!caseEntity) {
      throw createError("Caso no encontrado", 404);
    }

    return this.mapCaseToResponse(caseEntity);
  }

  async updateCase(
    id: string,
    updateCaseDto: UpdateCaseDto,
    userId: string
  ): Promise<CaseResponse> {
    const existingCase = await this.caseRepository.findOne({
      where: { id },
      relations: ["origin", "application", "user", "assignedTo"],
    });

    if (!existingCase) {
      throw createError("Caso no encontrado", 404);
    }

    // Verificar número de caso único si se está actualizando
    if (
      updateCaseDto.numeroCaso &&
      updateCaseDto.numeroCaso !== existingCase.numeroCaso
    ) {
      const duplicateCase = await this.caseRepository.findOne({
        where: { numeroCaso: updateCaseDto.numeroCaso },
      });
      if (duplicateCase) {
        throw createError("Ya existe un caso con este número", 400);
      }
    }

    // Verificar origen si se proporciona
    let newOrigin = null;
    if (updateCaseDto.originId) {
      newOrigin = await this.originRepository.findOne({
        where: { id: updateCaseDto.originId, activo: true },
      });
      if (!newOrigin) {
        throw createError("Origen no encontrado o inactivo", 404);
      }
    }

    // Verificar aplicación si se proporciona
    let newApplication = null;
    if (updateCaseDto.applicationId) {
      newApplication = await this.applicationRepository.findOne({
        where: { id: updateCaseDto.applicationId, activo: true },
      });
      if (!newApplication) {
        throw createError("Aplicación no encontrada o inactiva", 404);
      }
    }

    // Verificar usuario asignado si se proporciona
    if (updateCaseDto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: updateCaseDto.assignedToId, isActive: true },
      });
      if (!assignedUser) {
        throw createError("Usuario asignado no encontrado o inactivo", 404);
      }
    }

    // Actualizar campos
    Object.assign(existingCase, updateCaseDto);

    // Asignar nuevas relaciones si se proporcionaron
    if (newOrigin) {
      existingCase.origin = newOrigin;
    }
    if (newApplication) {
      existingCase.application = newApplication;
    }

    if (updateCaseDto.fecha) {
      existingCase.fecha = new Date(updateCaseDto.fecha);
    }

    // Recalcular puntuación si se actualizan los criterios
    const criteriaFields = [
      "historialCaso",
      "conocimientoModulo",
      "manipulacionDatos",
      "claridadDescripcion",
      "causaFallo",
    ];
    if (
      criteriaFields.some(
        (field) => updateCaseDto[field as keyof UpdateCaseDto] !== undefined
      )
    ) {
      existingCase.calculateScoring();
    }

    const updatedCase = await this.caseRepository.save(existingCase);

    // Recargar el caso con las relaciones actualizadas
    const caseWithRelations = await this.caseRepository.findOne({
      where: { id: updatedCase.id },
      relations: ["origin", "application", "user", "assignedTo"],
    });

    return this.mapCaseToResponse(caseWithRelations!);
  }

  async deleteCase(id: string, userId: string): Promise<void> {
    const existingCase = await this.caseRepository.findOne({
      where: { id },
    });

    if (!existingCase) {
      throw createError("Caso no encontrado", 404);
    }

    // Usar transacción para asegurar que todo se elimine correctamente
    await this.caseRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Eliminar registros en dispositions relacionados con este caso
        await transactionalEntityManager.query(
          `DELETE FROM dispositions WHERE case_id = $1`,
          [id]
        );

        // 2. Eliminar registros en time_entries relacionados con case_control de este caso
        await transactionalEntityManager.query(
          `DELETE FROM time_entries WHERE "caseControlId" IN (
          SELECT id FROM case_control WHERE "caseId" = $1
        )`,
          [id]
        );

        // 3. Eliminar registros en manual_time_entries relacionados con case_control de este caso
        await transactionalEntityManager.query(
          `DELETE FROM manual_time_entries WHERE "caseControlId" IN (
          SELECT id FROM case_control WHERE "caseId" = $1
        )`,
          [id]
        );

        // 4. Eliminar registros en case_control relacionados con este caso
        await transactionalEntityManager.query(
          `DELETE FROM case_control WHERE "caseId" = $1`,
          [id]
        );

        // 5. Eliminar notas relacionadas con este caso (si existe la relación)
        await transactionalEntityManager.query(
          `DELETE FROM notes WHERE case_id = $1`,
          [id]
        );

        // 6. Finalmente, eliminar el caso
        await transactionalEntityManager.remove(existingCase);
      }
    );

    console.log(
      `✅ Caso ${id} eliminado exitosamente con todas sus dependencias`
    );
  }

  async getCaseStats(): Promise<{
    total: number;
    porClasificacion: Record<string, number>;
    porEstado: Record<string, number>;
  }> {
    const [total, clasificaciones, estados] = await Promise.all([
      this.caseRepository.count(),
      this.caseRepository
        .createQueryBuilder("case")
        .select("case.clasificacion, COUNT(case.id) as count")
        .groupBy("case.clasificacion")
        .getRawMany(),
      this.caseRepository
        .createQueryBuilder("case")
        .select("case.estado, COUNT(case.id) as count")
        .groupBy("case.estado")
        .getRawMany(),
    ]);

    const porClasificacion = clasificaciones.reduce((acc, item) => {
      acc[item.case_clasificacion] = parseInt(item.count);
      return acc;
    }, {});

    const porEstado = estados.reduce((acc, item) => {
      acc[item.case_estado] = parseInt(item.count);
      return acc;
    }, {});

    return {
      total,
      porClasificacion,
      porEstado,
    };
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Case>,
    filters: CaseFiltersDto
  ): void {
    if (filters.fecha) {
      queryBuilder.andWhere("DATE(case.fecha) = :fecha", {
        fecha: filters.fecha,
      });
    }

    if (filters.clasificacion) {
      queryBuilder.andWhere("case.clasificacion = :clasificacion", {
        clasificacion: filters.clasificacion,
      });
    }

    if (filters.estado) {
      queryBuilder.andWhere("case.estado = :estado", {
        estado: filters.estado,
      });
    }

    if (filters.originId) {
      queryBuilder.andWhere("case.originId = :originId", {
        originId: filters.originId,
      });
    }

    if (filters.applicationId) {
      queryBuilder.andWhere("case.applicationId = :applicationId", {
        applicationId: filters.applicationId,
      });
    }

    if (filters.busqueda) {
      queryBuilder.andWhere(
        "(case.numeroCaso ILIKE :busqueda OR case.descripcion ILIKE :busqueda)",
        { busqueda: `%${filters.busqueda}%` }
      );
    }
  }

  private mapCaseToResponse(caseEntity: Case): CaseResponse {
    // Convertir fecha a string - la entidad fecha siempre debe ser Date
    const fechaObj =
      caseEntity.fecha instanceof Date
        ? caseEntity.fecha
        : new Date(caseEntity.fecha);
    const fechaStr = fechaObj.toISOString().substring(0, 10);

    return {
      id: caseEntity.id,
      numeroCaso: caseEntity.numeroCaso,
      descripcion: caseEntity.descripcion,
      fecha: fechaStr,
      historialCaso: caseEntity.historialCaso,
      conocimientoModulo: caseEntity.conocimientoModulo,
      manipulacionDatos: caseEntity.manipulacionDatos,
      claridadDescripcion: caseEntity.claridadDescripcion,
      causaFallo: caseEntity.causaFallo,
      puntuacion: Number(caseEntity.puntuacion),
      clasificacion: caseEntity.clasificacion,
      estado: caseEntity.estado,
      observaciones: caseEntity.observaciones,
      originId: caseEntity.originId,
      applicationId: caseEntity.applicationId,
      userId: caseEntity.userId,
      assignedToId: caseEntity.assignedToId,
      createdAt: caseEntity.createdAt.toISOString(),
      updatedAt: caseEntity.updatedAt.toISOString(),
      origin: caseEntity.origin
        ? {
            id: caseEntity.origin.id,
            nombre: caseEntity.origin.nombre,
            descripcion: caseEntity.origin.descripcion,
          }
        : undefined,
      application: caseEntity.application
        ? {
            id: caseEntity.application.id,
            nombre: caseEntity.application.nombre,
            descripcion: caseEntity.application.descripcion,
          }
        : undefined,
      user: caseEntity.user
        ? {
            id: caseEntity.user.id,
            email: caseEntity.user.email,
            fullName: caseEntity.user.fullName,
          }
        : undefined,
      assignedTo: caseEntity.assignedTo
        ? {
            id: caseEntity.assignedTo.id,
            email: caseEntity.assignedTo.email,
            fullName: caseEntity.assignedTo.fullName,
          }
        : undefined,
    } as CaseResponse;
  }
}
