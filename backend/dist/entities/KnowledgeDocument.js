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
exports.KnowledgeDocument = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const DocumentType_1 = require("./DocumentType");
const KnowledgeDocumentTag_1 = require("./KnowledgeDocumentTag");
const KnowledgeDocumentTagRelation_1 = require("./KnowledgeDocumentTagRelation");
const KnowledgeDocumentVersion_1 = require("./KnowledgeDocumentVersion");
const KnowledgeDocumentAttachment_1 = require("./KnowledgeDocumentAttachment");
const KnowledgeDocumentRelation_1 = require("./KnowledgeDocumentRelation");
const KnowledgeDocumentFeedback_1 = require("./KnowledgeDocumentFeedback");
let KnowledgeDocument = class KnowledgeDocument {
};
exports.KnowledgeDocument = KnowledgeDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "json_content", type: "jsonb" }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "jsonContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_type_id", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "documentTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DocumentType_1.DocumentType, (documentType) => documentType.documents, {
        lazy: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_type_id" }),
    __metadata("design:type", Promise)
], KnowledgeDocument.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "medium" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "difficulty_level", type: "integer", default: 1 }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_published", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], KnowledgeDocument.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_template", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], KnowledgeDocument.prototype, "isTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_deprecated", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], KnowledgeDocument.prototype, "isDeprecated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_archived", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], KnowledgeDocument.prototype, "isArchived", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "view_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "helpful_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "helpfulCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "not_helpful_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "notHelpfulCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 1 }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "published_at",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "deprecated_at",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "deprecatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "archived_at",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocument.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_edited_by", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "lastEditedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "last_edited_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocument.prototype, "lastEditedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "archived_by", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "archivedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "archived_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocument.prototype, "archivedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "replacement_document_id", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "replacementDocumentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "replacement_document_id" }),
    __metadata("design:type", Promise)
], KnowledgeDocument.prototype, "replacementDocument", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "tags_json", type: "jsonb", default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "tagsJson", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "associated_cases",
        type: "jsonb",
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "associatedCases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentTag_1.KnowledgeDocumentTag, (tag) => tag.document),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentTagRelation_1.KnowledgeDocumentTagRelation, (relation) => relation.document),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "tagRelations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentVersion_1.KnowledgeDocumentVersion, (version) => version.document),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "versions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment, (attachment) => attachment.document),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentRelation_1.KnowledgeDocumentRelation, (relation) => relation.parentDocument),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "parentRelations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentRelation_1.KnowledgeDocumentRelation, (relation) => relation.childDocument),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "childRelations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentFeedback_1.KnowledgeDocumentFeedback, (feedback) => feedback.document),
    __metadata("design:type", Array)
], KnowledgeDocument.prototype, "feedback", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocument.prototype, "updatedAt", void 0);
exports.KnowledgeDocument = KnowledgeDocument = __decorate([
    (0, typeorm_1.Entity)("knowledge_documents"),
    (0, typeorm_1.Index)(["title"])
], KnowledgeDocument);
