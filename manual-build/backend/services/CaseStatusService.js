"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseStatusService = exports.CaseStatusService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const CaseStatusControl_1 = require("../entities/CaseStatusControl");
class CaseStatusService {
    constructor() {
        this.statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl_1.CaseStatusControl);
    }
    async findAll() {
        return await this.statusRepository.find({
            order: { displayOrder: "ASC" },
        });
    }
    async findById(id) {
        return await this.statusRepository.findOne({ where: { id } });
    }
    async create(data) {
        const status = this.statusRepository.create(data);
        return await this.statusRepository.save(status);
    }
    async update(id, data) {
        await this.statusRepository.update(id, data);
        return await this.findById(id);
    }
    async delete(id) {
        await this.statusRepository.delete(id);
        return { success: true };
    }
    async getAllStatuses(filters = {}) {
        const { search, isActive, page = 1, limit = 10, sortBy = "displayOrder", sortOrder = "ASC", } = filters;
        const query = this.statusRepository.createQueryBuilder("status");
        if (search) {
            query.where("(status.name ILIKE :search OR status.description ILIKE :search)", {
                search: `%${search}%`,
            });
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
    async getStatusById(id) {
        return await this.findById(id);
    }
    async createStatus(data) {
        return await this.create(data);
    }
    async updateStatus(id, data) {
        return await this.update(id, data);
    }
    async deleteStatus(id) {
        return await this.delete(id);
    }
    async searchStatuses(filters) {
        return await this.findAll();
    }
    async getStatusStats() {
        return await this.getStats();
    }
    async reorderStatuses(statusOrders) {
        for (const item of statusOrders) {
            await this.statusRepository.update(item.id, {
                displayOrder: item.order,
            });
        }
        return { success: true };
    }
    async canDeleteStatus(id) {
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
                createdAt: (0, typeorm_1.MoreThanOrEqual)(sevenDaysAgo),
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
exports.CaseStatusService = CaseStatusService;
exports.caseStatusService = new CaseStatusService();
