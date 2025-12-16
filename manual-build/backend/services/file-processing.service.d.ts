export declare class FileProcessingService {
    private static readonly THUMBNAIL_CONFIG;
    private static readonly IMAGE_OPTIMIZATION;
    private static readonly THUMBNAIL_SUPPORTED;
    private static readonly DOCUMENT_SUPPORTED;
    static generateFileHash(filePath: string): Promise<string>;
    static checkDuplicateFile(fileHash: string, uploadsDir: string): Promise<string | null>;
    static generateThumbnail(inputPath: string, outputDir: string, fileName: string): Promise<string | null>;
    static optimizeImage(inputPath: string, outputDir: string, fileName: string): Promise<string | null>;
    static generatePdfThumbnail(inputPath: string, outputDir: string, fileName: string): Promise<string | null>;
    static compressPdf(inputPath: string, outputDir: string, fileName: string): Promise<string | null>;
    static processFile(filePath: string, documentDir: string, fileName: string, fileExtension: string): Promise<{
        thumbnailPath?: string;
        processedPath?: string;
        fileHash: string;
    }>;
    static cleanupTempFiles(tempDir: string, maxAgeHours?: number): Promise<void>;
    static getStorageStats(uploadsDir: string): Promise<{
        totalFiles: number;
        totalSize: number;
        byType: Record<string, {
            count: number;
            size: number;
        }>;
    }>;
}
