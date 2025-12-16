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
exports.ArchivedTodo = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("../UserProfile");
let ArchivedTodo = class ArchivedTodo {
};
exports.ArchivedTodo = ArchivedTodo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_todo_id", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "originalTodoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_completed", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ArchivedTodo.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "due_date", type: "date", nullable: true }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "originalCreatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "originalUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "completed_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by_user_id", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_user_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "assignedUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "case_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "caseId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "archived_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "archived_by", type: "uuid" }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "archivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "archive_reason", type: "text", nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "archiveReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "restored_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "restoredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "restored_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], ArchivedTodo.prototype, "restoredBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_restored", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ArchivedTodo.prototype, "isRestored", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_data", type: "jsonb" }),
    __metadata("design:type", Object)
], ArchivedTodo.prototype, "originalData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "control_data", type: "jsonb" }),
    __metadata("design:type", Object)
], ArchivedTodo.prototype, "controlData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "timer_entries", type: "jsonb", default: () => "'[]'" }),
    __metadata("design:type", Array)
], ArchivedTodo.prototype, "timerEntries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "manual_time_entries", type: "jsonb", default: () => "'[]'" }),
    __metadata("design:type", Array)
], ArchivedTodo.prototype, "manualTimeEntries", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "metadata", type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], ArchivedTodo.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "total_time_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], ArchivedTodo.prototype, "totalTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "timer_time_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], ArchivedTodo.prototype, "timerTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "manual_time_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], ArchivedTodo.prototype, "manualTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ArchivedTodo.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by_user_id" }),
    __metadata("design:type", Promise)
], ArchivedTodo.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_user_id" }),
    __metadata("design:type", Promise)
], ArchivedTodo.prototype, "assignedUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "archived_by" }),
    __metadata("design:type", Promise)
], ArchivedTodo.prototype, "archivedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: "restored_by" }),
    __metadata("design:type", Promise)
], ArchivedTodo.prototype, "restoredByUser", void 0);
exports.ArchivedTodo = ArchivedTodo = __decorate([
    (0, typeorm_1.Entity)("archived_todos"),
    (0, typeorm_1.Index)(["originalTodoId"]),
    (0, typeorm_1.Index)(["title"]),
    (0, typeorm_1.Index)(["archivedBy"]),
    (0, typeorm_1.Index)(["archivedAt"]),
    (0, typeorm_1.Index)(["isRestored"]),
    (0, typeorm_1.Index)(["priority"]),
    (0, typeorm_1.Index)(["category"]),
    (0, typeorm_1.Index)(["caseId"])
], ArchivedTodo);
