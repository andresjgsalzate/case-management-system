"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadService = exports.FileUploadService = exports.uploadConfig = exports.initializeUploadDirectories = void 0;
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const database_1 = require("../config/database");
const KnowledgeDocumentAttachment_1 = require("../entities/KnowledgeDocumentAttachment");
const UserProfile_1 = require("../entities/UserProfile");
const file_processing_service_1 = require("./file-processing.service");
const file_cleanup_service_1 = require("./file-cleanup.service");
const ALLOWED_FILE_TYPES = {
    images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    documents: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
    spreadsheets: [".xls", ".xlsx", ".csv"],
    presentations: [".ppt", ".pptx"],
    videos: [".mp4", ".avi", ".mov", ".wmv", ".webm"],
    audio: [".mp3", ".wav", ".ogg", ".aac"],
    archives: [".zip", ".rar", ".7z", ".tar", ".gz"],
};
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const UPLOADS_BASE_DIR = path.join(process.cwd(), "uploads");
const initializeUploadDirectories = async () => {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
        const directories = [
            path.join(UPLOADS_BASE_DIR, "documents"),
            path.join(UPLOADS_BASE_DIR, "documents", String(currentYear)),
            path.join(UPLOADS_BASE_DIR, "documents", String(currentYear), currentMonth),
            path.join(UPLOADS_BASE_DIR, "temp"),
        ];
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
            console.log(`📁 Directorio de uploads creado/verificado: ${dir}`);
        }
        const gitignorePath = path.join(UPLOADS_BASE_DIR, ".gitignore");
        const gitignoreContent = `# Archivos de uploads - no incluir en el control de versiones
*
!.gitignore
!README.md
`;
        try {
            await fs.access(gitignorePath);
        }
        catch {
            await fs.writeFile(gitignorePath, gitignoreContent);
            console.log("📝 Archivo .gitignore creado en directorio uploads");
        }
        const readmePath = path.join(UPLOADS_BASE_DIR, "README.md");
        const readmeContent = `# 📁 Directorio de Uploads - Sistema de Gestión de Casos

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este directorio contiene archivos subidos por usuarios.

### Medidas de Seguridad Implementadas:

1. **Ubicación**: Fuera del directorio público web
2. **Acceso**: Solo a través de APIs autenticadas
3. **Validación**: Tipos de archivo y tamaños controlados
4. **Nomenclatura**: UUIDs para evitar conflictos
5. **Permisos**: Control de acceso basado en roles

### Estructura de Directorios (Según Plan de Migración):

\`\`\`
/uploads/
  └── documents/
      ├── 2025/                     # Año
      │   ├── 09/                   # Mes
      │   │   ├── note-uuid-1/      # ID del documento
      │   │   │   ├── original/     # Archivos originales
      │   │   │   ├── thumbnails/   # Miniaturas generadas
      │   │   │   └── processed/    # Versiones procesadas
      │   │   └── note-uuid-2/
      │   └── 10/
      └── temp/                     # Archivos temporales
\`\`\`

### Tipos de Archivos Soportados:

- **Imágenes**: JPG, PNG, GIF, WebP, SVG
- **Documentos**: PDF, DOC, DOCX, TXT, RTF
- **Hojas de Cálculo**: XLS, XLSX, CSV
- **Presentaciones**: PPT, PPTX
- **Videos**: MP4, AVI, MOV, WMV, WebM
- **Audio**: MP3, WAV, OGG, AAC
- **Archivos**: ZIP, RAR, 7Z, TAR, GZ

### Límites:

- **Tamaño máximo por archivo**: 50MB
- **Archivos máximos por request**: 10

## 🚫 Exclusiones

Este directorio está excluido del control de versiones por razones de seguridad.

## 🔧 Producción

Para despliegue en producción con Apache:
- Configurar directorio fuera de /var/www/html/
- Usar proxy para servir archivos de forma segura
- Configurar permisos adecuados del sistema de archivos
`;
        try {
            await fs.access(readmePath);
        }
        catch {
            await fs.writeFile(readmePath, readmeContent);
            console.log("📖 README de seguridad creado en directorio uploads");
        }
        console.log("✅ Sistema de directorios de uploads inicializado correctamente");
    }
    catch (error) {
        console.error("❌ Error inicializando directorios de uploads:", error);
        throw new Error("No se pudieron crear los directorios necesarios para uploads");
    }
};
exports.initializeUploadDirectories = initializeUploadDirectories;
const getAllowedExtensions = () => {
    return Object.values(ALLOWED_FILE_TYPES).flat();
};
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const uploadsDir = path.join(UPLOADS_BASE_DIR, "documents", String(year), month);
            await fs.mkdir(uploadsDir, { recursive: true });
            cb(null, uploadsDir);
        }
        catch (error) {
            cb(error, "");
        }
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uniqueId}${fileExtension}`;
        cb(null, fileName);
    },
});
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = getAllowedExtensions();
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(", ")}`));
    }
};
exports.uploadConfig = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10,
    },
});
class FileUploadService {
    constructor() {
        this.attachmentRepository = null;
        this.userRepository = null;
    }
    getAttachmentRepository() {
        if (!this.attachmentRepository) {
            this.attachmentRepository = database_1.AppDataSource.getRepository(KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment);
        }
        return this.attachmentRepository;
    }
    getUserRepository() {
        if (!this.userRepository) {
            this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        }
        return this.userRepository;
    }
    static async initialize() {
        await (0, exports.initializeUploadDirectories)();
        file_cleanup_service_1.FileCleanupService.initialize(UPLOADS_BASE_DIR);
        console.log("🔧 Servicios de procesamiento avanzado inicializados");
    }
    static async createDocumentDirectories(noteId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const documentBaseDir = path.join(UPLOADS_BASE_DIR, "documents", String(year), month, noteId);
        const subDirectories = [
            path.join(documentBaseDir, "original"),
            path.join(documentBaseDir, "thumbnails"),
            path.join(documentBaseDir, "processed"),
        ];
        for (const dir of subDirectories) {
            await fs.mkdir(dir, { recursive: true });
        }
        console.log(`📁 Estructura de directorios creada para documento: ${noteId}`);
        return documentBaseDir;
    }
    async processUploadedFile(file, knowledgeDocumentId, userId) {
        try {
            console.log("📁 Procesando archivo para usuario:", userId);
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const fileHash = await file_processing_service_1.FileProcessingService.generateFileHash(file.path);
            const duplicateFile = await file_processing_service_1.FileProcessingService.checkDuplicateFile(fileHash, UPLOADS_BASE_DIR);
            if (duplicateFile) {
                console.log(`🔄 Archivo duplicado detectado, usando referencia existente`);
            }
            const documentDir = await FileUploadService.createDocumentDirectories(knowledgeDocumentId);
            const finalDir = path.join(documentDir, "original");
            const finalFileName = `${fileHash.substring(0, 16)}_${file.originalname}`;
            const finalPath = path.join(finalDir, finalFileName);
            await fs.rename(file.path, finalPath);
            console.log(`📁 Archivo movido a estructura final: ${finalPath}`);
            const processingResults = await file_processing_service_1.FileProcessingService.processFile(finalPath, documentDir, finalFileName, fileExtension);
            const attachmentId = uuidv4();
            const now = new Date().toISOString();
            console.log("📡 Verificando conexión de base de datos...");
            if (!database_1.AppDataSource.isInitialized) {
                console.log("⚠️ DataSource no inicializado, inicializando...");
                await database_1.AppDataSource.initialize();
            }
            console.log("💾 Insertando registro en base de datos...");
            await database_1.AppDataSource.manager.query(`
        INSERT INTO knowledge_document_attachments (
          id, document_id, file_name, file_path, file_size, mime_type, 
          file_type, file_hash, thumbnail_path, processed_path, 
          uploaded_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
                attachmentId,
                knowledgeDocumentId,
                file.originalname,
                finalPath,
                file.size,
                file.mimetype,
                this.getFileType(fileExtension),
                processingResults.fileHash,
                processingResults.thumbnailPath || null,
                processingResults.processedPath || null,
                userId,
                now,
                now,
            ]);
            console.log("✅ Registro insertado correctamente en BD");
            const savedAttachment = {
                id: attachmentId,
                documentId: knowledgeDocumentId,
                fileName: file.originalname,
                filePath: finalPath,
                fileSize: file.size,
                mimeType: file.mimetype,
                fileType: this.getFileType(fileExtension),
                fileHash: processingResults.fileHash,
                thumbnailPath: processingResults.thumbnailPath,
                processedPath: processingResults.processedPath,
                uploadedBy: userId,
                createdAt: new Date(now),
                updatedAt: new Date(now),
                isEmbedded: false,
                uploadSessionId: null,
                downloadUrl: `/api/files/knowledge/download/${finalFileName}`,
                previewUrl: processingResults.thumbnailPath
                    ? `/api/files/knowledge/thumbnail/${finalFileName}`
                    : null,
            };
            return savedAttachment;
        }
        catch (error) {
            if (file.path) {
                try {
                    await fs.unlink(file.path);
                }
                catch (unlinkError) {
                    console.error("Error eliminando archivo:", unlinkError);
                }
            }
            throw error;
        }
    }
    async deleteFile(attachmentId, userId) {
        try {
            const attachment = await this.getAttachmentRepository().findOne({
                where: { id: attachmentId },
                relations: ["uploadedByUser"],
            });
            if (!attachment) {
                throw new Error("Archivo no encontrado");
            }
            if (attachment.uploadedBy !== userId) {
                throw new Error("No tienes permisos para eliminar este archivo");
            }
            try {
                await fs.unlink(attachment.filePath);
                console.log(`🗑️  Archivo principal eliminado: ${attachment.filePath}`);
            }
            catch (error) {
                console.warn("Archivo físico principal no encontrado:", attachment.filePath);
            }
            if (attachment.thumbnailPath) {
                try {
                    await fs.unlink(attachment.thumbnailPath);
                    console.log(`🗑️  Thumbnail eliminado: ${attachment.thumbnailPath}`);
                }
                catch (error) {
                    console.warn("Thumbnail no encontrado:", attachment.thumbnailPath);
                }
            }
            if (attachment.processedPath) {
                try {
                    await fs.unlink(attachment.processedPath);
                    console.log(`🗑️  Archivo procesado eliminado: ${attachment.processedPath}`);
                }
                catch (error) {
                    console.warn("Archivo procesado no encontrado:", attachment.processedPath);
                }
            }
            await this.getAttachmentRepository().remove(attachment);
            return true;
        }
        catch (error) {
            console.error("Error eliminando archivo:", error);
            throw error;
        }
    }
    async getDocumentAttachments(knowledgeDocumentId) {
        try {
            console.log("� [ATTACHMENTS SERVICE] Searching attachments for documentId:", knowledgeDocumentId);
            const attachments = await this.getAttachmentRepository().find({
                where: { documentId: knowledgeDocumentId },
                relations: ["uploadedByUser"],
                order: { createdAt: "DESC" },
            });
            console.log(`� [ATTACHMENTS SERVICE] Found ${attachments.length} attachments for document ${knowledgeDocumentId}`);
            if (attachments.length > 0) {
                attachments.forEach((att) => {
                    console.log(`📄 [ATTACHMENTS SERVICE] Attachment: ${att.fileName}`, {
                        id: att.id,
                        fileName: att.fileName,
                        filePath: att.filePath,
                        fileSize: att.fileSize,
                        mimeType: att.mimeType,
                        fileExists: require("fs").existsSync(att.filePath),
                    });
                });
            }
            else {
                console.log("📭 [ATTACHMENTS SERVICE] No attachments found for document");
            }
            return attachments;
        }
        catch (error) {
            console.error("💥 [ATTACHMENTS SERVICE] Error obteniendo archivos adjuntos:", {
                documentId: knowledgeDocumentId,
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            return [];
        }
    }
    async getFileForDownload(fileName) {
        const decodedFileName = decodeURIComponent(fileName);
        console.log("🔍 [FILE SERVICE] Searching for file:", {
            original: fileName,
            decoded: decodedFileName,
        });
        try {
            if (!database_1.AppDataSource.isInitialized) {
                console.log("⚠️ [FILE SERVICE] DataSource not initialized, initializing...");
                await database_1.AppDataSource.initialize();
            }
            const query = `
        SELECT id, file_name as "fileName", file_path as "filePath", mime_type as "mimeType"
        FROM knowledge_document_attachments 
        WHERE file_path LIKE $1 OR file_path LIKE $2 OR file_path LIKE $3 OR file_path LIKE $4
      `;
            const attachments = await database_1.AppDataSource.manager.query(query, [
                `%/${fileName}`,
                `%${fileName}`,
                `%/${decodedFileName}`,
                `%${decodedFileName}`,
            ]);
            console.log("📊 [FILE SERVICE] EntityManager query results:", {
                fileName,
                resultsFound: attachments.length,
                results: attachments.length > 0
                    ? attachments.map((att) => ({
                        id: att.id,
                        fileName: att.fileName,
                        filePath: att.filePath,
                        mimeType: att.mimeType,
                    }))
                    : [],
            });
            if (attachments.length === 0) {
                console.error("❌ [FILE SERVICE] No database record found for file:", fileName);
                throw new Error("Archivo no encontrado");
            }
            const attachment = attachments[0];
            console.log("📄 [FILE SERVICE] Found attachment record:", {
                id: attachment.id,
                fileName: attachment.fileName,
                filePath: attachment.filePath,
                mimeType: attachment.mimeType,
            });
            try {
                await fs.access(attachment.filePath);
                console.log("✅ [FILE SERVICE] File exists on filesystem:", attachment.filePath);
            }
            catch (error) {
                console.error("❌ [FILE SERVICE] File not found on filesystem:", {
                    filePath: attachment.filePath,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                throw new Error("Archivo no disponible");
            }
            return {
                filePath: attachment.filePath,
                originalName: attachment.fileName,
                mimeType: attachment.mimeType,
            };
        }
        catch (error) {
            console.error("💥 [FILE SERVICE] Error in getFileForDownload:", {
                fileName,
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    getFileType(extension) {
        if (ALLOWED_FILE_TYPES.images.includes(extension))
            return "image";
        if (ALLOWED_FILE_TYPES.documents.includes(extension))
            return "document";
        if (ALLOWED_FILE_TYPES.spreadsheets.includes(extension))
            return "spreadsheet";
        if (ALLOWED_FILE_TYPES.presentations.includes(extension))
            return "other";
        if (ALLOWED_FILE_TYPES.videos.includes(extension))
            return "other";
        if (ALLOWED_FILE_TYPES.audio.includes(extension))
            return "other";
        if (ALLOWED_FILE_TYPES.archives.includes(extension))
            return "other";
        return "other";
    }
}
exports.FileUploadService = FileUploadService;
exports.fileUploadService = new FileUploadService();
