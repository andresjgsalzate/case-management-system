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
exports.KnowledgeDocumentReviewEvent = void 0;
const typeorm_1 = require("typeorm");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
const UserProfile_1 = require("./UserProfile");
let KnowledgeDocumentReviewEvent = class KnowledgeDocumentReviewEvent {
};
exports.KnowledgeDocumentReviewEvent = KnowledgeDocumentReviewEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentReviewEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentReviewEvent.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.reviewEvents, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentReviewEvent.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "event_type", type: "varchar", length: 30 }),
    __metadata("design:type", String)
], KnowledgeDocumentReviewEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "actor_user_id", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentReviewEvent.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "actor_user_id" }),
    __metadata("design:type", Promise)
], KnowledgeDocumentReviewEvent.prototype, "actorUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "from_status", type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentReviewEvent.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "to_status", type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentReviewEvent.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "comments", type: "text", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocumentReviewEvent.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentReviewEvent.prototype, "createdAt", void 0);
exports.KnowledgeDocumentReviewEvent = KnowledgeDocumentReviewEvent = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_review_events"),
    (0, typeorm_1.Index)(["documentId", "createdAt"]),
    (0, typeorm_1.Index)(["eventType"]),
    (0, typeorm_1.Index)(["actorUserId"])
], KnowledgeDocumentReviewEvent);
