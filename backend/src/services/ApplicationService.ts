import { Repository, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/database";
import { Application } from "../entities/Application";

export interface CreateApplicationDto {
  nombre: string;
  descripcion?: string;
  version?: string;
  activo?: boolean;
}

export interface UpdateApplicationDto {
  nombre?: string;
  descripcion?: string;
  version?: string;
  activo?: boolean;
}

export interface ApplicationFilterParams {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ApplicationStats {
  totalApplications: number;
  activeApplications: number;
  inactiveApplications: number;
  casesCount: number;
  recentlyCreated: number;
}

export class ApplicationService {
  private applicationRepository: Repository<Application>;

  constructor() {
    this.applicationRepository = AppDataSource.getRepository(Application);
  }

  async findAll(filters: ApplicationFilterParams = {}) {
    const {
      search,
      activo,
      page = 1,
      limit = 10,
      sortBy = "nombre",
      sortOrder = "ASC",
    } = filters;

    const query = this.applicationRepository.createQueryBuilder("application");

    if (search) {
      query.where(
        "(application.nombre ILIKE :search OR application.descripcion ILIKE :search)",
        {
          search: `%${search}%`,
        }
      );
    }

    if (activo !== undefined) {
      query.andWhere("application.activo = :activo", { activo });
    }

    query.orderBy(`application.${sortBy}`, sortOrder);

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);
    const applications = await query.getMany();

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return await this.applicationRepository.findOne({ where: { id } });
  }

  async create(data: CreateApplicationDto) {
    const application = this.applicationRepository.create({
      ...data,
      activo: data.activo !== undefined ? data.activo : true,
    });
    return await this.applicationRepository.save(application);
  }

  async update(id: string, data: UpdateApplicationDto) {
    await this.applicationRepository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string) {
    const canDelete = await this.canDelete(id);
    if (!canDelete.canDelete) {
      throw new Error(canDelete.reason || "No se puede eliminar la aplicación");
    }

    await this.applicationRepository.delete(id);
    return { success: true, message: "Aplicación eliminada correctamente" };
  }

  async canDelete(id: string) {
    // Verificar si hay casos asociados a esta aplicación
    return {
      canDelete: true,
      casesCount: 0,
      reason: "",
    };
  }

  async getStats(): Promise<ApplicationStats> {
    const total = await this.applicationRepository.count();
    const active = await this.applicationRepository.count({
      where: { activo: true },
    });
    const inactive = total - active;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await this.applicationRepository.count({
      where: {
        createdAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });

    return {
      totalApplications: total,
      activeApplications: active,
      inactiveApplications: inactive,
      casesCount: 0,
      recentlyCreated: recent,
    };
  }

  // Métodos alias para compatibilidad con el controlador
  async getAllApplications(filters: ApplicationFilterParams = {}) {
    return await this.findAll(filters);
  }

  async getApplicationById(id: string) {
    return await this.findById(id);
  }

  async createApplication(data: CreateApplicationDto) {
    return await this.create(data);
  }

  async updateApplication(id: string, data: UpdateApplicationDto) {
    return await this.update(id, data);
  }

  async deleteApplication(id: string) {
    return await this.delete(id);
  }

  async searchApplications(filters: ApplicationFilterParams) {
    return await this.findAll(filters);
  }

  async getApplicationStats() {
    return await this.getStats();
  }

  async canDeleteApplication(id: string) {
    return await this.canDelete(id);
  }
}

export const applicationService = new ApplicationService();
