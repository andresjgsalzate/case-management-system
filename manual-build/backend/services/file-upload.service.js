"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadService = exports.FileUploadService = exports.uploadConfig = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const data_source_1 = __importDefault(require("../data-source"));
const KnowledgeDocumentAttachment_1 = require("../entities/KnowledgeDocumentAttachment");
const UserProfile_1 = require("../entities/UserProfile");
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
const getAllowedExtensions = () => {
    return Object.values(ALLOWED_FILE_TYPES).flat();
};
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const uploadsDir = path_1.default.join(process.cwd(), "uploads", "knowledge");
            await promises_1.default.mkdir(uploadsDir, { recursive: true });
            cb(null, uploadsDir);
        }
        catch (error) {
            cb(error, "");
        }
    },
    filename: (req, file, cb) => {
        const uniqueId = (0, uuid_1.v4)();
        const fileExtension = path_1.default.extname(file.originalname);
        const fileName = `${uniqueId}${fileExtension}`;
        cb(null, fileName);
    },
});
const fileFilter = (req, file, cb) => {
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    const allowedExtensions = getAllowedExtensions();
    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(", ")}`));
    }
};
exports.uploadConfig = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10,
    },
});
class FileUploadService {
    constructor() {
        this.attachmentRepository = data_source_1.default.getRepository(KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment);
        this.userRepository = data_source_1.default.getRepository(UserProfile_1.UserProfile);
    }
    async processUploadedFile(file, knowledgeDocumentId, userId) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            const attachment = new KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment();
            attachment.documentId = knowledgeDocumentId;
            attachment.fileName = file.originalname;
            attachment.filePath = file.path;
            attachment.fileSize = file.size;
            attachment.mimeType = file.mimetype;
            attachment.uploadedBy = userId;
            attachment.createdAt = new Date();
            attachment.updatedAt = new Date();
            const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
            attachment.fileType = this.getFileType(fileExtension);
            const savedAttachment = await this.attachmentRepository.save(attachment);
            return savedAttachment;
        }
        catch (error) {
            if (file.path) {
                try {
                    await promises_1.default.unlink(file.path);
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
            const attachment = await this.attachmentRepository.findOne({
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
                await promises_1.default.unlink(attachment.filePath);
            }
            catch (error) {
                console.warn("Archivo físico no encontrado:", attachment.filePath);
            }
            await this.attachmentRepository.remove(attachment);
            return true;
        }
        catch (error) {
            console.error("Error eliminando archivo:", error);
            throw error;
        }
    }
    async getDocumentAttachments(knowledgeDocumentId) {
        return await this.attachmentRepository.find({
            where: { documentId: knowledgeDocumentId },
            relations: ["uploadedByUser"],
            order: { createdAt: "DESC" },
        });
    }
    async getFileForDownload(fileName) {
        const attachment = await this.attachmentRepository
            .createQueryBuilder("attachment")
            .where("attachment.filePath LIKE :fileName", { fileName: `%${fileName}` })
            .getOne();
        if (!attachment) {
            throw new Error("Archivo no encontrado");
        }
        try {
            await promises_1.default.access(attachment.filePath);
        }
        catch (error) {
            throw new Error("Archivo no disponible");
        }
        return {
            filePath: attachment.filePath,
            originalName: attachment.fileName,
            mimeType: attachment.mimeType,
        };
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
    async generateThumbnail(filePath, fileType) {
        return null;
    }
}
exports.FileUploadService = FileUploadService;
exports.fileUploadService = new FileUploadService();
