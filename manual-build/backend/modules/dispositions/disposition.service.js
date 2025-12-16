"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispositionService = void 0;
const database_1 = require("../../config/database");
const Disposition_1 = require("../../entities/Disposition");
const Case_1 = require("../../entities/Case");
const Application_1 = require("../../entities/Application");
const UserProfile_1 = require("../../entities/UserProfile");
const errorHandler_1 = require("../../middleware/errorHandler");
class DispositionService {
    constructor() {
        this.dispositionRepository = database_1.AppDataSource.getRepository(Disposition_1.Disposition);
        this.caseRepository = database_1.AppDataSource.getRepository(Case_1.Case);
        this.applicationRepository = database_1.AppDataSource.getRepository(Application_1.Application);
        this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
    }
    async create(createDispositionDto, userId) {
        try {
            const application = await this.applicationRepository.findOne({
                where: { id: createDispositionDto.applicationId },
            });
            if (!application) {
                throw (0, errorHandler_1.createError)("Aplicación no encontrada", 404);
            }
            let caseEntity = null;
            if (createDispositionDto.caseId) {
                caseEntity = await this.caseRepository.findOne({
                    where: { id: createDispositionDto.caseId },
                });
                if (!caseEntity) {
                    throw (0, errorHandler_1.createError)("Caso no encontrado", 404);
                }
            }
            const disposition = this.dispositionRepository.create({
                ...createDispositionDto,
                applicationName: application.nombre,
                userId,
            });
            const savedDisposition = await this.dispositionRepository.save(disposition);
            const result = await this.findOne(savedDisposition.id);
            if (!result) {
                throw (0, errorHandler_1.createError)("Error al obtener la disposición creada", 500);
            }
            return result;
        }
        catch (error) {
            if (error.status) {
                throw error;
            }
            throw (0, errorHandler_1.createError)("Error al crear la disposición", 500);
        }
    }
    async findAll(filters, userId) {
        try {
            const queryBuilder = this.dispositionRepository.createQueryBuilder("disposition");
            if (userId) {
                queryBuilder.andWhere("disposition.userId = :userId", { userId });
            }
            if (filters) {
                if (filters.year) {
                    queryBuilder.andWhere("EXTRACT(YEAR FROM disposition.date) = :year", {
                        year: filters.year,
                    });
                }
                if (filters.month) {
                    queryBuilder.andWhere("EXTRACT(MONTH FROM disposition.date) = :month", { month: filters.month });
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
            return result || [];
        }
        catch (error) {
            console.warn("Error al obtener disposiciones, devolviendo array vacío:", error);
            return [];
        }
    }
    async findOne(id) {
        try {
            const disposition = await this.dispositionRepository
                .createQueryBuilder("disposition")
                .where("disposition.id = :id", { id })
                .getOne();
            return disposition;
        }
        catch (error) {
            throw (0, errorHandler_1.createError)("Error al obtener la disposición", 500);
        }
    }
    async update(id, updateDispositionDto) {
        try {
            const disposition = await this.dispositionRepository.findOne({
                where: { id },
            });
            if (!disposition) {
                throw (0, errorHandler_1.createError)("Disposición no encontrada", 404);
            }
            if (updateDispositionDto.applicationId) {
                const application = await this.applicationRepository.findOne({
                    where: { id: updateDispositionDto.applicationId },
                });
                if (!application) {
                    throw (0, errorHandler_1.createError)("Aplicación no encontrada", 404);
                }
            }
            if (updateDispositionDto.caseId) {
                const caseEntity = await this.caseRepository.findOne({
                    where: { id: updateDispositionDto.caseId },
                });
                if (!caseEntity) {
                    throw (0, errorHandler_1.createError)("Caso no encontrado", 404);
                }
            }
            await this.dispositionRepository.update(id, updateDispositionDto);
            const result = await this.findOne(id);
            if (!result) {
                throw (0, errorHandler_1.createError)("Error al obtener la disposición actualizada", 500);
            }
            return result;
        }
        catch (error) {
            if (error.status) {
                throw error;
            }
            throw (0, errorHandler_1.createError)("Error al actualizar la disposición", 500);
        }
    }
    async remove(id) {
        try {
            const disposition = await this.dispositionRepository.findOne({
                where: { id },
            });
            if (!disposition) {
                throw (0, errorHandler_1.createError)("Disposición no encontrada", 404);
            }
            await this.dispositionRepository.remove(disposition);
        }
        catch (error) {
            if (error.status) {
                throw error;
            }
            throw (0, errorHandler_1.createError)("Error al eliminar la disposición", 500);
        }
    }
    async getAvailableYears() {
        try {
            const result = await this.dispositionRepository
                .createQueryBuilder("disposition")
                .select("DISTINCT EXTRACT(YEAR FROM disposition.date)", "year")
                .orderBy("year", "DESC")
                .getRawMany();
            return result.map((row) => parseInt(row.year));
        }
        catch (error) {
            console.warn("No hay años disponibles en la tabla dispositions:", error);
            return [];
        }
    }
    async getMonthlyStats(year, month) {
        try {
            const queryBuilder = this.dispositionRepository
                .createQueryBuilder("disposition")
                .where("EXTRACT(YEAR FROM disposition.date) = :year", { year })
                .andWhere("EXTRACT(MONTH FROM disposition.date) = :month", { month });
            const dispositions = await queryBuilder.getMany();
            const statsByApplication = {};
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
        }
        catch (error) {
            console.warn("Error al obtener estadísticas mensuales, devolviendo datos vacíos:", error);
            return {
                year,
                month,
                totalDispositions: 0,
                applicationStats: [],
            };
        }
    }
}
exports.DispositionService = DispositionService;
