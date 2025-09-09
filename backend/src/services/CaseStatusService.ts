import { Repository, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/database";
import { CaseStatusControl } from "../entities/CaseStatusControl";

export interface CreateCaseStatusDto {
  name: string;
  description?: string;
  color: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCaseStatusDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CaseStatusFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CaseStatusFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export class CaseStatusService {
  private statusRepository: Repository<CaseStatusControl>;

  constructor() {
    this.statusRepository = AppDataSource.getRepository(CaseStatusControl);
  }

  async findAll() {
    return await this.statusRepository.find({
      order: { displayOrder: "ASC" },
    });
  }

  async findById(id: string) {
    return await this.statusRepository.findOne({ where: { id } });
  }

  async create(data: Partial<CaseStatusControl>) {
    const status = this.statusRepository.create(data);
    return await this.statusRepository.save(status);
  }

  async update(id: string, data: Partial<CaseStatusControl>) {
    await this.statusRepository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string) {
    await this.statusRepository.delete(id);
    return { success: true };
  }

  // Métodos alias para compatibilidad con el controlador
  async getAllStatuses(filters: CaseStatusFilterParams = {}) {
    const {
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "displayOrder",
      sortOrder = "ASC",
    } = filters;

    const query = this.statusRepository.createQueryBuilder("status");

    if (search) {
      query.where(
        "(status.name ILIKE :search OR status.description ILIKE :search)",
        {
          search: `%${search}%`,
        }
      );
    }

    if (isActive !== undefined) {
      query.andWhere("status.isActive = :isActive", { isActive });
    }

    query.orderBy(`status.${sortBy}`, sortOrder);

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);
    const statuses = await query.getMany();

    return {
      statuses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStatusById(id: string) {
    return await this.findById(id);
  }

  async createStatus(data: Partial<CaseStatusControl>) {
    return await this.create(data);
  }

  async updateStatus(id: string, data: Partial<CaseStatusControl>) {
    return await this.update(id, data);
  }

  async deleteStatus(id: string) {
    return await this.delete(id);
  }

  async searchStatuses(filters: any) {
    return await this.findAll();
  }

  async getStatusStats() {
    return await this.getStats();
  }

  async reorderStatuses(statusOrders: any[]) {
    for (const item of statusOrders) {
      await this.statusRepository.update(item.id, {
        displayOrder: item.order,
      });
    }
    return { success: true };
  }

  async canDeleteStatus(id: string) {
    return {
      canDelete: true,
      casesCount: 0,
      reason: "",
    };
  }

  async getActiveStatusesOrdered() {
    return await this.statusRepository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
  }

  async getStats() {
    const total = await this.statusRepository.count();
    const active = await this.statusRepository.count({
      where: { isActive: true },
    });
    const inactive = total - active;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await this.statusRepository.count({
      where: {
        createdAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });

    return {
      totalStatuses: total,
      activeStatuses: active,
      inactiveStatuses: inactive,
      recentStatuses: recent,
    };
  }

  async getCaseStatusStats() {
    return await this.getStats();
  }
}

export const caseStatusService = new CaseStatusService();
