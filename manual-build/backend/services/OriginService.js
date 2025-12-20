"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OriginService = void 0;
const database_1 = require("../config/database");
const Origin_1 = require("../entities/Origin");
class OriginService {
    constructor() {
        this.originRepository = database_1.AppDataSource.getRepository(Origin_1.Origin);
    }
    async getAllOrigins(filters = {}) {
        const queryBuilder = this.originRepository.createQueryBuilder("origin");
        if (filters.search) {
            queryBuilder.andWhere("(origin.nombre ILIKE :search OR origin.descripcion ILIKE :search)", { search: `%${filters.search}%` });
        }
        if (filters.activo !== undefined) {
            queryBuilder.andWhere("origin.activo = :activo", {
                activo: filters.activo,
            });
        }
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "DESC";
        queryBuilder.orderBy(`origin.${sortBy}`, sortOrder);
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [origins, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return { origins, total, page, limit, totalPages };
    }
    async getOriginById(id) {
        return await this.originRepository.findOne({
            where: { id },
            relations: ["cases"],
        });
    }
    async createOrigin(originData) {
        const existingOrigin = await this.originRepository.findOne({
            where: { nombre: originData.nombre },
        });
        if (existingOrigin) {
            throw new Error("Ya existe un origen con este nombre");
        }
        const origin = this.originRepository.create(originData);
        return await this.originRepository.save(origin);
    }
    async updateOrigin(id, originData) {
        const origin = await this.originRepository.findOne({ where: { id } });
        if (!origin) {
            throw new Error("Origen no encontrado");
        }
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
    async deleteOrigin(id) {
        const origin = await this.originRepository.findOne({ where: { id } });
        if (!origin) {
            throw new Error("Origen no encontrado");
        }
        const casesCount = await this.originRepository
            .createQueryBuilder("origin")
            .leftJoin("origin.cases", "cases")
            .where("origin.id = :id", { id })
            .andWhere("cases.id IS NOT NULL")
            .getCount();
        if (casesCount > 0) {
            throw new Error("No se puede eliminar el origen porque tiene casos asociados");
        }
        await this.originRepository.remove(origin);
    }
    async searchOrigins(filters) {
        const { search, activo } = filters;
        const query = this.originRepository.createQueryBuilder("origin");
        if (search) {
            query.andWhere("(origin.nombre ILIKE :search OR origin.descripcion ILIKE :search)", { search: `%${search}%` });
        }
        if (activo !== undefined) {
            query.andWhere("origin.activo = :activo", { activo });
        }
        query.orderBy("origin.nombre", "ASC");
        return await query.getMany();
    }
    async getOriginStats() {
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
    async canDeleteOrigin(id) {
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
exports.OriginService = OriginService;
