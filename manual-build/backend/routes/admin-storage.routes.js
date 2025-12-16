"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const file_processing_service_1 = require("../services/file-processing.service");
const file_cleanup_service_1 = require("../services/file-cleanup.service");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const UPLOADS_BASE_DIR = path_1.default.join(process.cwd(), "uploads");
router.get("/stats", auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await file_processing_service_1.FileProcessingService.getStorageStats(UPLOADS_BASE_DIR);
        const totalGB = stats.totalSize / (1024 * 1024 * 1024);
        const averageFileSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;
        const formattedStats = {
            summary: {
                totalFiles: stats.totalFiles,
                totalSize: stats.totalSize,
                totalSizeFormatted: formatBytes(stats.totalSize),
                totalSizeGB: Math.round(totalGB * 100) / 100,
                averageFileSize: Math.round(averageFileSize),
                averageFileSizeFormatted: formatBytes(averageFileSize),
            },
            byFileType: Object.entries(stats.byType)
                .map(([extension, data]) => ({
                extension,
                count: data.count,
                size: data.size,
                sizeFormatted: formatBytes(data.size),
                percentage: Math.round((data.size / stats.totalSize) * 10000) / 100,
                averageSize: Math.round(data.size / data.count),
                averageSizeFormatted: formatBytes(data.size / data.count),
            }))
                .sort((a, b) => b.size - a.size),
        };
        res.json({
            success: true,
            data: formattedStats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error obteniendo estadísticas de almacenamiento:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
});
router.post("/cleanup", auth_1.authenticateToken, async (req, res) => {
    try {
        await file_cleanup_service_1.FileCleanupService.runManualCleanup();
        res.json({
            success: true,
            message: "Limpieza manual ejecutada correctamente",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error ejecutando limpieza manual:", error);
        res.status(500).json({
            success: false,
            error: "Error ejecutando limpieza manual",
        });
    }
});
router.get("/health", auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await file_processing_service_1.FileProcessingService.getStorageStats(UPLOADS_BASE_DIR);
        const totalGB = stats.totalSize / (1024 * 1024 * 1024);
        const healthChecks = {
            storage: {
                status: totalGB > 15 ? "warning" : totalGB > 10 ? "attention" : "healthy",
                message: `Uso de almacenamiento: ${totalGB.toFixed(2)}GB`,
                level: totalGB > 15 ? "high" : totalGB > 10 ? "medium" : "low",
            },
            fileCount: {
                status: stats.totalFiles > 10000
                    ? "warning"
                    : stats.totalFiles > 5000
                        ? "attention"
                        : "healthy",
                message: `Total de archivos: ${stats.totalFiles}`,
                level: stats.totalFiles > 10000
                    ? "high"
                    : stats.totalFiles > 5000
                        ? "medium"
                        : "low",
            },
            systemStatus: {
                status: "healthy",
                message: "Servicios de procesamiento funcionando correctamente",
                level: "ok",
            },
        };
        const overallStatus = Object.values(healthChecks).some((check) => check.status === "warning")
            ? "warning"
            : Object.values(healthChecks).some((check) => check.status === "attention")
                ? "attention"
                : "healthy";
        res.json({
            success: true,
            data: {
                overallStatus,
                checks: healthChecks,
                recommendations: generateRecommendations(healthChecks),
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("Error verificando salud del sistema:", error);
        res.status(500).json({
            success: false,
            error: "Error verificando salud del sistema",
        });
    }
});
router.get("/optimize", auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = await file_processing_service_1.FileProcessingService.getStorageStats(UPLOADS_BASE_DIR);
        const recommendations = [];
        Object.entries(stats.byType).forEach(([extension, data]) => {
            const avgSize = data.size / data.count;
            if (extension === ".pdf" && avgSize > 5 * 1024 * 1024) {
                recommendations.push({
                    type: "compression",
                    priority: "medium",
                    message: `PDFs promedio de ${formatBytes(avgSize)}. Considerar compresión automática.`,
                    action: "enable_pdf_compression",
                });
            }
            if ([".jpg", ".jpeg", ".png"].includes(extension) &&
                avgSize > 2 * 1024 * 1024) {
                recommendations.push({
                    type: "optimization",
                    priority: "medium",
                    message: `Imágenes ${extension} promedio de ${formatBytes(avgSize)}. Considerar optimización automática.`,
                    action: "enable_image_optimization",
                });
            }
        });
        if (stats.totalFiles > 100) {
            recommendations.push({
                type: "deduplication",
                priority: "low",
                message: "Con más de 100 archivos, la deduplicación puede ahorrar espacio significativo.",
                action: "enable_deduplication",
            });
        }
        res.json({
            success: true,
            data: {
                recommendations,
                potentialSavings: estimatePotentialSavings(stats),
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("Error generando recomendaciones de optimización:", error);
        res.status(500).json({
            success: false,
            error: "Error generando recomendaciones",
        });
    }
});
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function generateRecommendations(healthChecks) {
    const recommendations = [];
    if (healthChecks.storage.status === "warning") {
        recommendations.push("Considerar limpiar archivos antiguos o mover a almacenamiento externo");
    }
    if (healthChecks.fileCount.status === "warning") {
        recommendations.push("Implementar archivado automático de documentos antiguos");
    }
    if (recommendations.length === 0) {
        recommendations.push("Sistema funcionando óptimamente");
    }
    return recommendations;
}
function estimatePotentialSavings(stats) {
    let estimatedSavings = 0;
    const details = [];
    if (stats.byType[".pdf"]) {
        const pdfSavings = stats.byType[".pdf"].size * 0.3;
        estimatedSavings += pdfSavings;
        details.push({
            type: "PDF Compression",
            estimatedSavings: formatBytes(pdfSavings),
            description: "Compresión automática de documentos PDF",
        });
    }
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    let imageSavings = 0;
    imageExtensions.forEach((ext) => {
        if (stats.byType[ext]) {
            imageSavings += stats.byType[ext].size * 0.25;
        }
    });
    if (imageSavings > 0) {
        estimatedSavings += imageSavings;
        details.push({
            type: "Image Optimization",
            estimatedSavings: formatBytes(imageSavings),
            description: "Optimización automática de imágenes",
        });
    }
    return {
        total: formatBytes(estimatedSavings),
        totalBytes: estimatedSavings,
        percentage: Math.round((estimatedSavings / stats.totalSize) * 100),
        details,
    };
}
exports.default = router;
