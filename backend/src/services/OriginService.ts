import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Origin } from "../entities/Origin";

export interface CreateOriginDto {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateOriginDto {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface OriginFilterParams {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface OriginListResponse {
  origins: Origin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OriginService {
  private originRepository: Repository<Origin>;

  constructor() {
    this.originRepository = AppDataSource.getRepository(Origin);
  }

  /**
   * Obtener todos los orígenes con filtros
   */
  async getAllOrigins(filters: OriginFilterParams = {}): Promise<{
    origins: Origin[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.originRepository.createQueryBuilder("origin");

    // Aplicar filtros
    if (filters.search) {
      queryBuilder.andWhere(
        "(origin.nombre ILIKE :search OR origin.descripcion ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere("origin.activo = :activo", {
        activo: filters.activo,
      });
    }

    // Ordenamiento
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`origin.${sortBy}`, sortOrder);

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const [origins, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { origins, total, page, limit, totalPages };
  }

  /**
   * Obtener origen por ID
   */
  async getOriginById(id: string): Promise<Origin | null> {
    return await this.originRepository.findOne({
      where: { id },
      relations: ["cases"], // Cargar casos relacionados si es necesario
    });
  }

  /**
   * Crear nuevo origen
   */
  async createOrigin(originData: CreateOriginDto): Promise<Origin> {
    // Verificar si ya existe un origen con el mismo nombre
    const existingOrigin = await this.originRepository.findOne({
      where: { nombre: originData.nombre },
    });

    if (existingOrigin) {
      throw new Error("Ya existe un origen con este nombre");
    }

    const origin = this.originRepository.create(originData);
    return await this.originRepository.save(origin);
  }

  /**
   * Actualizar origen
   */
  async updateOrigin(id: string, originData: UpdateOriginDto): Promise<Origin> {
    const origin = await this.originRepository.findOne({ where: { id } });

    if (!origin) {
      throw new Error("Origen no encontrado");
    }

    // Verificar nombre único si se está actualizando
    if (originData.nombre && originData.nombre !== origin.nombre) {
      const existingOrigin = await this.originRepository.findOne({
        where: { nombre: originData.nombre },
      });

      if (existingOrigin) {
        throw new Error("Ya existe un origen con este nombre");
      }
    }

    Object.assign(origin, originData);
    return await this.originRepository.save(origin);
  }

  /**
   * Eliminar origen (soft delete)
   */
  async deleteOrigin(id: string): Promise<void> {
    const origin = await this.originRepository.findOne({ where: { id } });

    if (!origin) {
      throw new Error("Origen no encontrado");
    }

    // Verificar si tiene casos asociados
    const casesCount = await this.originRepository
      .createQueryBuilder("origin")
      .leftJoin("origin.cases", "cases")
      .where("origin.id = :id", { id })
      .andWhere("cases.id IS NOT NULL")
      .getCount();

    if (casesCount > 0) {
      throw new Error(
        "No se puede eliminar el origen porque tiene casos asociados"
      );
    }

    await this.originRepository.remove(origin);
  }

  /**
   * Buscar orígenes
   */
  async searchOrigins(filters: OriginFilterParams): Promise<Origin[]> {
    const { search, activo } = filters;

    const query = this.originRepository.createQueryBuilder("origin");

    if (search) {
      query.andWhere(
        "(origin.nombre ILIKE :search OR origin.descripcion ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (activo !== undefined) {
      query.andWhere("origin.activo = :activo", { activo });
    }

    query.orderBy("origin.nombre", "ASC");

    return await query.getMany();
  }

  /**
   * Obtener estadísticas de orígenes
   */
  async getOriginStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withCases: number;
  }> {
    const [total, active, inactive] = await Promise.all([
      this.originRepository.count(),
      this.originRepository.count({ where: { activo: true } }),
      this.originRepository.count({ where: { activo: false } }),
    ]);

    const withCases = await this.originRepository
      .createQueryBuilder("origin")
      .leftJoin("origin.cases", "cases")
      .where("cases.id IS NOT NULL")
      .getCount();

    return {
      total,
      active,
      inactive,
      withCases,
    };
  }

  /**
   * Verificar si se puede eliminar un origen
   */
  async canDeleteOrigin(
    id: string
  ): Promise<{ canDelete: boolean; reason?: string }> {
    const origin = await this.originRepository.findOne({ where: { id } });

    if (!origin) {
      return { canDelete: false, reason: "Origen no encontrado" };
    }

    const casesCount = await this.originRepository
      .createQueryBuilder("origin")
      .leftJoin("origin.cases", "cases")
      .where("origin.id = :id", { id })
      .andWhere("cases.id IS NOT NULL")
      .getCount();

    if (casesCount > 0) {
      return {
        canDelete: false,
        reason: `Tiene ${casesCount} caso(s) asociado(s)`,
      };
    }

    return { canDelete: true };
  }
}
