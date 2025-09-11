const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
import dataSource from "../data-source";
import {
  KnowledgeDocumentAttachment,
  FileType,
} from "../entities/KnowledgeDocumentAttachment";
import { UserProfile } from "../entities/UserProfile";
import { FileProcessingService } from "./file-processing.service";
import { FileCleanupService } from "./file-cleanup.service";

// Configuración de tipos de archivos permitidos
const ALLOWED_FILE_TYPES = {
  images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  documents: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
  spreadsheets: [".xls", ".xlsx", ".csv"],
  presentations: [".ppt", ".pptx"],
  videos: [".mp4", ".avi", ".mov", ".wmv", ".webm"],
  audio: [".mp3", ".wav", ".ogg", ".aac"],
  archives: [".zip", ".rar", ".7z", ".tar", ".gz"],
};

// Tamaño máximo por archivo (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Directorio base para uploads (FUERA del directorio público para seguridad)
const UPLOADS_BASE_DIR = path.join(process.cwd(), "uploads");

// Función para inicializar directorios de uploads al inicio de la aplicación
export const initializeUploadDirectories = async (): Promise<void> => {
  try {
    // Estructura de directorios según el plan de migración:
    // /uploads/documents/año/mes/note-uuid/original|thumbnails|processed/
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

    const directories = [
      path.join(UPLOADS_BASE_DIR, "documents"), // Base de documentos
      path.join(UPLOADS_BASE_DIR, "documents", String(currentYear)), // Año actual
      path.join(
        UPLOADS_BASE_DIR,
        "documents",
        String(currentYear),
        currentMonth
      ), // Mes actual
      path.join(UPLOADS_BASE_DIR, "temp"), // Archivos temporales
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Directorio de uploads creado/verificado: ${dir}`);
    }

    // Crear archivo .gitignore en uploads para seguridad
    const gitignorePath = path.join(UPLOADS_BASE_DIR, ".gitignore");
    const gitignoreContent = `# Archivos de uploads - no incluir en el control de versiones
*
!.gitignore
!README.md
`;

    try {
      await fs.access(gitignorePath);
    } catch {
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log("📝 Archivo .gitignore creado en directorio uploads");
    }

    // Crear README de seguridad
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
    } catch {
      await fs.writeFile(readmePath, readmeContent);
      console.log("📖 README de seguridad creado en directorio uploads");
    }

    console.log(
      "✅ Sistema de directorios de uploads inicializado correctamente"
    );
  } catch (error) {
    console.error("❌ Error inicializando directorios de uploads:", error);
    throw new Error(
      "No se pudieron crear los directorios necesarios para uploads"
    );
  }
};

// Función para obtener todos los tipos permitidos
const getAllowedExtensions = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flat();
};

// Configuración de multer para el almacenamiento (SEGURO - fuera del directorio público)
const storage = multer.diskStorage({
  destination: async (req: any, file: any, cb: any) => {
    try {
      // Crear estructura de directorios según el plan de migración
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      // Estructura: /uploads/documents/año/mes/
      const uploadsDir = path.join(
        UPLOADS_BASE_DIR,
        "documents",
        String(year),
        month
      );
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uniqueId}${fileExtension}`;
    cb(null, fileName);
  },
});

