import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { KnowledgeDocumentService } from "../services/knowledge-document.service";
import { DocumentTypeService } from "../services/document-type.service";
import { DocumentFeedbackService } from "../services/document-feedback.service";
import { authenticateToken } from "../middleware/auth";
import {
  requirePermission,
  requirePermissionWithScope,
  requireAnyPermission,
} from "../middleware/authorizationMiddleware";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Inicializar servicios
const knowledgeDocumentService = new KnowledgeDocumentService();
const documentTypeService = new DocumentTypeService();
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
      const result = await knowledgeDocumentService.findAll(req.query as any);
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

      const documents = await knowledgeDocumentService.searchContent(
        q,
        parseInt(limit as string) || 10
      );
      res.json(documents);
    } catch (error) {
      handleError(res, error, 400);
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
      const result = await knowledgeDocumentService.searchContent(
        searchTerm,
        limit
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

// PUT /api/knowledge/:id - Actualizar documento
router.put(
  "/knowledge/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const document = await knowledgeDocumentService.update(
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

// PUT /api/knowledge/:id/publish - Publicar/despublicar documento
router.put(
  "/knowledge/:id/publish",
  authenticateToken,
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

export default router;
