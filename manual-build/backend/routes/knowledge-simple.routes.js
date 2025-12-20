"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledge_document_service_1 = require("../services/knowledge-document.service");
const document_type_service_1 = require("../services/document-type.service");
const document_feedback_service_1 = require("../services/document-feedback.service");
const knowledge_tag_service_1 = require("../services/knowledge-tag.service");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auditMiddleware_1.AuditMiddleware.initializeAuditContext);
const knowledgeDocumentService = new knowledge_document_service_1.KnowledgeDocumentService();
const documentTypeService = new document_type_service_1.DocumentTypeService();
const knowledgeTagService = new knowledge_tag_service_1.KnowledgeTagService();
const documentFeedbackService = new document_feedback_service_1.DocumentFeedbackService();
const handleError = (res, error, defaultStatus = 500) => {
    console.error("Error:", error);
    const status = error.status || defaultStatus;
    const message = error.message || "Error interno del servidor";
    res.status(status).json({ error: message });
};
router.get("/knowledge", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        console.log(`📚 [KNOWLEDGE] Usuario ${userId} solicitando documentos con permisos: ${userPermissions.join(", ")}`);
        const result = await knowledgeDocumentService.findAll(req.query, userId, userPermissions);
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
        console.log(`🔍 [SEARCH] Usuario ${userId} buscando: "${q}" con permisos: ${userPermissions.join(", ")}`);
        const documents = await knowledgeDocumentService.searchContent(q, parseInt(limit) || 10, userId, userPermissions);
        res.json(documents);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/search/suggestions", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || typeof q !== "string" || q.length < 2) {
            return res.json({ documents: [], tags: [], cases: [] });
        }
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        console.log(`💡 [SUGGESTIONS] Usuario ${userId} buscando sugerencias: "${q}" con permisos: ${userPermissions.join(", ")}`);
        const suggestions = await knowledgeDocumentService.getSearchSuggestions(q, parseInt(limit) || 5, userId, userPermissions);
        res.json(suggestions);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.post("/knowledge/search/advanced", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        console.log(`🔎 [ADVANCED_SEARCH] Usuario ${userId} realizando búsqueda avanzada con permisos: ${userPermissions.join(", ")}`);
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
router.get("/knowledge/tags", (0, authorizationMiddleware_1.requireAnyPermission)([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const tags = await knowledgeTagService.getAllTagsWithUsage();
        res.json(tags);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags/popular", (0, authorizationMiddleware_1.requireAnyPermission)([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
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
router.get("/knowledge/tags/details/:id", (0, authorizationMiddleware_1.requireAnyPermission)([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID de etiqueta es requerido",
            });
        }
        const tag = await knowledgeTagService.getTagById(id);
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
router.get("/knowledge/tags/:id", (0, authorizationMiddleware_1.requireAnyPermission)([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID de etiqueta requerido",
            });
        }
        const tag = await knowledgeTagService.getTagById(id);
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
router.get("/knowledge/tags/:tagName", (0, authorizationMiddleware_1.requireAnyPermission)([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
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
router.post("/knowledge/tags", (0, authorizationMiddleware_1.requirePermission)("tags.create.all"), auditMiddleware_1.AuditMiddleware.auditCreate("knowledge_tags"), async (req, res) => {
    try {
        const { tagName, color, category, description } = req.body;
        const userId = req.user?.id;
        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            return res.status(400).json({
                message: "El nombre de la etiqueta es requerido",
            });
        }
        const normalizedTagName = tagName.trim();
        const tag = await knowledgeTagService.findOrCreateTag(normalizedTagName, userId);
        if (color || category || description) {
            const updatedTag = await knowledgeTagService.updateTag(tag.id, {
                ...(color && { color }),
                ...(category && { category }),
                ...(description && { description }),
            });
            res.status(201).json(updatedTag);
        }
        else {
            res.status(201).json(tag);
        }
    }
    catch (error) {
        handleError(res, error);
    }
});
router.put("/knowledge/tags/:id", (0, authorizationMiddleware_1.requirePermission)("tags.update.all"), auditMiddleware_1.AuditMiddleware.auditUpdate("knowledge_tags"), async (req, res) => {
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
router.delete("/knowledge/tags/:id", (0, authorizationMiddleware_1.requirePermission)("tags.delete.all"), auditMiddleware_1.AuditMiddleware.auditDelete("knowledge_tags"), async (req, res) => {
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
router.get("/knowledge/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const document = await knowledgeDocumentService.findOne(req.params.id);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.post("/knowledge", (0, authorizationMiddleware_1.requirePermission)("knowledge.create.own"), auditMiddleware_1.AuditMiddleware.auditCreate("knowledge_documents"), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        const result = await knowledgeDocumentService.create(req.body, userId);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/search", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const userId = req.user?.id;
        const userPermissions = req.user?.permissions || [];
        console.log(`🔍 [ADVANCED SEARCH] Usuario ${userId} buscando: "${searchTerm}" con permisos: ${userPermissions.join(", ")}`);
        const result = await knowledgeDocumentService.searchContent(searchTerm, limit, userId, userPermissions);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/:id", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
]), async (req, res) => {
    try {
        const documentId = req.params.id;
        if (!documentId) {
            return res.status(400).json({ error: "ID de documento requerido" });
        }
        const result = await knowledgeDocumentService.findOne(documentId);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.put("/knowledge/:id", (0, authorizationMiddleware_1.requireAnyPermission)([
    "knowledge.update.own",
    "knowledge.update.team",
    "knowledge.update.all",
]), auditMiddleware_1.AuditMiddleware.auditUpdate("knowledge_documents"), async (req, res) => {
    try {
        const userId = req.user?.id;
        const documentId = req.params.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        if (!documentId) {
            return res.status(400).json({ error: "ID de documento requerido" });
        }
        const result = await knowledgeDocumentService.update(documentId, req.body, userId);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/knowledge/:id/publish", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditUpdate("knowledge_documents"), async (req, res) => {
    try {
        const userId = req.user.id;
        const document = await knowledgeDocumentService.publish(req.params.id, req.body, userId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/knowledge/:id/archive", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditUpdate("knowledge_documents"), async (req, res) => {
    try {
        const userId = req.user.id;
        const document = await knowledgeDocumentService.archive(req.params.id, req.body, userId);
        res.json(document);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.delete("/knowledge/:id", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditDelete("knowledge_documents"), async (req, res) => {
    try {
        await knowledgeDocumentService.remove(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.get("/knowledge/:id/versions", auth_1.authenticateToken, async (req, res) => {
    try {
        const versions = await knowledgeDocumentService.getVersions(req.params.id);
        res.json(versions);
    }
    catch (error) {
        handleError(res, error, 404);
    }
});
router.get("/knowledge/:id/versions/:version", auth_1.authenticateToken, async (req, res) => {
    try {
        const version = await knowledgeDocumentService.getVersion(req.params.id, parseInt(req.params.version));
        res.json(version);
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
router.post("/document-types", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditCreate("document_types"), async (req, res) => {
    try {
        const userId = req.user.id;
        const type = await documentTypeService.create(req.body, userId);
        res.status(201).json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/document-types/:id", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditUpdate("document_types"), async (req, res) => {
    try {
        const type = await documentTypeService.update(req.params.id, req.body);
        res.json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/document-types/:id/toggle", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditUpdate("document_types"), async (req, res) => {
    try {
        const type = await documentTypeService.toggleActive(req.params.id);
        res.json(type);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.delete("/document-types/:id", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditDelete("document_types"), async (req, res) => {
    try {
        await documentTypeService.remove(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        handleError(res, error, 400);
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
        handleError(res, error, 400);
    }
});
router.post("/feedback", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feedback = await documentFeedbackService.create(req.body, userId);
        res.status(201).json(feedback);
    }
    catch (error) {
        handleError(res, error, 400);
    }
});
router.put("/feedback/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feedback = await documentFeedbackService.update(req.params.id, req.body, userId);
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
router.post("/knowledge/tags", auth_1.authenticateToken, async (req, res) => {
    try {
        const { tagName, color, category, description } = req.body;
        const userId = req.user?.id;
        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            return res.status(400).json({
                message: "El nombre de la etiqueta es requerido",
            });
        }
        const normalizedTagName = tagName.trim();
        const tag = await knowledgeTagService.findOrCreateTag(normalizedTagName, userId);
        if (color || category || description) {
            const updatedTag = await knowledgeTagService.updateTag(tag.id, {
                ...(color && { color }),
                ...(category && { category }),
                ...(description && { description }),
            });
            res.status(201).json(updatedTag);
        }
        else {
            res.status(201).json(tag);
        }
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags/popular", auth_1.authenticateToken, async (req, res) => {
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
router.get("/knowledge/tags", auth_1.authenticateToken, async (req, res) => {
    try {
        const tags = await knowledgeTagService.getAllTagsWithUsage();
        res.json(tags);
    }
    catch (error) {
        handleError(res, error);
    }
});
router.get("/knowledge/tags/:tagName", auth_1.authenticateToken, async (req, res) => {
    try {
        const { tagName } = req.params;
        if (!tagName) {
            return res.status(400).json({
                message: "Nombre de etiqueta requerido",
            });
        }
        const decodedTagName = decodeURIComponent(tagName);
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
router.delete("/knowledge/tags/:id", auth_1.authenticateToken, auditMiddleware_1.AuditMiddleware.auditDelete("knowledge_tags"), async (req, res) => {
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
exports.default = router;
