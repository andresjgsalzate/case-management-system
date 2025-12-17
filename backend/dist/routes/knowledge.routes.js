"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const database_1 = require("../config/database");
const knowledge_document_service_1 = require("../services/knowledge-document.service");
const knowledge_tag_service_1 = require("../services/knowledge-tag.service");
const document_type_service_1 = require("../services/document-type.service");
const document_feedback_service_1 = require("../services/document-feedback.service");
const knowledge_document_dto_1 = require("../dto/knowledge-document.dto");
const document_type_dto_1 = require("../dto/document-type.dto");
const document_feedback_dto_1 = require("../dto/document-feedback.dto");
const auth_1 = require("../middleware/auth");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = (0, express_1.Router)();
const knowledgeDocumentService = new knowledge_document_service_1.KnowledgeDocumentService(database_1.AppDataSource);
const knowledgeTagService = new knowledge_tag_service_1.KnowledgeTagService(database_1.AppDataSource);
const documentTypeService = new document_type_service_1.DocumentTypeService(database_1.AppDataSource);
const documentFeedbackService = new document_feedback_service_1.DocumentFeedbackService(database_1.AppDataSource);
async function validateDto(dtoClass, data) {
    const dto = (0, class_transformer_1.plainToClass)(dtoClass, data);
    const errors = await (0, class_validator_1.validate)(dto);
    if (errors.length > 0) {
        const errorMessages = errors
            .map((error) => Object.values(error.constraints || {}).join(", "))
            .join("; ");
        throw new Error(`Errores de validación: ${errorMessages}`);
    }
    return dto;
}
function validateParam(param, paramName) {
    if (!param) {
        throw new Error(`Parámetro ${paramName} requerido`);
    }
    return param;
}
const handleError = (res, error, defaultStatus = 500) => {
    console.error("Error:", error);
    const status = error.status || defaultStatus;
    const message = error.message || "Error interno del servidor";
    res.status(status).json({ error: message });
};
router.get("/knowledge", auth_1.authenticateToken, async (req, res) => {
    try {
        const queryDto = await validateDto(knowledge_document_dto_1.KnowledgeDocumentQueryDto, req.query);
        const result = await knowledgeDocumentService.findAll(queryDto);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/search", auth_1.authenticateToken, async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || typeof q !== "string") {
            return res
                .status(400)
                .json({ error: "Parámetro de búsqueda requerido" });
        }
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        const documents = await knowledgeDocumentService.searchContent(q, parseInt(limit) || 10, userId, userPermissions);
        res.json(documents);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/search/suggestions", auth_1.authenticateToken, async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || typeof q !== "string" || q.length < 2) {
            return res.json({ documents: [], tags: [], cases: [] });
        }
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        const suggestions = await knowledgeDocumentService.getSearchSuggestions(q, parseInt(limit) || 5, userId, userPermissions);
        res.json(suggestions);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.post("/knowledge/search/advanced", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        const searchQuery = req.body;
        const result = await knowledgeDocumentService.enhancedSearch(searchQuery, userId, userPermissions);
        res.json({
            documents: result.documents,
            total: result.total,
            page: searchQuery.page || 1,
            totalPages: Math.ceil(result.total / (searchQuery.limit || 10)),
            searchStats: result.searchStats,
        });
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const documentId = validateParam(req.params.id, "id");
        const document = await knowledgeDocumentService.findOne(documentId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.post("/knowledge", auth_1.authenticateToken, async (req, res) => {
    try {
        const createDto = await validateDto(knowledge_document_dto_1.CreateKnowledgeDocumentDto, req.body);
        const userId = req.user.id;
        const document = await knowledgeDocumentService.create(createDto, userId);
        res.status(201).json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/knowledge/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const updateDto = await validateDto(knowledge_document_dto_1.UpdateKnowledgeDocumentDto, req.body);
        const userId = req.user.id;
        const documentId = validateParam(req.params.id, "id");
        const document = await knowledgeDocumentService.update(documentId, updateDto, userId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/knowledge/:id/publish", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID de documento requerido" });
        }
        const publishDto = await validateDto(knowledge_document_dto_1.PublishKnowledgeDocumentDto, req.body);
        const userId = req.user.id;
        const document = await knowledgeDocumentService.publish(id, publishDto, userId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/knowledge/:id/archive", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID de documento requerido" });
        }
        const archiveDto = await validateDto(knowledge_document_dto_1.ArchiveKnowledgeDocumentDto, req.body);
        const userId = req.user.id;
        const document = await knowledgeDocumentService.archive(id, archiveDto, userId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.delete("/knowledge/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID de documento requerido" });
        }
        await knowledgeDocumentService.remove(id);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/:id/versions", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID de documento requerido" });
        }
        const versions = await knowledgeDocumentService.getVersions(id);
        res.json(versions);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.get("/knowledge/:id/versions/:version", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id, version } = req.params;
        if (!id || !version) {
            return res
                .status(400)
                .json({ message: "ID de documento y número de versión requeridos" });
        }
        const versionNumber = parseInt(version);
        if (isNaN(versionNumber)) {
            return res.status(400).json({ message: "Número de versión inválido" });
        }
        const versionData = await knowledgeDocumentService.getVersion(id, versionNumber);
        res.json(versionData);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.get("/document-types", auth_1.authenticateToken, async (req, res) => {
    try {
        const activeOnly = req.query.active === "true";
        const types = await documentTypeService.findAll(activeOnly);
        res.json(types);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/document-types/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const type = await documentTypeService.findOne(req.params.id);
        res.json(type);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.post("/document-types", auth_1.authenticateToken, async (req, res) => {
    try {
        const createDto = await validateDto(document_type_dto_1.CreateDocumentTypeDto, req.body);
        const userId = req.user.id;
        const type = await documentTypeService.create(createDto, userId);
        res.status(201).json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/document-types/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const updateDto = await validateDto(document_type_dto_1.UpdateDocumentTypeDto, req.body);
        const type = await documentTypeService.update(req.params.id, updateDto);
        res.json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/document-types/:id/toggle", auth_1.authenticateToken, async (req, res) => {
    try {
        const type = await documentTypeService.toggleActive(req.params.id);
        res.json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.delete("/document-types/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        await documentTypeService.remove(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/document-types/:id/stats", auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await documentTypeService.getStats(req.params.id);
        res.json(stats);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.get("/knowledge/:id/feedback", auth_1.authenticateToken, async (req, res) => {
    try {
        const feedback = await documentFeedbackService.findByDocument(req.params.id);
        res.json(feedback);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/feedback/check/:documentId", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const documentId = req.params.documentId;
        const feedback = await documentFeedbackService.findUserFeedback(documentId, userId);
        res.json({
            hasFeedback: !!feedback,
            feedback: feedback || null,
        });
    }
    catch (error) {
        console.error(`📋 Error checking feedback:`, error);
        handleError(res, error, 400);
    }
});
router.post("/feedback", auth_1.authenticateToken, async (req, res) => {
    try {
        const createDto = await validateDto(document_feedback_dto_1.CreateDocumentFeedbackDto, req.body);
        const userId = req.user.id;
        const feedback = await documentFeedbackService.create(createDto, userId);
        res.status(201).json(feedback);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/feedback/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const updateDto = await validateDto(document_feedback_dto_1.UpdateDocumentFeedbackDto, req.body);
        const userId = req.user.id;
        const feedback = await documentFeedbackService.update(req.params.id, updateDto, userId);
        res.json(feedback);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.delete("/feedback/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await documentFeedbackService.remove(req.params.id, userId);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/:id/stats", auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await documentFeedbackService.getDocumentStats(req.params.id);
        res.json(stats);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.get("/feedback/my", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feedback = await documentFeedbackService.findByUser(userId);
        res.json(feedback);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.post("/knowledge/tags", (0, authorizationMiddleware_1.requirePermission)("tags.create.all"), async (req, res) => {
    try {
        const { tagName, color, category, description } = req.body;
        const userId = req.user?.id;
        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            return res.status(400).json({
                message: "El nombre de la etiqueta es requerido",
            });
        }
        const normalizedTagName = tagName.trim();
        const existingTag = await knowledgeTagService.findTagByName(normalizedTagName);
        if (existingTag) {
            return res.json(existingTag);
        }
        const tag = await knowledgeTagService.createTag({
            tagName: normalizedTagName,
            description,
            color,
            category: category,
        }, userId);
        res.status(201).json(tag);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags/:tagName", (0, authorizationMiddleware_1.requireAnyPermission)(["tags.read.all", "tags.manage.all"]), async (req, res) => {
    try {
        const { tagName } = req.params;
        if (!tagName) {
            return res.status(400).json({
                message: "Nombre de etiqueta requerido",
            });
        }
        const decodedTagName = decodeURIComponent(tagName).toLowerCase();
        const tag = await knowledgeTagService.findTagByName(decodedTagName);
        if (!tag) {
            return res.status(404).json({
                message: "Etiqueta no encontrada",
            });
        }
        res.json(tag);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags", (0, authorizationMiddleware_1.requireAnyPermission)(["tags.read.all", "tags.manage.all"]), async (req, res) => {
    try {
        const tags = await knowledgeTagService.getAllTagsWithUsage();
        res.json(tags);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.put("/knowledge/tags/:id", (0, authorizationMiddleware_1.requirePermission)("tags.update.all"), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!id || typeof id !== "string") {
            return res.status(400).json({
                message: "ID de etiqueta inválido",
            });
        }
        const updatedTag = await knowledgeTagService.updateTag(id, updates);
        res.json(updatedTag);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.delete("/knowledge/tags/:id", (0, authorizationMiddleware_1.requirePermission)("tags.delete.all"), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return res.status(400).json({
                message: "ID de etiqueta inválido",
            });
        }
        await knowledgeTagService.deleteTag(id);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags/popular", (0, authorizationMiddleware_1.requireAnyPermission)(["tags.read.all", "tags.manage.all"]), async (req, res) => {
    try {
        const { limit } = req.query;
        const limitNumber = limit ? parseInt(limit, 10) : 20;
        if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
            return res.status(400).json({
                message: "Límite debe ser un número entre 1 y 100",
            });
        }
        const tags = await knowledgeTagService.getPopularTags(limitNumber);
        res.json(tags);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.default = router;
