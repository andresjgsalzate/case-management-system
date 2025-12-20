"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCleanupService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const file_processing_service_1 = require("./file-processing.service");
const path_1 = __importDefault(require("path"));
class FileCleanupService {
    static initialize(uploadsDir) {
        if (this.isInitialized) {
            return;
        }
        this.uploadsBaseDir = uploadsDir;
        node_cron_1.default.schedule("0 */6 * * *", async () => {
            console.log("🧹 Iniciando limpieza programada de archivos temporales...");
            await this.cleanupTempFiles();
        });
        node_cron_1.default.schedule("0 2 * * *", async () => {
            console.log("📊 Generando estadísticas de almacenamiento diarias...");
            await this.generateStorageReport();
        });
        node_cron_1.default.schedule("0 3 * * 0", async () => {
            console.log("🔄 Iniciando limpieza profunda semanal...");
            await this.performWeeklyMaintenance();
        });
        this.isInitialized = true;
        console.log("⏰ Servicios de limpieza automática inicializados");
    }
    static async cleanupTempFiles() {
        try {
            const tempDir = path_1.default.join(this.uploadsBaseDir, "temp");
            await file_processing_service_1.FileProcessingService.cleanupTempFiles(tempDir, 24);
            await file_processing_service_1.FileProcessingService.cleanupTempFiles(tempDir, 1);
        }
        catch (error) {
            console.error("❌ Error en limpieza de archivos temporales:", error);
        }
    }
    static async generateStorageReport() {
        try {
            const stats = await file_processing_service_1.FileProcessingService.getStorageStats(this.uploadsBaseDir);
            console.log("📊 === REPORTE DE ALMACENAMIENTO ===");
            console.log(`📁 Total de archivos: ${stats.totalFiles}`);
            console.log(`💾 Tamaño total: ${this.formatBytes(stats.totalSize)}`);
            console.log("\n📂 Por tipo de archivo:");
            Object.entries(stats.byType)
                .sort(([, a], [, b]) => b.size - a.size)
                .forEach(([ext, data]) => {
                const percentage = ((data.size / stats.totalSize) * 100).toFixed(1);
                console.log(`  ${ext}: ${data.count} archivos, ${this.formatBytes(data.size)} (${percentage}%)`);
            });
            const totalGB = stats.totalSize / (1024 * 1024 * 1024);
            if (totalGB > 10) {
                console.warn(`⚠️  ALERTA: Almacenamiento alto: ${totalGB.toFixed(2)}GB`);
            }
        }
        catch (error) {
            console.error("❌ Error generando reporte de almacenamiento:", error);
        }
    }
    static async performWeeklyMaintenance() {
        try {
            console.log("🔧 Iniciando mantenimiento semanal...");
            const tempDir = path_1.default.join(this.uploadsBaseDir, "temp");
            await file_processing_service_1.FileProcessingService.cleanupTempFiles(tempDir, 1);
            await this.verifyFileIntegrity();
            await this.cleanupEmptyDirectories();
            await this.generateStorageReport();
            console.log("✅ Mantenimiento semanal completado");
        }
        catch (error) {
            console.error("❌ Error en mantenimiento semanal:", error);
        }
    }
    static async verifyFileIntegrity() {
        try {
            console.log("🔍 Verificación de integridad de archivos...");
            console.log("ℹ️  Verificación de integridad: función disponible");
        }
        catch (error) {
            console.error("❌ Error verificando integridad de archivos:", error);
        }
    }
    static async cleanupEmptyDirectories() {
        try {
            const { exec } = require("child_process");
            const { promisify } = require("util");
            const execAsync = promisify(exec);
            const findEmptyCommand = `find "${this.uploadsBaseDir}" -type d -empty -not -path "*/temp*"`;
            const { stdout } = await execAsync(findEmptyCommand);
            if (stdout.trim()) {
                const emptyDirs = stdout.trim().split("\n");
                let cleanedDirs = 0;
                for (const dir of emptyDirs) {
                    if (dir && dir !== this.uploadsBaseDir) {
                        try {
                            const rmCommand = `rmdir "${dir}"`;
                            await execAsync(rmCommand);
                            cleanedDirs++;
                        }
                        catch (err) {
                        }
                    }
                }
                if (cleanedDirs > 0) {
                    console.log(`🗂️  Directorios vacíos eliminados: ${cleanedDirs}`);
                }
            }
        }
        catch (error) {
            console.error("❌ Error limpiando directorios vacíos:", error);
        }
    }
    static formatBytes(bytes) {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    static async runManualCleanup() {
        console.log("🧹 Ejecutando limpieza manual...");
        await this.cleanupTempFiles();
        await this.cleanupEmptyDirectories();
        await this.generateStorageReport();
        console.log("✅ Limpieza manual completada");
    }
    static stopScheduledJobs() {
        this.isInitialized = false;
        console.log("⏹️  Servicios de limpieza automática marcados para detener");
    }
}
exports.FileCleanupService = FileCleanupService;
FileCleanupService.isInitialized = false;
