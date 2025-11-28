import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import dataSource from "../data-source";
import {
  KnowledgeDocumentAttachment,
  FileType,
} from "../entities/KnowledgeDocumentAttachment";
import { UserProfile } from "../entities/UserProfile";

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

// Función para obtener todos los tipos permitidos
const getAllowedExtensions = (): string[] => {
  return Object.values(ALLOWED_FILE_TYPES).flat();
};

// Configuración de multer para el almacenamiento
const storage = multer.diskStorage({
  destination: async (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    try {
      const uploadsDir = path.join(process.cwd(), "uploads", "knowledge");
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uniqueId}${fileExtension}`;
    cb(null, fileName);
  },
});

// Función para validar el tipo de archivo
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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
  private attachmentRepository = dataSource.getRepository(
    KnowledgeDocumentAttachment
  );
  private userRepository = dataSource.getRepository(UserProfile);

  /**
   * Procesa y guarda la información del archivo subido
   */
  async processUploadedFile(
    file: Express.Multer.File,
    knowledgeDocumentId: string,
    userId: string
  ): Promise<KnowledgeDocumentAttachment> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Crear el registro del archivo en la base de datos
      const attachment = new KnowledgeDocumentAttachment();
      attachment.documentId = knowledgeDocumentId;
      attachment.fileName = file.originalname;
      attachment.filePath = file.path;
      attachment.fileSize = file.size;
      attachment.mimeType = file.mimetype;
      attachment.uploadedBy = userId;
      attachment.createdAt = new Date();
      attachment.updatedAt = new Date();

      // Determinar el tipo de archivo para el ícono
      const fileExtension = path.extname(file.originalname).toLowerCase();
      attachment.fileType = this.getFileType(fileExtension);

      // Guardar en la base de datos
      const savedAttachment = await this.attachmentRepository.save(attachment);

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
      const attachment = await this.attachmentRepository.findOne({
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

      // Eliminar archivo físico
      try {
        await fs.unlink(attachment.filePath);
      } catch (error) {
        console.warn("Archivo físico no encontrado:", attachment.filePath);
      }

      // Eliminar registro de la base de datos
      await this.attachmentRepository.remove(attachment);

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
    return await this.attachmentRepository.find({
      where: { documentId: knowledgeDocumentId },
      relations: ["uploadedByUser"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Obtiene un archivo específico para descarga
   */
  async getFileForDownload(
    fileName: string
  ): Promise<{ filePath: string; originalName: string; mimeType: string }> {
    const attachment = await this.attachmentRepository
      .createQueryBuilder("attachment")
      .where("attachment.filePath LIKE :fileName", { fileName: `%${fileName}` })
      .getOne();

    if (!attachment) {
      throw new Error("Archivo no encontrado");
    }

    // Verificar que el archivo existe físicamente
    try {
      await fs.access(attachment.filePath);
    } catch (error) {
      throw new Error("Archivo no disponible");
    }

    return {
      filePath: attachment.filePath,
      originalName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
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

  /**
   * Genera una miniatura para imágenes (funcionalidad futura)
   */
  private async generateThumbnail(
    filePath: string,
    fileType: string
  ): Promise<string | null> {
    // TODO: Implementar generación de miniaturas para imágenes
    // Se puede usar librerías como sharp o jimp
    return null;
  }
}

export const fileUploadService = new FileUploadService();
