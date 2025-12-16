import { Router, Request, Response } from "express";
import {
  uploadConfig,
  fileUploadService,
} from "../services/file-upload-simple.service";
import jwt from "jsonwebtoken";
const path = require("path");
const fs = require("fs");

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// Middleware de autenticación flexible que acepta token en header o query
const flexibleAuth = async (req: Request, res: Response, next: any) => {
  try {
    let token = null;
    let tokenSource = "none";
    let headerToken = null;
    let queryToken = null;

    // Extraer ambos tokens
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7);
    }

    if (req.query.token) {
      queryToken = req.query.token as string;
    }

    // PRIORIDAD 1: Intentar header primero (más confiable)
    if (headerToken) {
      token = headerToken;
      tokenSource = "header";
    }
    // PRIORIDAD 2: Si no hay header, usar query
    else if (queryToken) {
      token = queryToken;
      tokenSource = "query";
    }

    if (!token) {
      console.error("❌ [FLEXIBLE AUTH] No token provided");
      return res.status(401).json({ error: "Access token required" });
    }

    // Verificar el token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;

      (req as any).user = {
        id: decoded.userId, // Mapear userId a id
        userId: decoded.userId, // Mantener userId también
        ...decoded,
      };
      next();
    } catch (tokenError: any) {
      // Manejo inteligente de tokens expirados
      console.log("💥 [FLEXIBLE AUTH] Error verifying token:", {
        error: tokenError.message,
        source: tokenSource,
        hasHeaderFallback: !!headerToken,
        hasQueryFallback: !!queryToken,
      });

      // Si el token actual falló y tenemos un token alternativo, intentarlo
      let fallbackToken = null;
      let fallbackSource = "none";

      if (tokenSource === "query" && headerToken) {
        fallbackToken = headerToken;
        fallbackSource = "header-fallback";
      } else if (tokenSource === "header" && queryToken) {
        fallbackToken = queryToken;
        fallbackSource = "query-fallback";
      }

      if (fallbackToken) {
        try {
          const decoded = jwt.verify(fallbackToken, jwtSecret) as any;

          (req as any).user = {
            id: decoded.userId,
            userId: decoded.userId,
            ...decoded,
          };
          return next();
        } catch (fallbackError: any) {
          console.log("💥 [FLEXIBLE AUTH] Fallback token also failed:", {
            error: fallbackError.message,
          });
        }
      }

      throw tokenError;
    }
  } catch (error) {
    console.error("💥 [FLEXIBLE AUTH] Error verifying token:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Aplicar autenticación flexible a TODAS las rutas
router.use(flexibleAuth);

/**
 * Visualizar un archivo (para imágenes y PDFs) - REQUIERE AUTENTICACIÓN
 * Solo usuarios autenticados pueden ver archivos
 * GET /api/files/knowledge/view/:fileName
 */
router.get(
  "/knowledge/view/:fileName",
  async (req: AuthRequest, res: Response) => {
    console.log("🎯 [FILE VIEW] Request received:", {
      fileName: req.params.fileName,
      hasToken: !!(req.query.token || req.headers.authorization),
      userId: (req as any).user?.id,
      userAgent: req.headers["user-agent"],
      referer: req.headers.referer,
    });

    try {
      const { fileName } = req.params;
      const { token } = req.query;

      if (!fileName) {
        console.error("❌ [FILE VIEW] No filename provided");
        return res.status(400).json({ error: "Nombre del archivo requerido" });
      }

      console.log("🔍 [FILE VIEW] Searching for file:", fileName);
      const fileInfo = await fileUploadService.getFileForDownload(fileName);

      console.log("📄 [FILE VIEW] File info retrieved:", {
        filePath: fileInfo.filePath,
        originalName: fileInfo.originalName,
        mimeType: fileInfo.mimeType,
      });

      // Verificar que el archivo existe
      if (!fs.existsSync(fileInfo.filePath)) {
        console.error(
          "❌ [FILE VIEW] File not found on filesystem:",
          fileInfo.filePath
        );
        return res.status(404).json({ error: "Archivo no encontrado" });
      }

      console.log("✅ [FILE VIEW] File exists, sending response");

      // Configurar headers para visualización
      res.setHeader("Content-Type", fileInfo.mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileInfo.originalName}"`
      );

      // Enviar el archivo para visualización
      res.sendFile(path.resolve(fileInfo.filePath));
    } catch (error) {
      console.error("💥 [FILE VIEW] Error visualizando archivo:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        fileName: req.params.fileName,
      });

      if (error instanceof Error && error.message === "Archivo no encontrado") {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * Subir archivos para un documento de conocimiento - REQUIERE AUTENTICACIÓN
 * POST /api/files/knowledge/upload/:documentId
 */
router.post(
  "/knowledge/upload/:documentId",
  uploadConfig.array("files", 10),
  async (req: AuthRequest, res: Response) => {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      if (!documentId) {
        return res.status(400).json({ error: "ID del documento requerido" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No se recibieron archivos" });
      }

      // Procesar cada archivo
      const uploadedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          const attachment = await fileUploadService.processUploadedFile(
            file,
            documentId,
            userId
          );
          uploadedFiles.push(attachment);
        } catch (error) {
          console.error("Error procesando archivo:", error);
          errors.push({
            fileName: file.originalname,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }

      // Respuesta con resultados
      res.status(200).json({
        message: "Proceso de carga completado",
        uploaded: uploadedFiles,
        errors: errors,
        totalUploaded: uploadedFiles.length,
        totalErrors: errors.length,
      });
    } catch (error) {
      console.error("Error en carga de archivos:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * Obtener archivos adjuntos de un documento - REQUIERE AUTENTICACIÓN
 * GET /api/files/knowledge/attachments/:documentId
 */
router.get(
  "/knowledge/attachments/:documentId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        console.error("❌ [ATTACHMENTS] No document ID provided");
        return res.status(400).json({ error: "ID del documento requerido" });
      }

      const attachments = await fileUploadService.getDocumentAttachments(
        documentId
      );

      res.status(200).json({
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          fileType: attachment.fileType,
          createdAt: attachment.createdAt,
          uploadedBy: attachment.uploadedBy,
          downloadUrl: `/api/files/knowledge/download/${path.basename(
            attachment.filePath
          )}`,
        })),
      });
    } catch (error) {
      console.error("💥 [ATTACHMENTS] Error obteniendo archivos adjuntos:", {
        documentId: req.params.documentId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * Descargar un archivo específico - REQUIERE AUTENTICACIÓN
 * GET /api/files/knowledge/download/:fileName
 */
router.get(
  "/knowledge/download/:fileName",
  async (req: AuthRequest, res: Response) => {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        return res.status(400).json({ error: "Nombre del archivo requerido" });
      }

      const fileInfo = await fileUploadService.getFileForDownload(fileName);

      // Verificar que el archivo existe
      if (!fs.existsSync(fileInfo.filePath)) {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }

      // Configurar headers para la descarga
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileInfo.originalName}"`
      );
      res.setHeader("Content-Type", fileInfo.mimeType);

      // Enviar el archivo
      res.sendFile(path.resolve(fileInfo.filePath));
    } catch (error) {
      console.error("Error descargando archivo:", error);
      if (error instanceof Error && error.message === "Archivo no encontrado") {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * Eliminar un archivo adjunto - REQUIERE AUTENTICACIÓN
 * DELETE /api/files/knowledge/:attachmentId
 */
router.delete(
  "/knowledge/:attachmentId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { attachmentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      if (!attachmentId) {
        return res.status(400).json({ error: "ID del archivo requerido" });
      }

      const success = await fileUploadService.deleteFile(attachmentId, userId);

      if (success) {
        res.status(200).json({ message: "Archivo eliminado correctamente" });
      } else {
        res.status(500).json({ error: "No se pudo eliminar el archivo" });
      }
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      if (error instanceof Error && error.message.includes("permisos")) {
        return res.status(403).json({ error: error.message });
      }
      if (error instanceof Error && error.message === "Archivo no encontrado") {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

export default router;
