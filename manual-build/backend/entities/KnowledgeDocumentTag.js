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
exports.KnowledgeDocumentTag = void 0;
const typeorm_1 = require("typeorm");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentTag = class KnowledgeDocumentTag {
};
exports.KnowledgeDocumentTag = KnowledgeDocumentTag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", nullable: true }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.tags, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentTag.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "tag_name", type: "varchar", length: 50 }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "tagName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "description", type: "text", nullable: true }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "color", type: "varchar", length: 7, default: "#6B7280" }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "category",
        type: "enum",
        enum: ["priority", "technical", "type", "technology", "module", "custom"],
        default: "custom",
    }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "usage_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], KnowledgeDocumentTag.prototype, "usageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_active", type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], KnowledgeDocumentTag.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], KnowledgeDocumentTag.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentTag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentTag.prototype, "updatedAt", void 0);
exports.KnowledgeDocumentTag = KnowledgeDocumentTag = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_tags")
], KnowledgeDocumentTag);
