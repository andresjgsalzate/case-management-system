"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const file_upload_service_1 = require("../services/file-upload.service");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auditMiddleware_1.AuditMiddleware.initializeAuditContext);
router.post("/knowledge/upload/:documentId", file_upload_service_1.uploadConfig.array("files", 10), async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        if (!documentId) {
            return res.status(400).json({ error: "ID del documento requerido" });
        }
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No se recibieron archivos" });
        }
        const uploadedFiles = [];
        const errors = [];
        for (const file of files) {
            try {
                const attachment = await file_upload_service_1.fileUploadService.processUploadedFile(file, documentId, userId);
                uploadedFiles.push(attachment);
            }
            catch (error) {
                console.error("Error procesando archivo:", error);
                errors.push({
                    fileName: file.originalname,
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        }
        res.status(200).json({
            message: "Proceso de carga completado",
            uploaded: uploadedFiles,
            errors: errors,
            totalUploaded: uploadedFiles.length,
            totalErrors: errors.length,
        });
    }
    catch (error) {
        console.error("Error en carga de archivos:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});
router.get("/knowledge/attachments/:documentId", async (req, res) => {
    try {
        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({ error: "ID del documento requerido" });
        }
        const attachments = await file_upload_service_1.fileUploadService.getDocumentAttachments(documentId);
        res.status(200).json({
            attachments: attachments.map((attachment) => ({
                id: attachment.id,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                fileType: attachment.fileType,
                createdAt: attachment.createdAt,
                uploadedBy: attachment.uploadedBy,
                downloadUrl: `/api/files/knowledge/download/${path_1.default.basename(attachment.filePath)}`,
            })),
        });
    }
    catch (error) {
        console.error("Error obteniendo archivos adjuntos:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});
router.get("/knowledge/download/:fileName", auditMiddleware_1.AuditMiddleware.auditCreate("file_downloads"), async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({ error: "Nombre del archivo requerido" });
        }
        const fileInfo = await file_upload_service_1.fileUploadService.getFileForDownload(fileName);
        if (!fs_1.default.existsSync(fileInfo.filePath)) {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }
        res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.originalName}"`);
        res.setHeader("Content-Type", fileInfo.mimeType);
        res.sendFile(path_1.default.resolve(fileInfo.filePath));
    }
    catch (error) {
        console.error("Error descargando archivo:", error);
        if (error instanceof Error && error.message === "Archivo no encontrado") {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }
        res.status(500).json({
            error: "Error interno del servidor",
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});
router.get("/knowledge/view/:fileName", auditMiddleware_1.AuditMiddleware.auditCreate("file_views"), async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({ error: "Nombre del archivo requerido" });
        }
        const fileInfo = await file_upload_service_1.fileUploadService.getFileForDownload(fileName);
        if (!fs_1.default.existsSync(fileInfo.filePath)) {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }
        res.setHeader("Content-Type", fileInfo.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${fileInfo.originalName}"`);
        res.sendFile(path_1.default.resolve(fileInfo.filePath));
    }
    catch (error) {
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
router.delete("/knowledge/:attachmentId", async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        if (!attachmentId) {
            return res.status(400).json({ error: "ID del archivo requerido" });
        }
        const success = await file_upload_service_1.fileUploadService.deleteFile(attachmentId, userId);
        if (success) {
            res.status(200).json({ message: "Archivo eliminado correctamente" });
        }
        else {
            res.status(500).json({ error: "No se pudo eliminar el archivo" });
        }
    }
    catch (error) {
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
});
router.get("/knowledge/info/:attachmentId", async (req, res) => {
    try {
        const { attachmentId } = req.params;
        if (!attachmentId) {
            return res.status(400).json({ error: "ID del archivo requerido" });
        }
        res.status(200).json({
            message: "Funcionalidad de información del archivo en desarrollo",
        });
    }
    catch (error) {
        console.error("Error obteniendo información del archivo:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});
exports.default = router;
