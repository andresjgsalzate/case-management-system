import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Servicio para procesamiento avanzado de archivos
 * - Generación de thumbnails
 * - Compresión y optimización
 * - Deduplicación por hash
 */
export class FileProcessingService {
  // Configuración de thumbnails
  private static readonly THUMBNAIL_CONFIG = {
    width: 300,
    height: 300,
    quality: 80,
    format: "jpeg" as const,
  };

  // Configuración de optimización de imágenes
  private static readonly IMAGE_OPTIMIZATION = {
    jpeg: { quality: 85, progressive: true },
    png: { compressionLevel: 9, palette: true },
    webp: { quality: 80 },
  };

  // Tipos de archivos soportados para thumbnails
  private static readonly THUMBNAIL_SUPPORTED = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tiff",
  ];

  // Tipos de documentos para procesamiento
  private static readonly DOCUMENT_SUPPORTED = [".pdf", ".doc", ".docx"];

  /**
   * Generar hash SHA-256 de un archivo
   */
  static async generateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (error) {
      console.error(`❌ Error generando hash para ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si ya existe un archivo con el mismo hash (deduplicación)
   */
  static async checkDuplicateFile(
    fileHash: string,
    uploadsDir: string
  ): Promise<string | null> {
    try {
      // Buscar recursivamente archivos con el mismo hash
      const findCommand = `find "${uploadsDir}" -name "*${fileHash.substring(
        0,
        16
      )}*" -type f`;
      const { stdout } = await execAsync(findCommand);

      if (stdout.trim()) {
        const existingFile = stdout.trim().split("\n")[0];
        if (existingFile) {
          console.log(`🔍 Archivo duplicado encontrado: ${existingFile}`);
          return existingFile;
        }
      }

      return null;
    } catch (error) {
      // Si no encuentra duplicados, continúa normalmente
      return null;
    }
  }

  /**
   * Generar thumbnail para imágenes
   */
  static async generateThumbnail(
    inputPath: string,
    outputDir: string,
    fileName: string
  ): Promise<string | null> {
    try {
      const fileExtension = path.extname(inputPath).toLowerCase();

      if (!this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
        console.log(`ℹ️  Thumbnail no soportado para: ${fileExtension}`);
        return null;
      }

      // Asegurar que el directorio de thumbnails existe
      await fs.mkdir(outputDir, { recursive: true });

      const thumbnailFileName = `thumb_${path.parse(fileName).name}.${
        this.THUMBNAIL_CONFIG.format
      }`;
      const thumbnailPath = path.join(outputDir, thumbnailFileName);

      await sharp(inputPath)
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
    } catch (error) {
      console.error(`❌ Error generando thumbnail para ${inputPath}:`, error);
      return null;
    }
  }

  /**
   * Optimizar imagen (compresión sin pérdida significativa de calidad)
   */
  static async optimizeImage(
    inputPath: string,
    outputDir: string,
    fileName: string
  ): Promise<string | null> {
    try {
      const fileExtension = path.extname(inputPath).toLowerCase();

      if (!this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
        return null;
      }

      // Asegurar que el directorio de archivos procesados existe
      await fs.mkdir(outputDir, { recursive: true });

      const optimizedFileName = `opt_${fileName}`;
      const optimizedPath = path.join(outputDir, optimizedFileName);

      let sharpInstance = sharp(inputPath);

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
          // Para otros formatos, convertir a JPEG optimizado
          sharpInstance = sharpInstance.jpeg(this.IMAGE_OPTIMIZATION.jpeg);
          break;
      }

      await sharpInstance.toFile(optimizedPath);

      // Verificar si la optimización redujo el tamaño
      const originalStats = await fs.stat(inputPath);
      const optimizedStats = await fs.stat(optimizedPath);

      if (optimizedStats.size < originalStats.size) {
        const savings = (
          ((originalStats.size - optimizedStats.size) / originalStats.size) *
          100
        ).toFixed(1);
        console.log(
          `🗜️  Imagen optimizada: ${fileName} (${savings}% reducción)`
        );
        return optimizedPath;
      } else {
        // Si no hay mejora, eliminar la versión "optimizada"
        await fs.unlink(optimizedPath);
        console.log(`ℹ️  No se mejoró la compresión para: ${fileName}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error optimizando imagen ${inputPath}:`, error);
      return null;
    }
  }

  /**
   * Generar thumbnail de PDF (primera página)
   */
  static async generatePdfThumbnail(
    inputPath: string,
    outputDir: string,
    fileName: string
  ): Promise<string | null> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(outputDir, { recursive: true });

      const thumbnailFileName = `pdf_thumb_${path.parse(fileName).name}.jpg`;
      const thumbnailPath = path.join(outputDir, thumbnailFileName);

      // Usar ImageMagick para convertir la primera página del PDF
      const convertCommand = `convert "${inputPath}[0]" -thumbnail 300x300 -background white -alpha remove "${thumbnailPath}"`;

      try {
        await execAsync(convertCommand);
        console.log(`📄 Thumbnail de PDF generado: ${thumbnailPath}`);
        return thumbnailPath;
      } catch (convertError) {
        console.log(
          `ℹ️  ImageMagick no disponible, intentando con pdf-poppler...`
        );

        // Fallback: intentar con pdf-poppler si está disponible
        // Nota: pdf-poppler requiere instalación adicional del sistema
        console.log(`ℹ️  Thumbnail de PDF no disponible para: ${fileName}`);
        return null;
      }
    } catch (error) {
      console.error(
        `❌ Error generando thumbnail de PDF para ${inputPath}:`,
        error
      );
      return null;
    }
  }

  /**
   * Comprimir PDF (si está disponible)
   */
  static async compressPdf(
    inputPath: string,
    outputDir: string,
    fileName: string
  ): Promise<string | null> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(outputDir, { recursive: true });

      const compressedFileName = `compressed_${fileName}`;
      const compressedPath = path.join(outputDir, compressedFileName);

      // Usar Ghostscript para comprimir PDF
      const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${compressedPath}" "${inputPath}"`;

      try {
        await execAsync(gsCommand);

        // Verificar si la compresión redujo el tamaño
        const originalStats = await fs.stat(inputPath);
        const compressedStats = await fs.stat(compressedPath);

        if (compressedStats.size < originalStats.size) {
          const savings = (
            ((originalStats.size - compressedStats.size) / originalStats.size) *
            100
          ).toFixed(1);
          console.log(`📊 PDF comprimido: ${fileName} (${savings}% reducción)`);
          return compressedPath;
        } else {
          // Si no hay mejora, eliminar la versión comprimida
          await fs.unlink(compressedPath);
          console.log(`ℹ️  No se mejoró la compresión para PDF: ${fileName}`);
          return null;
        }
      } catch (gsError) {
        console.log(
          `ℹ️  Ghostscript no disponible para comprimir PDF: ${fileName}`
        );
        return null;
      }
    } catch (error) {
      console.error(`❌ Error comprimiendo PDF ${inputPath}:`, error);
      return null;
    }
  }

  /**
   * Procesar archivo completo (thumbnails + optimización)
   */
  static async processFile(
    filePath: string,
    documentDir: string,
    fileName: string,
    fileExtension: string
  ): Promise<{
    thumbnailPath?: string;
    processedPath?: string;
    fileHash: string;
  }> {
    const results = {
      fileHash: await this.generateFileHash(filePath),
    } as any;

    const thumbnailsDir = path.join(documentDir, "thumbnails");
    const processedDir = path.join(documentDir, "processed");

    // Generar thumbnail
    if (this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
      results.thumbnailPath = await this.generateThumbnail(
        filePath,
        thumbnailsDir,
        fileName
      );
    } else if (fileExtension === ".pdf") {
      results.thumbnailPath = await this.generatePdfThumbnail(
        filePath,
        thumbnailsDir,
        fileName
      );
    }

    // Optimizar/procesar archivo
    if (this.THUMBNAIL_SUPPORTED.includes(fileExtension)) {
      results.processedPath = await this.optimizeImage(
        filePath,
        processedDir,
        fileName
      );
    } else if (fileExtension === ".pdf") {
      results.processedPath = await this.compressPdf(
        filePath,
        processedDir,
        fileName
      );
    }

    return results;
  }

  /**
   * Limpiar archivos temporales antiguos
   */
  static async cleanupTempFiles(
    tempDir: string,
    maxAgeHours: number = 24
  ): Promise<void> {
    try {
      const files = await fs.readdir(tempDir);
      const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(
          `🧹 Limpieza de archivos temporales: ${cleanedCount} archivos eliminados`
        );
      }
    } catch (error) {
      console.error("❌ Error en limpieza de archivos temporales:", error);
    }
  }

  /**
   * Obtener estadísticas de uso de almacenamiento
   */
  static async getStorageStats(uploadsDir: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  }> {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {} as Record<string, { count: number; size: number }>,
      };

      const scanDirectory = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else {
            const fileStat = await fs.stat(fullPath);
            const ext =
              path.extname(entry.name).toLowerCase() || "sin-extension";

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
    } catch (error) {
      console.error(
        "❌ Error obteniendo estadísticas de almacenamiento:",
        error
      );
      return { totalFiles: 0, totalSize: 0, byType: {} };
    }
  }
}
