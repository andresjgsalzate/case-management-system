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
exports.KnowledgeDocumentVersion = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentVersion = class KnowledgeDocumentVersion {
};
exports.KnowledgeDocumentVersion = KnowledgeDocumentVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentVersion.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.versions, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentVersion.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "version_number", type: "integer" }),
    __metadata("design:type", Number)
], KnowledgeDocumentVersion.prototype, "versionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb" }),
    __metadata("design:type", Object)
], KnowledgeDocumentVersion.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], KnowledgeDocumentVersion.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "change_summary", type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentVersion.prototype, "changeSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentVersion.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocumentVersion.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentVersion.prototype, "createdAt", void 0);
exports.KnowledgeDocumentVersion = KnowledgeDocumentVersion = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_versions"),
    (0, typeorm_1.Unique)(["documentId", "versionNumber"])
], KnowledgeDocumentVersion);
