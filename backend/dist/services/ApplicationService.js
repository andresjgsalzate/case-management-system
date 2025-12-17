"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationService = exports.ApplicationService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const Application_1 = require("../entities/Application");
class ApplicationService {
    constructor() {
        this.applicationRepository = database_1.AppDataSource.getRepository(Application_1.Application);
    }
    async findAll(filters = {}) {
        const { search, activo, page = 1, limit = 10, sortBy = "nombre", sortOrder = "ASC", } = filters;
        const query = this.applicationRepository.createQueryBuilder("application");
        if (search) {
            query.where("(application.nombre ILIKE :search OR application.descripcion ILIKE :search)", {
                search: `%${search}%`,
            });
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
    async findById(id) {
        return await this.applicationRepository.findOne({ where: { id } });
    }
    async create(data) {
        const application = this.applicationRepository.create({
            ...data,
            activo: data.activo !== undefined ? data.activo : true,
        });
        return await this.applicationRepository.save(application);
    }
    async update(id, data) {
        await this.applicationRepository.update(id, data);
        return await this.findById(id);
    }
    async delete(id) {
        const canDelete = await this.canDelete(id);
        if (!canDelete.canDelete) {
            throw new Error(canDelete.reason || "No se puede eliminar la aplicación");
        }
        await this.applicationRepository.delete(id);
        return { success: true, message: "Aplicación eliminada correctamente" };
    }
    async canDelete(id) {
        return {
            canDelete: true,
            casesCount: 0,
            reason: "",
        };
    }
    async getStats() {
        const total = await this.applicationRepository.count();
        const active = await this.applicationRepository.count({
            where: { activo: true },
        });
        const inactive = total - active;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = await this.applicationRepository.count({
            where: {
                createdAt: (0, typeorm_1.MoreThanOrEqual)(sevenDaysAgo),
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
    async getAllApplications(filters = {}) {
        return await this.findAll(filters);
    }
    async getApplicationById(id) {
        return await this.findById(id);
    }
    async createApplication(data) {
        return await this.create(data);
    }
    async updateApplication(id, data) {
        return await this.update(id, data);
    }
    async deleteApplication(id) {
        return await this.delete(id);
    }
    async searchApplications(filters) {
        return await this.findAll(filters);
    }
    async getApplicationStats() {
        return await this.getStats();
    }
    async canDeleteApplication(id) {
        return await this.canDelete(id);
    }
}
exports.ApplicationService = ApplicationService;
exports.applicationService = new ApplicationService();
