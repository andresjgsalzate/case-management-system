import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Disposition } from "../../entities/Disposition";
import { Case } from "../../entities/Case";
import { Application } from "../../entities/Application";
import { UserProfile } from "../../entities/UserProfile";
import {
  CreateDispositionDto,
  UpdateDispositionDto,
  DispositionFiltersDto,
} from "../../dto/disposition.dto";
import { createError } from "../../middleware/errorHandler";

export class DispositionService {
  private dispositionRepository: Repository<Disposition>;
  private caseRepository: Repository<Case>;
  private applicationRepository: Repository<Application>;
  private userRepository: Repository<UserProfile>;

  constructor() {
    this.dispositionRepository = AppDataSource.getRepository(Disposition);
    this.caseRepository = AppDataSource.getRepository(Case);
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.userRepository = AppDataSource.getRepository(UserProfile);
  }

  async create(
    createDispositionDto: CreateDispositionDto,
    userId: string
  ): Promise<Disposition> {
    try {
      // Verificar que la aplicación existe
      const application = await this.applicationRepository.findOne({
        where: { id: createDispositionDto.applicationId },
      });

      if (!application) {
        throw createError("Aplicación no encontrada", 404);
      }

      // Si se proporciona caseId, verificar que el caso existe
      let caseEntity = null;
      if (createDispositionDto.caseId) {
        caseEntity = await this.caseRepository.findOne({
          where: { id: createDispositionDto.caseId },
        });

        if (!caseEntity) {
          throw createError("Caso no encontrado", 404);
        }
      }

      // Crear la nueva disposición
      const disposition = this.dispositionRepository.create({
        ...createDispositionDto,
        applicationName: application.nombre, // Agregar el nombre de la aplicación
        userId,
      });

      const savedDisposition = await this.dispositionRepository.save(
        disposition
      );

      // Retornar con relaciones incluidas
      const result = await this.findOne(savedDisposition.id);
      if (!result) {
        throw createError("Error al obtener la disposición creada", 500);
      }
      return result;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw createError("Error al crear la disposición", 500);
    }
  }

  async findAll(
    filters?: DispositionFiltersDto,
    userId?: string
  ): Promise<Disposition[]> {
    try {
      const queryBuilder =
        this.dispositionRepository.createQueryBuilder("disposition");

      // Filtro por usuario (si está proporcionado)
      if (userId) {
        queryBuilder.andWhere("disposition.userId = :userId", { userId });
      }

      // Aplicar filtros
      if (filters) {
        if (filters.year) {
          queryBuilder.andWhere("EXTRACT(YEAR FROM disposition.date) = :year", {
            year: filters.year,
          });
        }

        if (filters.month) {
          queryBuilder.andWhere(
            "EXTRACT(MONTH FROM disposition.date) = :month",
            { month: filters.month }
          );
        }

        if (filters.applicationId) {
          queryBuilder.andWhere("disposition.applicationId = :applicationId", {
            applicationId: filters.applicationId,
          });
        }

        if (filters.caseNumber) {
          queryBuilder.andWhere("disposition.caseNumber ILIKE :caseNumber", {
            caseNumber: `%${filters.caseNumber}%`,
          });
        }
      }

      queryBuilder.orderBy("disposition.date", "DESC");

      const result = await queryBuilder.getMany();
      return result || []; // Asegurar que siempre devuelva un array
    } catch (error) {
      // Si no hay datos o hay un error de consulta, devolver array vacío
      console.warn(
        "Error al obtener disposiciones, devolviendo array vacío:",
        error
      );
      return [];
    }
  }

  async findOne(id: string): Promise<Disposition | null> {
    try {
      const disposition = await this.dispositionRepository
        .createQueryBuilder("disposition")
        .where("disposition.id = :id", { id })
        .getOne();

      return disposition;
    } catch (error) {
      throw createError("Error al obtener la disposición", 500);
    }
  }

  async update(
    id: string,
    updateDispositionDto: UpdateDispositionDto
  ): Promise<Disposition> {
    try {
      const disposition = await this.dispositionRepository.findOne({
        where: { id },
      });

      if (!disposition) {
        throw createError("Disposición no encontrada", 404);
      }

      // Verificar que la aplicación existe si se está actualizando
      if (updateDispositionDto.applicationId) {
        const application = await this.applicationRepository.findOne({
          where: { id: updateDispositionDto.applicationId },
        });

        if (!application) {
          throw createError("Aplicación no encontrada", 404);
        }
      }

      // Si se proporciona caseId, verificar que el caso existe
      if (updateDispositionDto.caseId) {
        const caseEntity = await this.caseRepository.findOne({
          where: { id: updateDispositionDto.caseId },
        });

        if (!caseEntity) {
          throw createError("Caso no encontrado", 404);
        }
      }

      // Actualizar la disposición
      await this.dispositionRepository.update(id, updateDispositionDto);

      // Retornar con relaciones incluidas
      const result = await this.findOne(id);
      if (!result) {
        throw createError("Error al obtener la disposición actualizada", 500);
      }
      return result;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw createError("Error al actualizar la disposición", 500);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const disposition = await this.dispositionRepository.findOne({
        where: { id },
      });

      if (!disposition) {
        throw createError("Disposición no encontrada", 404);
      }

      await this.dispositionRepository.remove(disposition);
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw createError("Error al eliminar la disposición", 500);
    }
  }

  async getAvailableYears(): Promise<number[]> {
    try {
      const result = await this.dispositionRepository
        .createQueryBuilder("disposition")
        .select("DISTINCT EXTRACT(YEAR FROM disposition.date)", "year")
        .orderBy("year", "DESC")
        .getRawMany();

      return result.map((row) => parseInt(row.year));
    } catch (error) {
      // Si no hay datos, retornar array vacío en lugar de error
      console.warn("No hay años disponibles en la tabla dispositions:", error);
      return [];
    }
  }

  async getMonthlyStats(year: number, month: number): Promise<any> {
    try {
      const queryBuilder = this.dispositionRepository
        .createQueryBuilder("disposition")
        .where("EXTRACT(YEAR FROM disposition.date) = :year", { year })
        .andWhere("EXTRACT(MONTH FROM disposition.date) = :month", { month });

      const dispositions = await queryBuilder.getMany();

      // Agrupar por aplicación
      const statsByApplication: { [key: string]: any } = {};

      dispositions.forEach((disposition) => {
        const appId = disposition.applicationId || "unknown";
        const appName = disposition.applicationName || "Sin aplicación";

        if (!statsByApplication[appId]) {
          statsByApplication[appId] = {
            applicationId: appId,
            applicationName: appName,
            count: 0,
            dispositions: [],
          };
        }

        statsByApplication[appId].count++;
        statsByApplication[appId].dispositions.push(disposition);
      });

      return {
        year,
        month,
        totalDispositions: dispositions.length,
        applicationStats: Object.values(statsByApplication),
      };
    } catch (error) {
      // Si no hay datos, devolver estructura vacía
      console.warn(
        "Error al obtener estadísticas mensuales, devolviendo datos vacíos:",
        error
      );
      return {
        year,
        month,
        totalDispositions: 0,
        applicationStats: [],
      };
    }
  }
}
