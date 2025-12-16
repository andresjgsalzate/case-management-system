"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeDocumentAttachment = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentAttachment = class KnowledgeDocumentAttachment {
};
exports.KnowledgeDocumentAttachment = KnowledgeDocumentAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.attachments, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentAttachment.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_name", type: "varchar", length: 255 }),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_path", type: "text" }),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_size", type: "bigint" }),
    __metadata("design:type", Number)
], KnowledgeDocumentAttachment.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "mime_type", type: "varchar", length: 100 }),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_type", type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentAttachment.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_hash", type: "varchar", length: 64, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentAttachment.prototype, "fileHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "thumbnail_path", type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentAttachment.prototype, "thumbnailPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "processed_path", type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentAttachment.prototype, "processedPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_embedded", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], KnowledgeDocumentAttachment.prototype, "isEmbedded", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "upload_session_id",
        type: "varchar",
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], KnowledgeDocumentAttachment.prototype, "uploadSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "uploaded_by", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentAttachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocumentAttachment.prototype, "uploadedByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentAttachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentAttachment.prototype, "updatedAt", void 0);
exports.KnowledgeDocumentAttachment = KnowledgeDocumentAttachment = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_attachments")
], KnowledgeDocumentAttachment);
