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
exports.KnowledgeDocumentTagRelation = void 0;
const typeorm_1 = require("typeorm");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
const KnowledgeTag_1 = require("./KnowledgeTag");
let KnowledgeDocumentTagRelation = class KnowledgeDocumentTagRelation {
};
exports.KnowledgeDocumentTagRelation = KnowledgeDocumentTagRelation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentTagRelation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id" }),
    __metadata("design:type", String)
], KnowledgeDocumentTagRelation.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "tag_id" }),
    __metadata("design:type", String)
], KnowledgeDocumentTagRelation.prototype, "tagId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentTagRelation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (document) => document.tagRelations, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentTagRelation.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeTag_1.KnowledgeTag, (tag) => tag.documentRelations, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "tag_id" }),
    __metadata("design:type", KnowledgeTag_1.KnowledgeTag)
], KnowledgeDocumentTagRelation.prototype, "tag", void 0);
exports.KnowledgeDocumentTagRelation = KnowledgeDocumentTagRelation = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_tag_relations"),
    (0, typeorm_1.Unique)(["documentId", "tagId"])
], KnowledgeDocumentTagRelation);
