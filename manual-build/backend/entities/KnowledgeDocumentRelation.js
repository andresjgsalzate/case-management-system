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
exports.KnowledgeDocumentRelation = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentRelation = class KnowledgeDocumentRelation {
};
exports.KnowledgeDocumentRelation = KnowledgeDocumentRelation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentRelation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "parent_document_id" }),
    __metadata("design:type", String)
], KnowledgeDocumentRelation.prototype, "parentDocumentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.parentRelations, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "parent_document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentRelation.prototype, "parentDocument", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "child_document_id" }),
    __metadata("design:type", String)
], KnowledgeDocumentRelation.prototype, "childDocumentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.childRelations, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "child_document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentRelation.prototype, "childDocument", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "relation_type",
        type: "varchar",
        length: 50,
        default: "related",
    }),
    __metadata("design:type", String)
], KnowledgeDocumentRelation.prototype, "relationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by" }),
    __metadata("design:type", String)
], KnowledgeDocumentRelation.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", Promise)
], KnowledgeDocumentRelation.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentRelation.prototype, "createdAt", void 0);
exports.KnowledgeDocumentRelation = KnowledgeDocumentRelation = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_relations"),
    (0, typeorm_1.Unique)(["parentDocumentId", "childDocumentId", "relationType"])
], KnowledgeDocumentRelation);
