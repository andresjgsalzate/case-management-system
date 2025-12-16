"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const file_upload_simple_service_1 = require("../services/file-upload-simple.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path = require("path");
const fs = require("fs");
const router = (0, express_1.Router)();
const flexibleAuth = async (req, res, next) => {
    try {
        let token = null;
        let tokenSource = "none";
        let headerToken = null;
        let queryToken = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            headerToken = authHeader.substring(7);
        }
        if (req.query.token) {
            queryToken = req.query.token;
        }
        if (headerToken) {
            token = headerToken;
            tokenSource = "header";
        }
        else if (queryToken) {
            token = queryToken;
            tokenSource = "query";
        }
        if (!token) {
            console.error("❌ [FLEXIBLE AUTH] No token provided");
            return res.status(401).json({ error: "Access token required" });
        }
        const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            req.user = {
                id: decoded.userId,
                userId: decoded.userId,
                ...decoded,
            };
            next();
        }
        catch (tokenError) {
            console.log("💥 [FLEXIBLE AUTH] Error verifying token:", {
                error: tokenError.message,
                source: tokenSource,
                hasHeaderFallback: !!headerToken,
                hasQueryFallback: !!queryToken,
            });
            let fallbackToken = null;
            let fallbackSource = "none";
            if (tokenSource === "query" && headerToken) {
                fallbackToken = headerToken;
                fallbackSource = "header-fallback";
            }
            else if (tokenSource === "header" && queryToken) {
                fallbackToken = queryToken;
                fallbackSource = "query-fallback";
            }
            if (fallbackToken) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(fallbackToken, jwtSecret);
                    req.user = {
                        id: decoded.userId,
                        userId: decoded.userId,
                        ...decoded,
                    };
                    return next();
                }
                catch (fallbackError) {
                    console.log("💥 [FLEXIBLE AUTH] Fallback token also failed:", {
                        error: fallbackError.message,
                    });
                }
            }
            throw tokenError;
        }
    }
    catch (error) {
        console.error("💥 [FLEXIBLE AUTH] Error verifying token:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};
router.use(flexibleAuth);
router.get("/knowledge/view/:fileName", async (req, res) => {
    console.log("🎯 [FILE VIEW] Request received:", {
        fileName: req.params.fileName,
        hasToken: !!(req.query.token || req.headers.authorization),
        userId: req.user?.id,
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
        const fileInfo = await file_upload_simple_service_1.fileUploadService.getFileForDownload(fileName);
        console.log("📄 [FILE VIEW] File info retrieved:", {
            filePath: fileInfo.filePath,
            originalName: fileInfo.originalName,
            mimeType: fileInfo.mimeType,
        });
        if (!fs.existsSync(fileInfo.filePath)) {
            console.error("❌ [FILE VIEW] File not found on filesystem:", fileInfo.filePath);
            return res.status(404).json({ error: "Archivo no encontrado" });
        }
        console.log("✅ [FILE VIEW] File exists, sending response");
        res.setHeader("Content-Type", fileInfo.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${fileInfo.originalName}"`);
        res.sendFile(path.resolve(fileInfo.filePath));
    }
    catch (error) {
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
});
router.post("/knowledge/upload/:documentId", file_upload_simple_service_1.uploadConfig.array("files", 10), async (req, res) => {
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
                const attachment = await file_upload_simple_service_1.fileUploadService.processUploadedFile(file, documentId, userId);
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
            console.error("❌ [ATTACHMENTS] No document ID provided");
            return res.status(400).json({ error: "ID del documento requerido" });
        }
        const attachments = await file_upload_simple_service_1.fileUploadService.getDocumentAttachments(documentId);
        res.status(200).json({
            attachments: attachments.map((attachment) => ({
                id: attachment.id,
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                fileType: attachment.fileType,
                createdAt: attachment.createdAt,
                uploadedBy: attachment.uploadedBy,
                downloadUrl: `/api/files/knowledge/download/${path.basename(attachment.filePath)}`,
            })),
        });
    }
    catch (error) {
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
});
router.get("/knowledge/download/:fileName", async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({ error: "Nombre del archivo requerido" });
        }
        const fileInfo = await file_upload_simple_service_1.fileUploadService.getFileForDownload(fileName);
        if (!fs.existsSync(fileInfo.filePath)) {
            return res.status(404).json({ error: "Archivo no encontrado" });
        }
        res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.originalName}"`);
        res.setHeader("Content-Type", fileInfo.mimeType);
        res.sendFile(path.resolve(fileInfo.filePath));
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
        const success = await file_upload_simple_service_1.fileUploadService.deleteFile(attachmentId, userId);
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
exports.default = router;
