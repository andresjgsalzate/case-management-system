"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessingService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class FileProcessingService {
    static async generateFileHash(filePath) {
        try {
            const fileBuffer = await promises_1.default.readFile(filePath);
            return crypto_1.default.createHash("sha256").update(fileBuffer).digest("hex");
        }
        catch (error) {
            console.error(`❌ Error generando hash para ${filePath}:`, error);
            throw error;
        }
    }
    static async checkDuplicateFile(fileHash, uploadsDir) {
        try {
            const findCommand = `find "${uploadsDir}" -name "*${fileHash.substring(0, 16)}*" -type f`;
            const { stdout } = await execAsync(findCommand);
            if (stdout.trim()) {
                const existingFile = stdout.trim().split("\n")[0];
                if (existingFile) {
                    console.log(`🔍 Archivo duplicado encontrado: ${existingFile}`);
                    return existingFile;
                }
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    static async generateThumbnail(inputPath, outputDir, fileName) {
        try {
            const fileExtension = path_1.default.extname(inputPath).toLowerCase();
            if (!this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
                console.log(`ℹ️  Thumbnail no soportado para: ${fileExtension}`);
                return null;
            }
            await promises_1.default.mkdir(outputDir, { recursive: true });
            const thumbnailFileName = `thumb_${path_1.default.parse(fileName).name}.${this.THUMBNAIL_CONFIG.format}`;
            const thumbnailPath = path_1.default.join(outputDir, thumbnailFileName);
            await (0, sharp_1.default)(inputPath)
                .resize(this.THUMBNAIL_CONFIG.width, this.THUMBNAIL_CONFIG.height, {
                fit: "inside",
                withoutEnlargement: true,
            })
                .jpeg({
                quality: this.THUMBNAIL_CONFIG.quality,
                progressive: true,
            })
                .toFile(thumbnailPath);
            console.log(`📸 Thumbnail generado: ${thumbnailPath}`);
            return thumbnailPath;
        }
        catch (error) {
            console.error(`❌ Error generando thumbnail para ${inputPath}:`, error);
            return null;
        }
    }
    static async optimizeImage(inputPath, outputDir, fileName) {
        try {
            const fileExtension = path_1.default.extname(inputPath).toLowerCase();
            if (!this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
                return null;
            }
            await promises_1.default.mkdir(outputDir, { recursive: true });
            const optimizedFileName = `opt_${fileName}`;
            const optimizedPath = path_1.default.join(outputDir, optimizedFileName);
            let sharpInstance = (0, sharp_1.default)(inputPath);
            switch (fileExtension) {
                case ".jpg":
                case ".jpeg":
                    sharpInstance = sharpInstance.jpeg(this.IMAGE_OPTIMIZATION.jpeg);
                    break;
                case ".png":
                    sharpInstance = sharpInstance.png(this.IMAGE_OPTIMIZATION.png);
                    break;
                case ".webp":
                    sharpInstance = sharpInstance.webp(this.IMAGE_OPTIMIZATION.webp);
                    break;
                default:
                    sharpInstance = sharpInstance.jpeg(this.IMAGE_OPTIMIZATION.jpeg);
                    break;
            }
            await sharpInstance.toFile(optimizedPath);
            const originalStats = await promises_1.default.stat(inputPath);
            const optimizedStats = await promises_1.default.stat(optimizedPath);
            if (optimizedStats.size < originalStats.size) {
                const savings = (((originalStats.size - optimizedStats.size) / originalStats.size) *
                    100).toFixed(1);
                console.log(`🗜️  Imagen optimizada: ${fileName} (${savings}% reducción)`);
                return optimizedPath;
            }
            else {
                await promises_1.default.unlink(optimizedPath);
                console.log(`ℹ️  No se mejoró la compresión para: ${fileName}`);
                return null;
            }
        }
        catch (error) {
            console.error(`❌ Error optimizando imagen ${inputPath}:`, error);
            return null;
        }
    }
    static async generatePdfThumbnail(inputPath, outputDir, fileName) {
        try {
            await promises_1.default.mkdir(outputDir, { recursive: true });
            const thumbnailFileName = `pdf_thumb_${path_1.default.parse(fileName).name}.jpg`;
            const thumbnailPath = path_1.default.join(outputDir, thumbnailFileName);
            const convertCommand = `convert "${inputPath}[0]" -thumbnail 300x300 -background white -alpha remove "${thumbnailPath}"`;
            try {
                await execAsync(convertCommand);
                console.log(`📄 Thumbnail de PDF generado: ${thumbnailPath}`);
                return thumbnailPath;
            }
            catch (convertError) {
                console.log(`ℹ️  ImageMagick no disponible, intentando con pdf-poppler...`);
                console.log(`ℹ️  Thumbnail de PDF no disponible para: ${fileName}`);
                return null;
            }
        }
        catch (error) {
            console.error(`❌ Error generando thumbnail de PDF para ${inputPath}:`, error);
            return null;
        }
    }
    static async compressPdf(inputPath, outputDir, fileName) {
        try {
            await promises_1.default.mkdir(outputDir, { recursive: true });
            const compressedFileName = `compressed_${fileName}`;
            const compressedPath = path_1.default.join(outputDir, compressedFileName);
            const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${compressedPath}" "${inputPath}"`;
            try {
                await execAsync(gsCommand);
                const originalStats = await promises_1.default.stat(inputPath);
                const compressedStats = await promises_1.default.stat(compressedPath);
                if (compressedStats.size < originalStats.size) {
                    const savings = (((originalStats.size - compressedStats.size) / originalStats.size) *
                        100).toFixed(1);
                    console.log(`📊 PDF comprimido: ${fileName} (${savings}% reducción)`);
                    return compressedPath;
                }
                else {
                    await promises_1.default.unlink(compressedPath);
                    console.log(`ℹ️  No se mejoró la compresión para PDF: ${fileName}`);
                    return null;
                }
            }
            catch (gsError) {
                console.log(`ℹ️  Ghostscript no disponible para comprimir PDF: ${fileName}`);
                return null;
            }
        }
        catch (error) {
            console.error(`❌ Error comprimiendo PDF ${inputPath}:`, error);
            return null;
        }
    }
    static async processFile(filePath, documentDir, fileName, fileExtension) {
        const results = {
            fileHash: await this.generateFileHash(filePath),
        };
        const thumbnailsDir = path_1.default.join(documentDir, "thumbnails");
        const processedDir = path_1.default.join(documentDir, "processed");
        if (this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
            results.thumbnailPath = await this.generateThumbnail(filePath, thumbnailsDir, fileName);
        }
        else if (fileExtension === ".pdf") {
            results.thumbnailPath = await this.generatePdfThumbnail(filePath, thumbnailsDir, fileName);
        }
        if (this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
            results.processedPath = await this.optimizeImage(filePath, processedDir, fileName);
        }
        else if (fileExtension === ".pdf") {
            results.processedPath = await this.compressPdf(filePath, processedDir, fileName);
        }
        return results;
    }
    static async cleanupTempFiles(tempDir, maxAgeHours = 24) {
        try {
            const files = await promises_1.default.readdir(tempDir);
            const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
            let cleanedCount = 0;
            for (const file of files) {
                const filePath = path_1.default.join(tempDir, file);
                const stats = await promises_1.default.stat(filePath);
                if (stats.mtime.getTime() < cutoffTime) {
                    await promises_1.default.unlink(filePath);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                console.log(`🧹 Limpieza de archivos temporales: ${cleanedCount} archivos eliminados`);
            }
        }
        catch (error) {
            console.error("❌ Error en limpieza de archivos temporales:", error);
        }
    }
    static async getStorageStats(uploadsDir) {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                byType: {},
            };
            const scanDirectory = async (dir) => {
                const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path_1.default.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath);
                    }
                    else {
                        const fileStat = await promises_1.default.stat(fullPath);
                        const ext = path_1.default.extname(entry.name).toLowerCase() || "sin-extension";
                        stats.totalFiles++;
                        stats.totalSize += fileStat.size;
                        if (!stats.byType[ext]) {
                            stats.byType[ext] = { count: 0, size: 0 };
                        }
                        stats.byType[ext].count++;
                        stats.byType[ext].size += fileStat.size;
                    }
                }
            };
            await scanDirectory(uploadsDir);
            return stats;
        }
        catch (error) {
            console.error("❌ Error obteniendo estadísticas de almacenamiento:", error);
            return { totalFiles: 0, totalSize: 0, byType: {} };
        }
    }
}
exports.FileProcessingService = FileProcessingService;
FileProcessingService.THUMBNAIL_CONFIG = {
    width: 300,
    height: 300,
    quality: 80,
    format: "jpeg",
};
FileProcessingService.IMAGE_OPTIMIZATION = {
    jpeg: { quality: 85, progressive: true },
    png: { compressionLevel: 9, palette: true },
    webp: { quality: 80 },
};
FileProcessingService.THUMBNAIL_SUPPORTED = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tiff",
];
FileProcessingService.DOCUMENT_SUPPORTED = [".pdf", ".doc", ".docx"];
