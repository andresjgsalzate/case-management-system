"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyStats = exports.getAvailableYears = exports.deleteDisposition = exports.updateDisposition = exports.getDispositionById = exports.getAllDispositions = exports.createDisposition = exports.DispositionController = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const disposition_service_1 = require("./disposition.service");
const disposition_dto_1 = require("../../dto/disposition.dto");
const errorHandler_1 = require("../../middleware/errorHandler");
const database_1 = require("../../config/database");
const UserProfile_1 = require("../../entities/UserProfile");
class DispositionController {
    constructor() {
        this.dispositionService = new disposition_service_1.DispositionService();
    }
    async createDisposition(req, res, next) {
        try {
            const createDispositionDto = (0, class_transformer_1.plainToClass)(disposition_dto_1.CreateDispositionDto, req.body);
            const errors = await (0, class_validator_1.validate)(createDispositionDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
            const firstUser = await userRepository.findOne({ where: {} });
            if (!firstUser) {
                throw (0, errorHandler_1.createError)("No hay usuarios disponibles en el sistema", 500);
            }
            const userId = firstUser.id;
            const newDisposition = await this.dispositionService.create(createDispositionDto, userId);
            res.status(201).json({
                success: true,
                message: "Disposición creada exitosamente",
                data: newDisposition,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllDispositions(req, res, next) {
        try {
            const filtersDto = (0, class_transformer_1.plainToClass)(disposition_dto_1.DispositionFiltersDto, req.query);
            const errors = await (0, class_validator_1.validate)(filtersDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const userId = undefined;
            const dispositions = await this.dispositionService.findAll(filtersDto, userId);
            res.json({
                success: true,
                data: dispositions,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDispositionById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID de disposición requerido", 400);
            }
            const disposition = await this.dispositionService.findOne(id);
            if (!disposition) {
                throw (0, errorHandler_1.createError)("Disposición no encontrada", 404);
            }
            res.json({
                success: true,
                data: disposition,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateDisposition(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID de disposición requerido", 400);
            }
            const updateDispositionDto = (0, class_transformer_1.plainToClass)(disposition_dto_1.UpdateDispositionDto, req.body);
            const errors = await (0, class_validator_1.validate)(updateDispositionDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const updatedDisposition = await this.dispositionService.update(id, updateDispositionDto);
            res.json({
                success: true,
                message: "Disposición actualizada exitosamente",
                data: updatedDisposition,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteDisposition(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID de disposición requerido", 400);
            }
            await this.dispositionService.remove(id);
            res.json({
                success: true,
                message: "Disposición eliminada exitosamente",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAvailableYears(req, res, next) {
        try {
            const years = await this.dispositionService.getAvailableYears();
            res.json({
                success: true,
                data: years,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMonthlyStats(req, res, next) {
        try {
            const { year, month } = req.params;
            if (!year || !month) {
                throw (0, errorHandler_1.createError)("Año y mes son requeridos", 400);
            }
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                throw (0, errorHandler_1.createError)("Año y mes deben ser números válidos", 400);
            }
            const stats = await this.dispositionService.getMonthlyStats(yearNum, monthNum);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DispositionController = DispositionController;
const dispositionController = new DispositionController();
const createDisposition = (req, res, next) => dispositionController.createDisposition(req, res, next);
exports.createDisposition = createDisposition;
const getAllDispositions = (req, res, next) => dispositionController.getAllDispositions(req, res, next);
exports.getAllDispositions = getAllDispositions;
const getDispositionById = (req, res, next) => dispositionController.getDispositionById(req, res, next);
exports.getDispositionById = getDispositionById;
const updateDisposition = (req, res, next) => dispositionController.updateDisposition(req, res, next);
exports.updateDisposition = updateDisposition;
const deleteDisposition = (req, res, next) => dispositionController.deleteDisposition(req, res, next);
exports.deleteDisposition = deleteDisposition;
const getAvailableYears = (req, res, next) => dispositionController.getAvailableYears(req, res, next);
exports.getAvailableYears = getAvailableYears;
const getMonthlyStats = (req, res, next) => dispositionController.getMonthlyStats(req, res, next);
exports.getMonthlyStats = getMonthlyStats;
