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
exports.Disposition = void 0;
const typeorm_1 = require("typeorm");
let Disposition = class Disposition {
};
exports.Disposition = Disposition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Disposition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], Disposition.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "case_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Disposition.prototype, "caseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "case_number", type: "varchar" }),
    __metadata("design:type", String)
], Disposition.prototype, "caseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "script_name", type: "text" }),
    __metadata("design:type", String)
], Disposition.prototype, "scriptName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "svn_revision_number", type: "text", nullable: true }),
    __metadata("design:type", String)
], Disposition.prototype, "svnRevisionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "application_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Disposition.prototype, "applicationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "application_name",
        type: "varchar",
        length: 100,
        nullable: false,
    }),
    __metadata("design:type", String)
], Disposition.prototype, "applicationName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Disposition.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid" }),
    __metadata("design:type", String)
], Disposition.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Disposition.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Disposition.prototype, "updatedAt", void 0);
exports.Disposition = Disposition = __decorate([
    (0, typeorm_1.Entity)("dispositions")
], Disposition);
