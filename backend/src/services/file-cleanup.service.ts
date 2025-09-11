import cron from "node-cron";
import { FileProcessingService } from "./file-processing.service";
import path from "path";

/**
 * Servicio de limpieza automática y mantenimiento de archivos
 */
export class FileCleanupService {
  private static isInitialized = false;

  // Directorio base de uploads
  private static uploadsBaseDir: string;

  /**
   * Inicializar servicios de limpieza automática
   */
  static initialize(uploadsDir: string): void {
    if (this.isInitialized) {
      return;
    }

    this.uploadsBaseDir = uploadsDir;

    // Limpieza de archivos temporales cada 6 horas
    cron.schedule("0 */6 * * *", async () => {
      console.log("🧹 Iniciando limpieza programada de archivos temporales...");
      await this.cleanupTempFiles();
    });

    // Estadísticas de almacenamiento diarias a las 02:00
    cron.schedule("0 2 * * *", async () => {
      console.log("📊 Generando estadísticas de almacenamiento diarias...");
      await this.generateStorageReport();
    });

    // Limpieza profunda semanal los domingos a las 03:00
    cron.schedule("0 3 * * 0", async () => {
      console.log("🔄 Iniciando limpieza profunda semanal...");
      await this.performWeeklyMaintenance();
    });

    this.isInitialized = true;
    console.log("⏰ Servicios de limpieza automática inicializados");
  }

  /**
   * Limpieza de archivos temporales
   */
  private static async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = path.join(this.uploadsBaseDir, "temp");
      await FileProcessingService.cleanupTempFiles(tempDir, 24); // 24 horas

      // También limpiar archivos de upload incompletos (más de 1 hora)
      await FileProcessingService.cleanupTempFiles(tempDir, 1);
    } catch (error) {
      console.error("❌ Error en limpieza de archivos temporales:", error);
    }
  }

  /**
   * Generar reporte de estadísticas de almacenamiento
   */
  private static async generateStorageReport(): Promise<void> {
    try {
      const stats = await FileProcessingService.getStorageStats(
        this.uploadsBaseDir
      );

      console.log("📊 === REPORTE DE ALMACENAMIENTO ===");
      console.log(`📁 Total de archivos: ${stats.totalFiles}`);
      console.log(`💾 Tamaño total: ${this.formatBytes(stats.totalSize)}`);

      console.log("\n📂 Por tipo de archivo:");
      Object.entries(stats.byType)
        .sort(([, a], [, b]) => b.size - a.size)
        .forEach(([ext, data]) => {
          const percentage = ((data.size / stats.totalSize) * 100).toFixed(1);
          console.log(
            `  ${ext}: ${data.count} archivos, ${this.formatBytes(
              data.size
            )} (${percentage}%)`
          );
        });

      // Alertar si el almacenamiento supera ciertos límites
      const totalGB = stats.totalSize / (1024 * 1024 * 1024);
      if (totalGB > 10) {
        console.warn(
          `⚠️  ALERTA: Almacenamiento alto: ${totalGB.toFixed(2)}GB`
        );
      }
    } catch (error) {
      console.error("❌ Error generando reporte de almacenamiento:", error);
    }
  }

  /**
   * Mantenimiento semanal profundo
   */
  private static async performWeeklyMaintenance(): Promise<void> {
    try {
      console.log("🔧 Iniciando mantenimiento semanal...");

      // 1. Limpieza extendida de archivos temporales (más antiguos)
      const tempDir = path.join(this.uploadsBaseDir, "temp");
      await FileProcessingService.cleanupTempFiles(tempDir, 1); // Limpiar todo lo que tenga más de 1 hora

      // 2. Verificar integridad de archivos (verificar que los archivos en BD existen en disco)
      await this.verifyFileIntegrity();

      // 3. Limpiar directorios vacíos
      await this.cleanupEmptyDirectories();

      // 4. Generar reporte detallado
      await this.generateStorageReport();

      console.log("✅ Mantenimiento semanal completado");
    } catch (error) {
      console.error("❌ Error en mantenimiento semanal:", error);
    }
  }

  /**
   * Verificar integridad de archivos
   */
  private static async verifyFileIntegrity(): Promise<void> {
    try {
      // Esta función se conectaría a la BD para verificar que todos los archivos
      // registrados en la tabla de attachments realmente existen en el disco
      console.log("🔍 Verificación de integridad de archivos...");

      // TODO: Implementar cuando tengamos acceso a la base de datos desde aquí
      // Por ahora, solo registramos que la función existe
      console.log("ℹ️  Verificación de integridad: función disponible");
    } catch (error) {
      console.error("❌ Error verificando integridad de archivos:", error);
    }
  }

  /**
   * Limpiar directorios vacíos
   */
  private static async cleanupEmptyDirectories(): Promise<void> {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      // Encontrar y eliminar directorios vacíos
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
            } catch (err) {
              // Ignorar errores (el directorio podría no estar vacío)
            }
          }
        }

        if (cleanedDirs > 0) {
          console.log(`🗂️  Directorios vacíos eliminados: ${cleanedDirs}`);
        }
      }
    } catch (error) {
      console.error("❌ Error limpiando directorios vacíos:", error);
    }
  }

  /**
   * Formatear bytes a formato legible
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Ejecutar limpieza manual (para uso en desarrollo o administración)
   */
  static async runManualCleanup(): Promise<void> {
    console.log("🧹 Ejecutando limpieza manual...");

    await this.cleanupTempFiles();
    await this.cleanupEmptyDirectories();
    await this.generateStorageReport();

    console.log("✅ Limpieza manual completada");
  }

  /**
   * Detener todos los cron jobs
   */
  static stopScheduledJobs(): void {
    // Note: node-cron no tiene método destroy, los jobs se detienen automáticamente al cerrar la app
    this.isInitialized = false;
    console.log("⏹️  Servicios de limpieza automática marcados para detener");
  }
}
