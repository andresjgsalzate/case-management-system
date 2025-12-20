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
exports.KnowledgeDocumentFeedback = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentFeedback = class KnowledgeDocumentFeedback {
};
exports.KnowledgeDocumentFeedback = KnowledgeDocumentFeedback;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentFeedback.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentFeedback.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.feedback, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentFeedback.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentFeedback.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], KnowledgeDocumentFeedback.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_helpful", type: "boolean" }),
    __metadata("design:type", Boolean)
], KnowledgeDocumentFeedback.prototype, "isHelpful", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentFeedback.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentFeedback.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentFeedback.prototype, "updatedAt", void 0);
exports.KnowledgeDocumentFeedback = KnowledgeDocumentFeedback = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_feedback"),
    (0, typeorm_1.Unique)(["documentId", "userId"])
], KnowledgeDocumentFeedback);
