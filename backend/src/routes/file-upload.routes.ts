import { Router, Request, Response } from "express";
import {
  uploadConfig,
  fileUploadService,
} from "../services/file-upload.service";
import { authenticateToken } from "../middleware/auth";
import path from "path";
import fs from "fs";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * Subir archivos para un documento de conocimiento
 * POST /api/files/knowledge/upload/:documentId
 */
router.post(
  "/knowledge/upload/:documentId",
  uploadConfig.array("files", 10),
  async (req: Request, res: Response) => {
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
 * Obtener archivos adjuntos de un documento
 * GET /api/files/knowledge/attachments/:documentId
 */
router.get(
  "/knowledge/attachments/:documentId",
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
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
      console.error("Error obteniendo archivos adjuntos:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

/**
 * Descargar un archivo específico
 * GET /api/files/knowledge/download/:fileName
 */
router.get(
  "/knowledge/download/:fileName",
  async (req: Request, res: Response) => {
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
 * Visualizar un archivo (para imágenes y PDFs)
 * GET /api/files/knowledge/view/:fileName
 */
router.get("/knowledge/view/:fileName", async (req: Request, res: Response) => {
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

    // Configurar headers para visualización
    res.setHeader("Content-Type", fileInfo.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileInfo.originalName}"`
    );

    // Enviar el archivo para visualización
    res.sendFile(path.resolve(fileInfo.filePath));
  } catch (error) {
    console.error("Error visualizando archivo:", error);
    if (error instanceof Error && error.message === "Archivo no encontrado") {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }
    res.status(500).json({
      error: "Error interno del servidor",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * Eliminar un archivo adjunto
 * DELETE /api/files/knowledge/:attachmentId
 */
router.delete(
  "/knowledge/:attachmentId",
  async (req: Request, res: Response) => {
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

/**
 * Obtener información de un archivo específico (para BlockNote)
 * GET /api/files/knowledge/info/:attachmentId
 */
router.get(
  "/knowledge/info/:attachmentId",
  async (req: Request, res: Response) => {
    try {
      const { attachmentId } = req.params;

      if (!attachmentId) {
        return res.status(400).json({ error: "ID del archivo requerido" });
      }

      // Esta funcionalidad se podría implementar en el servicio
      // Por ahora, devolvemos una respuesta básica
      res.status(200).json({
        message: "Funcionalidad de información del archivo en desarrollo",
      });
    } catch (error) {
      console.error("Error obteniendo información del archivo:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
);

export default router;
