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
exports.KnowledgeDocumentFavorite = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const KnowledgeDocument_1 = require("./KnowledgeDocument");
let KnowledgeDocumentFavorite = class KnowledgeDocumentFavorite {
};
exports.KnowledgeDocumentFavorite = KnowledgeDocumentFavorite;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocumentFavorite.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "document_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentFavorite.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => KnowledgeDocument_1.KnowledgeDocument, (doc) => doc.favorites, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", KnowledgeDocument_1.KnowledgeDocument)
], KnowledgeDocumentFavorite.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid" }),
    __metadata("design:type", String)
], KnowledgeDocumentFavorite.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], KnowledgeDocumentFavorite.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeDocumentFavorite.prototype, "createdAt", void 0);
exports.KnowledgeDocumentFavorite = KnowledgeDocumentFavorite = __decorate([
    (0, typeorm_1.Entity)("knowledge_document_favorites"),
    (0, typeorm_1.Unique)(["documentId", "userId"]),
    (0, typeorm_1.Index)(["documentId"]),
    (0, typeorm_1.Index)(["userId"])
], KnowledgeDocumentFavorite);
