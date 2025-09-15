import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { AppDataSource } from "../config/database";
import { KnowledgeDocumentService } from "../services/knowledge-document.service";
import { KnowledgeTagService } from "../services/knowledge-tag.service";
import { DocumentTypeService } from "../services/document-type.service";
import { DocumentFeedbackService } from "../services/document-feedback.service";
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  PublishKnowledgeDocumentDto,
  ArchiveKnowledgeDocumentDto,
} from "../dto/knowledge-document.dto";
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from "../dto/document-type.dto";
import {
  CreateDocumentFeedbackDto,
  UpdateDocumentFeedbackDto,
} from "../dto/document-feedback.dto";
import { authenticateToken } from "../middleware/auth"; // Asumiendo que tienes middleware de auth
import {
  requirePermission,
  requireAnyPermission,
} from "../middleware/authorizationMiddleware";

const router = Router();

// Inicializar servicios
const knowledgeDocumentService = new KnowledgeDocumentService(AppDataSource);
const knowledgeTagService = new KnowledgeTagService(AppDataSource);
const documentTypeService = new DocumentTypeService(AppDataSource);
const documentFeedbackService = new DocumentFeedbackService(AppDataSource);

// Helper para validar DTOs
async function validateDto<T extends object>(
  dtoClass: new () => T,
  data: any
): Promise<T> {
  const dto = plainToClass(dtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(", "))
      .join("; ");
    throw new Error(`Errores de validación: ${errorMessages}`);
  }

  return dto;
}

// Helper para validar parámetros de ruta
function validateParam(param: string | undefined, paramName: string): string {
  if (!param) {
    throw new Error(`Parámetro ${paramName} requerido`);
  }
  return param;
}

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
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const queryDto = await validateDto(KnowledgeDocumentQueryDto, req.query);
      const result = await knowledgeDocumentService.findAll(queryDto);
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
      const documentId = validateParam(req.params.id!, "id");
      const document = await knowledgeDocumentService.findOne(documentId);
      res.json(document);
    } catch (error) {
      handleError(res, error, 404);
    }
  }
);

// POST /api/knowledge - Crear nuevo documento
router.post(
  "/knowledge",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const createDto = await validateDto(CreateKnowledgeDocumentDto, req.body);
      const userId = (req as any).user.id; // Del middleware de auth
      const document = await knowledgeDocumentService.create(createDto, userId);
      res.status(201).json(document);
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
      const updateDto = await validateDto(UpdateKnowledgeDocumentDto, req.body);
      const userId = (req as any).user.id;
      const documentId = validateParam(req.params.id!, "id");
      const document = await knowledgeDocumentService.update(
        documentId,
        updateDto,
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
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "ID de documento requerido" });
      }

      const publishDto = await validateDto(
        PublishKnowledgeDocumentDto,
        req.body
      );
      const userId = (req as any).user.id;
      const document = await knowledgeDocumentService.publish(
        id,
        publishDto,
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
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "ID de documento requerido" });
      }

      const archiveDto = await validateDto(
        ArchiveKnowledgeDocumentDto,
        req.body
      );
      const userId = (req as any).user.id;
      const document = await knowledgeDocumentService.archive(
        id,
        archiveDto,
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
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "ID de documento requerido" });
      }

      await knowledgeDocumentService.remove(id);
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
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "ID de documento requerido" });
      }

      const versions = await knowledgeDocumentService.getVersions(id);
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

      const versionData = await knowledgeDocumentService.getVersion(
        id,
        versionNumber
      );
      res.json(versionData);
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
      const createDto = await validateDto(CreateDocumentTypeDto, req.body);
      const userId = (req as any).user.id;
      const type = await documentTypeService.create(createDto, userId);
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
      const updateDto = await validateDto(UpdateDocumentTypeDto, req.body);
      const type = await documentTypeService.update(req.params.id!, updateDto);
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

// GET /api/document-types/:id/stats - Estadísticas del tipo
router.get(
  "/document-types/:id/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const stats = await documentTypeService.getStats(req.params.id!);
      res.json(stats);
    } catch (error) {
      handleError(res, error, 404);
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
      console.error(`📋 Error checking feedback:`, error);
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
      const createDto = await validateDto(CreateDocumentFeedbackDto, req.body);
      const userId = (req as any).user.id;
      const feedback = await documentFeedbackService.create(createDto, userId);
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
      const updateDto = await validateDto(UpdateDocumentFeedbackDto, req.body);
      const userId = (req as any).user.id;
      const feedback = await documentFeedbackService.update(
        req.params.id!,
        updateDto,
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

// ================================
// KNOWLEDGE DOCUMENT TAGS ROUTES
// ================================

// POST /api/knowledge/tags - Crear una nueva etiqueta
router.post(
  "/knowledge/tags",
  requirePermission("tags.create"),
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

      // Check if tag already exists
      const existingTag = await knowledgeTagService.findTagByName(
        normalizedTagName
      );
      if (existingTag) {
        return res.json(existingTag);
      }

      // Create new tag with color and category system
      const tag = await knowledgeTagService.createTag(
        {
          tagName: normalizedTagName,
          description,
          color,
          category: category as any,
        },
        userId
      );
      res.status(201).json(tag);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// GET /api/knowledge/tags/:tagName - Obtener etiqueta por nombre
router.get(
  "/knowledge/tags/:tagName",
  requireAnyPermission(["tags.read.all", "tags.manage.all"]),
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

// GET /api/knowledge/tags - Obtener todas las etiquetas
router.get(
  "/knowledge/tags",
  requireAnyPermission(["tags.read.all", "tags.manage.all"]),
  async (req: Request, res: Response) => {
    try {
      const tags = await knowledgeTagService.getAllTagsWithUsage();
      res.json(tags);
    } catch (error) {
      handleError(res, error);
    }
  }
);

// PUT /api/knowledge/tags/:id - Actualizar etiqueta
router.put(
  "/knowledge/tags/:id",
  requirePermission("tags.update"),
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
  requirePermission("tags.delete"),
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

// GET /api/knowledge/tags/popular - Obtener etiquetas populares
router.get(
  "/knowledge/tags/popular",
  requireAnyPermission(["tags.read.all", "tags.manage.all"]),
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

export default router;
