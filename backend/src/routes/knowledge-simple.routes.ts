import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { KnowledgeDocumentService } from "../services/knowledge-document.service";
import { DocumentTypeService } from "../services/document-type.service";
import { DocumentFeedbackService } from "../services/document-feedback.service";
import { KnowledgeTagService } from "../services/knowledge-tag.service";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";
import {
  requirePermission,
  requirePermissionWithScope,
  requireAnyPermission,
} from "../middleware/authorizationMiddleware";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Inicializar servicios
const knowledgeDocumentService = new KnowledgeDocumentService();
const documentTypeService = new DocumentTypeService();
const knowledgeTagService = new KnowledgeTagService();
const documentFeedbackService = new DocumentFeedbackService();

// Helper para manejo de errores
const handleError = (
  res: Response,
  error: any,
  defaultStatus: number = 500
) => {
  console.error("Error:", error);
  const status = error.status || defaultStatus;
  const message = error.message || "Error interno del servidor";
  res.status(status).json({ error: message });
};

// ===========================================
// RUTAS DE DOCUMENTOS DE CONOCIMIENTO
// ===========================================

// GET /api/knowledge - Obtener documentos con filtros
router.get(
  "/knowledge",
  requireAnyPermission([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const userPermissions = (req as any).user?.permissions || [];

      console.log(
        `📚 [KNOWLEDGE] Usuario ${userId} solicitando documentos con permisos: ${userPermissions.join(
          ", "
        )}`
      );

      const result = await knowledgeDocumentService.findAll(
        req.query as any,
        userId,
        userPermissions
      );
      res.json(result);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/search - Búsqueda de contenido
router.get(
  "/knowledge/search",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { q, limit } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ error: "Parámetro de búsqueda requerido" });
      }

      const userId = (req as any).user?.id;
      const userPermissions = (req as any).user?.permissions || [];

      console.log(
        `🔍 [SEARCH] Usuario ${userId} buscando: "${q}" con permisos: ${userPermissions.join(
          ", "
        )}`
      );

      const documents = await knowledgeDocumentService.searchContent(
        q,
        parseInt(limit as string) || 10,
        userId,
        userPermissions
      );
      res.json(documents);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/search/suggestions - Sugerencias de búsqueda
router.get(
  "/knowledge/search/suggestions",
  requireAnyPermission([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const { q, limit } = req.query;
      if (!q || typeof q !== "string" || q.length < 2) {
        return res.json({ documents: [], tags: [], cases: [] });
      }

      const userId = (req as any).user?.id;
      const userPermissions = (req as any).user?.permissions || [];

      console.log(
        `💡 [SUGGESTIONS] Usuario ${userId} buscando sugerencias: "${q}" con permisos: ${userPermissions.join(
          ", "
        )}`
      );

      const suggestions = await knowledgeDocumentService.getSearchSuggestions(
        q,
        parseInt(limit as string) || 5,
        userId,
        userPermissions
      );
      res.json(suggestions);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// POST /api/knowledge/search/advanced - Búsqueda avanzada
router.post(
  "/knowledge/search/advanced",
  requireAnyPermission([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const userPermissions = (req as any).user?.permissions || [];

      console.log(
        `🔎 [ADVANCED_SEARCH] Usuario ${userId} realizando búsqueda avanzada con permisos: ${userPermissions.join(
          ", "
        )}`
      );

      const searchQuery = req.body;
      const result = await knowledgeDocumentService.enhancedSearch(
        searchQuery,
        userId,
        userPermissions
      );

      res.json({
        documents: result.documents,
        total: result.total,
        page: searchQuery.page || 1,
        totalPages: Math.ceil(result.total / (searchQuery.limit || 10)),
        searchStats: result.searchStats,
      });
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// ================================
// KNOWLEDGE DOCUMENT TAGS ROUTES
// ================================

// GET /api/knowledge/tags - Obtener todas las etiquetas
router.get(
  "/knowledge/tags",
  requireAnyPermission([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const tags = await knowledgeTagService.getAllTagsWithUsage();
      res.json(tags);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/popular - Obtener etiquetas populares
router.get(
  "/knowledge/tags/popular",
  requireAnyPermission([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string, 10) : 20;

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          message: "Límite debe ser un número entre 1 y 100",
        });
      }

      const tags = await knowledgeTagService.getPopularTags(limitNumber);
      res.json(tags);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/details/:id - Obtener detalles de una etiqueta específica
router.get(
  "/knowledge/tags/details/:id",
  requireAnyPermission([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/:id - Obtener etiqueta por ID con uso real
router.get(
  "/knowledge/tags/:id",
  requireAnyPermission([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/:tagName - Obtener etiqueta por nombre
router.get(
  "/knowledge/tags/:tagName",
  requireAnyPermission([
    "tags.read.all",
    "tags.manage.all",
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      handleError(res, error);
    }
  }
);

// POST /api/knowledge/tags - Crear una nueva etiqueta
router.post(
  "/knowledge/tags",
  // Permitir crear etiquetas a usuarios que pueden crear o editar documentos
  requireAnyPermission([
    "tags.create.own",
    "tags.create.all",
    "knowledge.create.own",
    "knowledge.update.own",
    "knowledge.update.all",
  ]),
  AuditMiddleware.auditCreate("knowledge_tags"),
  async (req: Request, res: Response) => {
    try {
      const { tagName, color, category, description } = req.body;
      const userId = (req as any).user?.id;

      if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
        return res.status(400).json({
          message: "El nombre de la etiqueta es requerido",
        });
      }

      const normalizedTagName = tagName.trim();

      // Usar findOrCreateTag que maneja la lógica de búsqueda y creación
      const tag = await knowledgeTagService.findOrCreateTag(
        normalizedTagName,
        userId
      );

      // Si se proporcionan metadatos adicionales, actualizar la etiqueta
      if (color || category || description) {
        const updatedTag = await knowledgeTagService.updateTag(tag.id, {
          ...(color && { color }),
          ...(category && { category }),
          ...(description && { description }),
        });
        res.status(201).json(updatedTag);
      } else {
        res.status(201).json(tag);
      }
    } catch (error) {
      handleError(res, error);
    }
  }
);

// PUT /api/knowledge/tags/:id - Actualizar etiqueta
router.put(
  "/knowledge/tags/:id",
  requirePermission("tags.update.all"),
  AuditMiddleware.auditUpdate("knowledge_tags"),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      handleError(res, error);
    }
  }
);

// DELETE /api/knowledge/tags/:id - Eliminar etiqueta por ID
router.delete(
  "/knowledge/tags/:id",
  requirePermission("tags.delete.all"),
  AuditMiddleware.auditDelete("knowledge_tags"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string") {
        return res.status(400).json({
          message: "ID de etiqueta inválido",
        });
      }

      await knowledgeTagService.deleteTag(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/:id - Obtener documento específico
router.get(
  "/knowledge/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const document = await knowledgeDocumentService.findOne(req.params.id!);
      res.json(document);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// POST /api/knowledge - Crear documento
router.post(
  "/knowledge",
  requirePermission("knowledge.create.own"),
  AuditMiddleware.auditCreate("knowledge_documents"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      const result = await knowledgeDocumentService.create(req.body, userId);
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/search - Búsqueda avanzada
router.get(
  "/knowledge/search",
  requireAnyPermission([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const userId = (req as any).user?.id;
      const userPermissions = (req as any).user?.permissions || [];

      console.log(
        `🔍 [ADVANCED SEARCH] Usuario ${userId} buscando: "${searchTerm}" con permisos: ${userPermissions.join(
          ", "
        )}`
      );

      const result = await knowledgeDocumentService.searchContent(
        searchTerm,
        limit,
        userId,
        userPermissions
      );
      res.json(result);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/:id - Obtener documento por ID
router.get(
  "/knowledge/:id",
  requireAnyPermission([
    "knowledge.read.own",
    "knowledge.read.team",
    "knowledge.read.all",
  ]),
  async (req: Request, res: Response) => {
    try {
      const documentId = req.params.id;
      if (!documentId) {
        return res.status(400).json({ error: "ID de documento requerido" });
      }
      const result = await knowledgeDocumentService.findOne(documentId);
      res.json(result);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// PUT /api/knowledge/:id - Actualizar documento
router.put(
  "/knowledge/:id",
  requireAnyPermission([
    "knowledge.update.own",
    "knowledge.update.team",
    "knowledge.update.all",
  ]),
  AuditMiddleware.auditUpdate("knowledge_documents"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const documentId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      if (!documentId) {
        return res.status(400).json({ error: "ID de documento requerido" });
      }
      const result = await knowledgeDocumentService.update(
        documentId,
        req.body,
        userId
      );
      res.json(result);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// NOTA: Esta ruta ya está definida arriba con middleware de autorización - eliminar duplicado

// PUT /api/knowledge/:id/publish - Publicar/despublicar documento
router.put(
  "/knowledge/:id/publish",
  authenticateToken,
  AuditMiddleware.auditUpdate("knowledge_documents"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const document = await knowledgeDocumentService.publish(
        req.params.id!,
        req.body,
        userId
      );
      res.json(document);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// PUT /api/knowledge/:id/archive - Archivar/desarchivar documento
router.put(
  "/knowledge/:id/archive",
  authenticateToken,
  AuditMiddleware.auditUpdate("knowledge_documents"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const document = await knowledgeDocumentService.archive(
        req.params.id!,
        req.body,
        userId
      );
      res.json(document);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// DELETE /api/knowledge/:id - Eliminar documento
router.delete(
  "/knowledge/:id",
  authenticateToken,
  AuditMiddleware.auditDelete("knowledge_documents"),
  async (req: Request, res: Response) => {
    try {
      await knowledgeDocumentService.remove(req.params.id!);
      res.status(204).send();
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/:id/versions - Obtener versiones del documento
router.get(
  "/knowledge/:id/versions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const versions = await knowledgeDocumentService.getVersions(
        req.params.id!
      );
      res.json(versions);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// GET /api/knowledge/:id/versions/:version - Obtener versión específica
router.get(
  "/knowledge/:id/versions/:version",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const version = await knowledgeDocumentService.getVersion(
        req.params.id!,
        parseInt(req.params.version!)
      );
      res.json(version);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// ===========================================
// RUTAS DE TIPOS DE DOCUMENTOS
// ===========================================

// GET /api/document-types - Obtener tipos de documentos
router.get(
  "/document-types",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === "true";
      const types = await documentTypeService.findAll(activeOnly);
      res.json(types);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/document-types/:id - Obtener tipo específico
router.get(
  "/document-types/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const type = await documentTypeService.findOne(req.params.id!);
      res.json(type);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// POST /api/document-types - Crear tipo de documento
router.post(
  "/document-types",
  authenticateToken,
  AuditMiddleware.auditCreate("document_types"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const type = await documentTypeService.create(req.body, userId);
      res.status(201).json(type);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// PUT /api/document-types/:id - Actualizar tipo de documento
router.put(
  "/document-types/:id",
  authenticateToken,
  AuditMiddleware.auditUpdate("document_types"),
  async (req: Request, res: Response) => {
    try {
      const type = await documentTypeService.update(req.params.id!, req.body);
      res.json(type);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// PUT /api/document-types/:id/toggle - Activar/desactivar tipo
router.put(
  "/document-types/:id/toggle",
  authenticateToken,
  AuditMiddleware.auditUpdate("document_types"),
  async (req: Request, res: Response) => {
    try {
      const type = await documentTypeService.toggleActive(req.params.id!);
      res.json(type);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// DELETE /api/document-types/:id - Eliminar tipo
router.delete(
  "/document-types/:id",
  authenticateToken,
  AuditMiddleware.auditDelete("document_types"),
  async (req: Request, res: Response) => {
    try {
      await documentTypeService.remove(req.params.id!);
      res.status(204).send();
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// ===========================================
// RUTAS DE FEEDBACK DE DOCUMENTOS
// ===========================================

// GET /api/knowledge/:id/feedback - Obtener feedback de un documento
router.get(
  "/knowledge/:id/feedback",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const feedback = await documentFeedbackService.findByDocument(
        req.params.id!
      );
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/feedback/check/:documentId - Verificar si el usuario ya ha dado feedback
router.get(
  "/feedback/check/:documentId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const documentId = req.params.documentId!;
      const feedback = await documentFeedbackService.findUserFeedback(
        documentId,
        userId
      );
      res.json({
        hasFeedback: !!feedback,
        feedback: feedback || null,
      });
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// POST /api/feedback - Crear feedback
router.post(
  "/feedback",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const feedback = await documentFeedbackService.create(req.body, userId);
      res.status(201).json(feedback);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// PUT /api/feedback/:id - Actualizar feedback
router.put(
  "/feedback/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const feedback = await documentFeedbackService.update(
        req.params.id!,
        req.body,
        userId
      );
      res.json(feedback);
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// DELETE /api/feedback/:id - Eliminar feedback
router.delete(
  "/feedback/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await documentFeedbackService.remove(req.params.id!, userId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error, 400);
    }
  }
);

// GET /api/knowledge/:id/stats - Estadísticas de feedback del documento
router.get(
  "/knowledge/:id/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const stats = await documentFeedbackService.getDocumentStats(
        req.params.id!
      );
      res.json(stats);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// GET /api/feedback/my - Obtener mi feedback
router.get(
  "/feedback/my",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const feedback = await documentFeedbackService.findByUser(userId);
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// ===========================================
// RUTAS DE ETIQUETAS
// ===========================================

// POST /api/knowledge/tags - Crear una nueva etiqueta
router.post(
  "/knowledge/tags",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { tagName, color, category, description } = req.body;
      const userId = (req as any).user?.id;

      if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
        return res.status(400).json({
          message: "El nombre de la etiqueta es requerido",
        });
      }

      const normalizedTagName = tagName.trim();

      // Usar findOrCreateTag que maneja la lógica de búsqueda y creación
      const tag = await knowledgeTagService.findOrCreateTag(
        normalizedTagName,
        userId
      );

      // Si se proporcionan metadatos adicionales, actualizar la etiqueta
      if (color || category || description) {
        const updatedTag = await knowledgeTagService.updateTag(tag.id, {
          ...(color && { color }),
          ...(category && { category }),
          ...(description && { description }),
        });
        res.status(201).json(updatedTag);
      } else {
        res.status(201).json(tag);
      }
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/popular - Obtener etiquetas populares (debe ir ANTES de /:tagName)
router.get(
  "/knowledge/tags/popular",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string, 10) : 20;

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          message: "Límite debe ser un número entre 1 y 100",
        });
      }

      const tags = await knowledgeTagService.getPopularTags(limitNumber);
      res.json(tags);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags - Obtener todas las etiquetas
router.get(
  "/knowledge/tags",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const tags = await knowledgeTagService.getAllTagsWithUsage();
      res.json(tags);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/:tagName - Obtener etiqueta por nombre
router.get(
  "/knowledge/tags/:tagName",
  authenticateToken,
  async (req: Request, res: Response) => {
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
    } catch (error) {
      handleError(res, error);
    }
  }
);

// DELETE /api/knowledge/tags/:id - Eliminar etiqueta por ID
router.delete(
  "/knowledge/tags/:id",
  authenticateToken,
  AuditMiddleware.auditDelete("knowledge_tags"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string") {
        return res.status(400).json({
          message: "ID de etiqueta inválido",
        });
      }

      await knowledgeTagService.deleteTag(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
