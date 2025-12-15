"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaseStats = exports.deleteCase = exports.updateCase = exports.getCaseById = exports.getCases = exports.createCase = exports.CaseController = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const case_service_1 = require("./case.service");
const case_dto_1 = require("./case.dto");
const errorHandler_1 = require("../../middleware/errorHandler");
class CaseController {
    constructor() {
        this.caseService = new case_service_1.CaseService();
    }
    async createCase(req, res, next) {
        try {
            const createCaseDto = (0, class_transformer_1.plainToClass)(case_dto_1.CreateCaseDto, req.body);
            const errors = await (0, class_validator_1.validate)(createCaseDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const userId = "temp-user-id";
            const newCase = await this.caseService.createCase(createCaseDto, userId);
            res.status(201).json({
                success: true,
                message: "Caso creado exitosamente",
                data: newCase,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCases(req, res, next) {
        try {
            const filtersDto = (0, class_transformer_1.plainToClass)(case_dto_1.CaseFiltersDto, req.query);
            const errors = await (0, class_validator_1.validate)(filtersDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const userId = "temp-user-id";
            const cases = await this.caseService.getCases(filtersDto, userId);
            res.json({
                success: true,
                data: cases,
                total: cases.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCaseById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID del caso es requerido", 400);
            }
            const userId = "temp-user-id";
            const caseData = await this.caseService.getCaseById(id, userId);
            res.json({
                success: true,
                data: caseData,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCase(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID del caso es requerido", 400);
            }
            const updateCaseDto = (0, class_transformer_1.plainToClass)(case_dto_1.UpdateCaseDto, req.body);
            const errors = await (0, class_validator_1.validate)(updateCaseDto);
            if (errors.length > 0) {
                const errorMessages = errors
                    .map((error) => Object.values(error.constraints || {}).join(", "))
                    .join("; ");
                throw (0, errorHandler_1.createError)(errorMessages, 400);
            }
            const userId = "temp-user-id";
            const updatedCase = await this.caseService.updateCase(id, updateCaseDto, userId);
            res.json({
                success: true,
                message: "Caso actualizado exitosamente",
                data: updatedCase,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCase(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw (0, errorHandler_1.createError)("ID del caso es requerido", 400);
            }
            const userId = "temp-user-id";
            await this.caseService.deleteCase(id, userId);
            res.json({
                success: true,
                message: "Caso eliminado exitosamente",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCaseStats(req, res, next) {
        try {
            const stats = await this.caseService.getCaseStats();
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
exports.CaseController = CaseController;
const caseController = new CaseController();
exports.createCase = caseController.createCase.bind(caseController);
exports.getCases = caseController.getCases.bind(caseController);
exports.getCaseById = caseController.getCaseById.bind(caseController);
exports.updateCase = caseController.updateCase.bind(caseController);
exports.deleteCase = caseController.deleteCase.bind(caseController);
exports.getCaseStats = caseController.getCaseStats.bind(caseController);