// Función para validar el tipo de archivo
const fileFilter = (req: any, file: any, cb: any) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = getAllowedExtensions();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(
          ", "
        )}`
      )
    );
  }
};

// Configuración de multer
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Máximo 10 archivos por petición
  },
});

// Clase del servicio de archivos
export class FileUploadService {
  private attachmentRepository: any = null;
  private userRepository: any = null;

  constructor() {
    // No inicializar repositorios en constructor para evitar problemas de carga
  }

  /**
   * Método para obtener el repositorio de forma segura con inicialización perezosa
   */
  private getAttachmentRepository() {
    if (!this.attachmentRepository) {
      this.attachmentRepository = dataSource.getRepository(
        "KnowledgeDocumentAttachment"
      );
    }
    return this.attachmentRepository;
  }

  /**
   * Método para obtener el repositorio de usuarios de forma segura
   */
  private getUserRepository() {
    if (!this.userRepository) {
      this.userRepository = dataSource.getRepository(UserProfile);
    }
    return this.userRepository;
  }

  /**
   * Inicializar en el startup del servidor para crear directorios automáticamente
   */
  static async initialize(): Promise<void> {
    await initializeUploadDirectories();

    // Inicializar servicios de procesamiento y limpieza automática
    FileCleanupService.initialize(UPLOADS_BASE_DIR);
    console.log("🔧 Servicios de procesamiento avanzado inicializados");
  }

  /**
   * Generar estructura de directorios para un documento específico
   * Según plan de migración: /uploads/documents/año/mes/note-uuid/original|thumbnails|processed/
   */
  static async createDocumentDirectories(noteId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const documentBaseDir = path.join(
      UPLOADS_BASE_DIR,
      "documents",
      String(year),
      month,
      noteId
    );

    const subDirectories = [
      path.join(documentBaseDir, "original"), // Archivos originales
      path.join(documentBaseDir, "thumbnails"), // Miniaturas generadas
      path.join(documentBaseDir, "processed"), // Versiones procesadas
    ];

    for (const dir of subDirectories) {
      await fs.mkdir(dir, { recursive: true });
    }

    console.log(
      `📁 Estructura de directorios creada para documento: ${noteId}`
    );
    return documentBaseDir;
  }

  /**
   * Procesa y guarda la información del archivo subido
   */
  async processUploadedFile(
    file: Express.Multer.File,
    knowledgeDocumentId: string,
    userId: string
  ): Promise<any> {
    try {
      // Simplificar la validación del usuario por ahora - el userId ya fue validado en el middleware de autenticación
      console.log("📁 Procesando archivo para usuario:", userId);

      // Determinar el tipo de archivo para el ícono
      const fileExtension = path.extname(file.originalname).toLowerCase();

      // Generar hash del archivo para deduplicación
      const fileHash = await FileProcessingService.generateFileHash(file.path);

      // Verificar si ya existe un archivo idéntico (deduplicación)
      const duplicateFile = await FileProcessingService.checkDuplicateFile(
        fileHash,
        UPLOADS_BASE_DIR
      );

      if (duplicateFile) {
        console.log(
          `🔄 Archivo duplicado detectado, usando referencia existente`
        );
        // TODO: Manejar deduplicación - por ahora continuamos con el nuevo archivo
      }

      // Crear estructura de directorios para este documento
      const documentDir = await FileUploadService.createDocumentDirectories(
        knowledgeDocumentId
      );

      // Mover archivo del directorio temporal al directorio final
      const finalDir = path.join(documentDir, "original");
      const finalFileName = `${fileHash.substring(0, 16)}_${file.originalname}`;
      const finalPath = path.join(finalDir, finalFileName);

      await fs.rename(file.path, finalPath);
      console.log(`📁 Archivo movido a estructura final: ${finalPath}`);

      // Procesar archivo (thumbnails, optimización, etc.)
      const processingResults = await FileProcessingService.processFile(
        finalPath,
        documentDir,
        finalFileName,
        fileExtension
      );

      // Crear el registro del archivo en la base de datos usando transacción
      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      console.log("📡 Verificando conexión de base de datos...");

      // Verificar que la conexión esté inicializada
      if (!dataSource.isInitialized) {
        console.log("⚠️ DataSource no inicializado, inicializando...");
        await dataSource.initialize();
      }

      console.log("💾 Insertando registro en base de datos...");

      // Usar el manager directamente sin transacción para simplificar
      await dataSource.manager.query(
        `
        INSERT INTO knowledge_document_attachments (
          id, document_id, file_name, file_path, file_size, mime_type, 
          file_type, file_hash, thumbnail_path, processed_path, 
          uploaded_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
        [
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
        ]
      );

      console.log("✅ Registro insertado correctamente en BD");

      // Retornar el attachment creado
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
        // Propiedades adicionales para compatibilidad
        isEmbedded: false,
        uploadSessionId: null,
        // Generar URLs para el frontend (usar el fileName físico final)
        downloadUrl: `/api/files/knowledge/download/${finalFileName}`,
        previewUrl: processingResults.thumbnailPath
          ? `/api/files/knowledge/thumbnail/${finalFileName}`
          : null,
      };

      return savedAttachment;
    } catch (error) {
      // Si hay error, eliminar el archivo físico
      if (file.path) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error("Error eliminando archivo:", unlinkError);
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un archivo y su registro
   */
  async deleteFile(attachmentId: string, userId: string): Promise<boolean> {
    try {
      const attachment = await this.getAttachmentRepository().findOne({
        where: { id: attachmentId },
        relations: ["uploadedByUser"],
      });

      if (!attachment) {
        throw new Error("Archivo no encontrado");
      }

      // Verificar permisos (solo el usuario que subió el archivo o admin puede eliminarlo)
      if (attachment.uploadedBy !== userId) {
        // Aquí podrías agregar lógica adicional para verificar si es admin
        throw new Error("No tienes permisos para eliminar este archivo");
      }

      // Eliminar archivo físico principal
      try {
        await fs.unlink(attachment.filePath);
        console.log(`🗑️  Archivo principal eliminado: ${attachment.filePath}`);
      } catch (error) {
        console.warn(
          "Archivo físico principal no encontrado:",
          attachment.filePath
        );
      }

      // Eliminar thumbnail si existe
      if (attachment.thumbnailPath) {
        try {
          await fs.unlink(attachment.thumbnailPath);
          console.log(`🗑️  Thumbnail eliminado: ${attachment.thumbnailPath}`);
        } catch (error) {
          console.warn("Thumbnail no encontrado:", attachment.thumbnailPath);
        }
      }

      // Eliminar archivo procesado si existe
      if (attachment.processedPath) {
        try {
          await fs.unlink(attachment.processedPath);
          console.log(
            `🗑️  Archivo procesado eliminado: ${attachment.processedPath}`
          );
        } catch (error) {
          console.warn(
            "Archivo procesado no encontrado:",
            attachment.processedPath
          );
        }
      }

      // Eliminar registro de la base de datos
      await this.getAttachmentRepository().remove(attachment);

      return true;
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      throw error;
    }
  }

  /**
   * Obtiene los archivos adjuntos de un documento
   */
  async getDocumentAttachments(
    knowledgeDocumentId: string
  ): Promise<KnowledgeDocumentAttachment[]> {
    try {
      console.log(
        "� [ATTACHMENTS SERVICE] Searching attachments for documentId:",
        knowledgeDocumentId
      );

      const attachments = await this.getAttachmentRepository().find({
        where: { documentId: knowledgeDocumentId },
        relations: ["uploadedByUser"],
        order: { createdAt: "DESC" },
      });

      console.log(
        `� [ATTACHMENTS SERVICE] Found ${attachments.length} attachments for document ${knowledgeDocumentId}`
      );

      if (attachments.length > 0) {
        attachments.forEach((att: KnowledgeDocumentAttachment) => {
          console.log(`📄 [ATTACHMENTS SERVICE] Attachment: ${att.fileName}`, {
            id: att.id,
            fileName: att.fileName,
            filePath: att.filePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            fileExists: require("fs").existsSync(att.filePath),
          });
        });
      } else {
        console.log(
          "📭 [ATTACHMENTS SERVICE] No attachments found for document"
        );
      }

      return attachments;
    } catch (error) {
      console.error(
        "💥 [ATTACHMENTS SERVICE] Error obteniendo archivos adjuntos:",
        {
          documentId: knowledgeDocumentId,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
      // Si la entidad no se encuentra, devolver array vacío en lugar de error
      return [];
    }
  }

  /**
   * Obtiene un archivo específico para descarga usando el repositorio
   */
  async getFileForDownload(
    fileName: string
  ): Promise<{ filePath: string; originalName: string; mimeType: string }> {
    console.log("� [FILE SERVICE] Searching for file ending with:", fileName);

    try {
      // Verificar y asegurar conexión antes de la consulta
      if (!dataSource.isInitialized) {
        console.log(
          "⚠️ [FILE SERVICE] DataSource not initialized, initializing..."
        );
        await dataSource.initialize();
      }

      // Usar EntityManager que maneja conexiones automáticamente
      const query = `
        SELECT id, file_name as "fileName", file_path as "filePath", mime_type as "mimeType"
        FROM knowledge_document_attachments 
        WHERE file_path LIKE $1
      `;

      const attachments = await dataSource.manager.query(query, [
        `%${fileName}`,
      ]);

      console.log("📊 [FILE SERVICE] EntityManager query results:", {
        fileName,
        resultsFound: attachments.length,
        results:
          attachments.length > 0
            ? attachments.map((att: any) => ({
                id: att.id,
                fileName: att.fileName,
                filePath: att.filePath,
                mimeType: att.mimeType,
              }))
            : [],
      });

      if (attachments.length === 0) {
        console.error(
          "❌ [FILE SERVICE] No database record found for file:",
          fileName
        );
        throw new Error("Archivo no encontrado");
      }

      const attachment = attachments[0];
      console.log("📄 [FILE SERVICE] Found attachment record:", {
        id: attachment.id,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        mimeType: attachment.mimeType,
      });

      // Verificar que el archivo existe físicamente
      try {
        await fs.access(attachment.filePath);
        console.log(
          "✅ [FILE SERVICE] File exists on filesystem:",
          attachment.filePath
        );
      } catch (error) {
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
    } catch (error) {
      console.error("💥 [FILE SERVICE] Error in getFileForDownload:", {
        fileName,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Determina el tipo de archivo basado en la extensión
   */
  private getFileType(extension: string): FileType {
    if (ALLOWED_FILE_TYPES.images.includes(extension)) return "image";
    if (ALLOWED_FILE_TYPES.documents.includes(extension)) return "document";
    if (ALLOWED_FILE_TYPES.spreadsheets.includes(extension))
      return "spreadsheet";
    if (ALLOWED_FILE_TYPES.presentations.includes(extension)) return "other";
    if (ALLOWED_FILE_TYPES.videos.includes(extension)) return "other";
    if (ALLOWED_FILE_TYPES.audio.includes(extension)) return "other";
    if (ALLOWED_FILE_TYPES.archives.includes(extension)) return "other";
    return "other";
  }
}

export const fileUploadService = new FileUploadService();
