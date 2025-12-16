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
exports.KnowledgeTag = exports.TagCategory = void 0;
const typeorm_1 = require("typeorm");
const KnowledgeDocumentTagRelation_1 = require("./KnowledgeDocumentTagRelation");
var TagCategory;
(function (TagCategory) {
    TagCategory["PRIORITY"] = "priority";
    TagCategory["TECHNICAL"] = "technical";
    TagCategory["TYPE"] = "type";
    TagCategory["TECHNOLOGY"] = "technology";
    TagCategory["MODULE"] = "module";
    TagCategory["CUSTOM"] = "custom";
})(TagCategory || (exports.TagCategory = TagCategory = {}));
let KnowledgeTag = class KnowledgeTag {
};
exports.KnowledgeTag = KnowledgeTag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "tag_name", type: "varchar", length: 50, unique: true }),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "tagName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "description", type: "text", nullable: true }),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "color", type: "varchar", length: 7, default: "#6B7280" }),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "category",
        type: "enum",
        enum: TagCategory,
        default: TagCategory.CUSTOM,
    }),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_active", type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], KnowledgeTag.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], KnowledgeTag.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeTag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], KnowledgeTag.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => KnowledgeDocumentTagRelation_1.KnowledgeDocumentTagRelation, (relation) => relation.tag),
    __metadata("design:type", Array)
], KnowledgeTag.prototype, "documentRelations", void 0);
exports.KnowledgeTag = KnowledgeTag = __decorate([
    (0, typeorm_1.Entity)("knowledge_tags")
], KnowledgeTag);
