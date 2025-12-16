"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseService = void 0;
const database_1 = require("../../config/database");
const Case_1 = require("../../entities/Case");
const UserProfile_1 = require("../../entities/UserProfile");
const Origin_1 = require("../../entities/Origin");
const Application_1 = require("../../entities/Application");
const errorHandler_1 = require("../../middleware/errorHandler");
class CaseService {
    constructor() {
        this.caseRepository = database_1.AppDataSource.getRepository(Case_1.Case);
        this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        this.originRepository = database_1.AppDataSource.getRepository(Origin_1.Origin);
        this.applicationRepository = database_1.AppDataSource.getRepository(Application_1.Application);
    }
    async createCase(createCaseDto, userId) {
        const existingCase = await this.caseRepository.findOne({
            where: { numeroCaso: createCaseDto.numeroCaso },
        });
        if (existingCase) {
            throw (0, errorHandler_1.createError)("Ya existe un caso con este número", 400);
        }
        if (createCaseDto.originId) {
            const origin = await this.originRepository.findOne({
                where: { id: createCaseDto.originId, activo: true },
            });
            if (!origin) {
                throw (0, errorHandler_1.createError)("Origen no encontrado o inactivo", 404);
            }
        }
        if (createCaseDto.applicationId) {
            const application = await this.applicationRepository.findOne({
                where: { id: createCaseDto.applicationId, activo: true },
            });
            if (!application) {
                throw (0, errorHandler_1.createError)("Aplicación no encontrada o inactiva", 404);
            }
        }
        const newCase = this.caseRepository.create({
            ...createCaseDto,
            fecha: new Date(createCaseDto.fecha),
        });
        newCase.calculateScoring();
        const savedCase = await this.caseRepository.save(newCase);
        return this.mapCaseToResponse(savedCase);
    }
    async getCases(filters, userId) {
        const queryBuilder = this.caseRepository
            .createQueryBuilder("case")
            .leftJoinAndSelect("case.origin", "origin")
            .leftJoinAndSelect("case.application", "application")
            .leftJoinAndSelect("case.user", "user")
            .leftJoinAndSelect("case.assignedTo", "assignedTo");
        this.applyFilters(queryBuilder, filters);
        queryBuilder.orderBy("case.createdAt", "DESC");
        const cases = await queryBuilder.getMany();
        return cases.map(this.mapCaseToResponse);
    }
    async getCaseById(id, userId) {
        const caseEntity = await this.caseRepository.findOne({
            where: { id },
            relations: ["origin", "application", "user", "assignedTo"],
        });
        if (!caseEntity) {
            throw (0, errorHandler_1.createError)("Caso no encontrado", 404);
        }
        return this.mapCaseToResponse(caseEntity);
    }
    async updateCase(id, updateCaseDto, userId) {
        const existingCase = await this.caseRepository.findOne({
            where: { id },
            relations: ["origin", "application", "user", "assignedTo"],
        });
        if (!existingCase) {
            throw (0, errorHandler_1.createError)("Caso no encontrado", 404);
        }
        if (updateCaseDto.numeroCaso &&
            updateCaseDto.numeroCaso !== existingCase.numeroCaso) {
            const duplicateCase = await this.caseRepository.findOne({
                where: { numeroCaso: updateCaseDto.numeroCaso },
            });
            if (duplicateCase) {
                throw (0, errorHandler_1.createError)("Ya existe un caso con este número", 400);
            }
        }
        let newOrigin = null;
        if (updateCaseDto.originId) {
            newOrigin = await this.originRepository.findOne({
                where: { id: updateCaseDto.originId, activo: true },
            });
            if (!newOrigin) {
                throw (0, errorHandler_1.createError)("Origen no encontrado o inactivo", 404);
            }
        }
        let newApplication = null;
        if (updateCaseDto.applicationId) {
            newApplication = await this.applicationRepository.findOne({
                where: { id: updateCaseDto.applicationId, activo: true },
            });
            if (!newApplication) {
                throw (0, errorHandler_1.createError)("Aplicación no encontrada o inactiva", 404);
            }
        }
        if (updateCaseDto.assignedToId) {
            const assignedUser = await this.userRepository.findOne({
                where: { id: updateCaseDto.assignedToId, isActive: true },
            });
            if (!assignedUser) {
                throw (0, errorHandler_1.createError)("Usuario asignado no encontrado o inactivo", 404);
            }
        }
        Object.assign(existingCase, updateCaseDto);
        if (newOrigin) {
            existingCase.origin = newOrigin;
        }
        if (newApplication) {
            existingCase.application = newApplication;
        }
        if (updateCaseDto.fecha) {
            existingCase.fecha = new Date(updateCaseDto.fecha);
        }
        const criteriaFields = [
            "historialCaso",
            "conocimientoModulo",
            "manipulacionDatos",
            "claridadDescripcion",
            "causaFallo",
        ];
        if (criteriaFields.some((field) => updateCaseDto[field] !== undefined)) {
            existingCase.calculateScoring();
        }
        const updatedCase = await this.caseRepository.save(existingCase);
        const caseWithRelations = await this.caseRepository.findOne({
            where: { id: updatedCase.id },
            relations: ["origin", "application", "user", "assignedTo"],
        });
        return this.mapCaseToResponse(caseWithRelations);
    }
    async deleteCase(id, userId) {
        const existingCase = await this.caseRepository.findOne({
            where: { id },
        });
        if (!existingCase) {
            throw (0, errorHandler_1.createError)("Caso no encontrado", 404);
        }
        await this.caseRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.query(`DELETE FROM dispositions WHERE case_id = $1`, [id]);
            await transactionalEntityManager.query(`DELETE FROM time_entries WHERE "caseControlId" IN (
          SELECT id FROM case_control WHERE "caseId" = $1
        )`, [id]);
            await transactionalEntityManager.query(`DELETE FROM manual_time_entries WHERE "caseControlId" IN (
          SELECT id FROM case_control WHERE "caseId" = $1
        )`, [id]);
            await transactionalEntityManager.query(`DELETE FROM case_control WHERE "caseId" = $1`, [id]);
            await transactionalEntityManager.query(`DELETE FROM notes WHERE case_id = $1`, [id]);
            await transactionalEntityManager.remove(existingCase);
        });
        console.log(`✅ Caso ${id} eliminado exitosamente con todas sus dependencias`);
    }
    async getCaseStats() {
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
    applyFilters(queryBuilder, filters) {
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
            queryBuilder.andWhere("(case.numeroCaso ILIKE :busqueda OR case.descripcion ILIKE :busqueda)", { busqueda: `%${filters.busqueda}%` });
        }
    }
    mapCaseToResponse(caseEntity) {
        const fechaObj = caseEntity.fecha instanceof Date
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
        };
    }
}
exports.CaseService = CaseService;
