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
exports.ArchivedCase = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("../UserProfile");
let ArchivedCase = class ArchivedCase {
};
exports.ArchivedCase = ArchivedCase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ArchivedCase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_case_id", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "originalCaseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "case_number", type: "varchar", length: 255 }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "caseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "classification", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_to", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "updated_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "originalCreatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "originalUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "completed_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "archived_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "archived_by", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "archivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "archive_reason",
        type: "varchar",
        length: 500,
        nullable: true,
    }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "archiveReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "restored_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "restoredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "restored_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedCase.prototype, "restoredBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_restored", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ArchivedCase.prototype, "isRestored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "timer_entries", type: "jsonb", default: () => "'[]'" }),
    __metadata("design:type", Array)
], ArchivedCase.prototype, "timerEntries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "manual_time_entries", type: "jsonb", default: () => "'[]'" }),
    __metadata("design:type", Array)
], ArchivedCase.prototype, "manualTimeEntries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "metadata", type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], ArchivedCase.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "total_time_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], ArchivedCase.prototype, "totalTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedCase.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", Promise)
], ArchivedCase.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_to" }),
    __metadata("design:type", Promise)
], ArchivedCase.prototype, "assignedUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "updated_by" }),
    __metadata("design:type", Promise)
], ArchivedCase.prototype, "updatedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "archived_by" }),
    __metadata("design:type", Promise)
], ArchivedCase.prototype, "archivedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "restored_by" }),
    __metadata("design:type", Promise)
], ArchivedCase.prototype, "restoredByUser", void 0);
exports.ArchivedCase = ArchivedCase = __decorate([
    (0, typeorm_1.Entity)("archived_cases"),
    (0, typeorm_1.Index)(["originalCaseId"]),
    (0, typeorm_1.Index)(["caseNumber"]),
    (0, typeorm_1.Index)(["archivedBy"]),
    (0, typeorm_1.Index)(["archivedAt"]),
    (0, typeorm_1.Index)(["isRestored"]),
    (0, typeorm_1.Index)(["classification"]),
    (0, typeorm_1.Index)(["status"])
], ArchivedCase);
