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
exports.Note = void 0;
const typeorm_1 = require("typeorm");
const Case_1 = require("./Case");
const UserProfile_1 = require("./UserProfile");
let Note = class Note {
};
exports.Note = Note;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Note.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], Note.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Note.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "note_type",
        type: "varchar",
        length: 50,
        default: "note",
    }),
    __metadata("design:type", String)
], Note.prototype, "noteType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "priority",
        type: "varchar",
        length: 20,
        default: "medium",
    }),
    __metadata("design:type", String)
], Note.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "difficulty_level",
        type: "integer",
        default: 1,
    }),
    __metadata("design:type", Number)
], Note.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", array: true, default: "{}" }),
    __metadata("design:type", Array)
], Note.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "case_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "caseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", type: "uuid" }),
    __metadata("design:type", String)
], Note.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_to", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_important", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isImportant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_archived", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isArchived", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_template", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_published", type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Note.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_deprecated", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isDeprecated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "view_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Note.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "helpful_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Note.prototype, "helpfulCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "not_helpful_count", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Note.prototype, "notHelpfulCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "version", type: "integer", default: 1 }),
    __metadata("design:type", Number)
], Note.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "archived_at",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Date)
], Note.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "archived_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "archivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "reminder_date",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Date)
], Note.prototype, "reminderDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_reminder_sent", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isReminderSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "complexity_notes", type: "text", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "complexityNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "prerequisites", type: "text", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "prerequisites", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "estimated_solution_time",
        type: "integer",
        nullable: true,
    }),
    __metadata("design:type", Number)
], Note.prototype, "estimatedSolutionTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "deprecation_reason", type: "text", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "deprecationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "replacement_note_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "replacementNoteId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "last_reviewed_at",
        type: "timestamp with time zone",
        nullable: true,
    }),
    __metadata("design:type", Date)
], Note.prototype, "lastReviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_reviewed_by", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "lastReviewedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Note.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Note.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Case_1.Case, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "case_id" }),
    __metadata("design:type", Case_1.Case)
], Note.prototype, "case", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Note.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_to" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Note.prototype, "assignedToUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "archived_by" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Note.prototype, "archivedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Note, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "replacement_note_id" }),
    __metadata("design:type", Note)
], Note.prototype, "replacementNote", void 0);
exports.Note = Note = __decorate([
    (0, typeorm_1.Entity)("notes"),
    (0, typeorm_1.Index)(["createdBy"]),
    (0, typeorm_1.Index)(["assignedTo"]),
    (0, typeorm_1.Index)(["caseId"]),
    (0, typeorm_1.Index)(["isArchived"]),
    (0, typeorm_1.Index)(["isImportant"]),
    (0, typeorm_1.Index)(["reminderDate"]),
    (0, typeorm_1.Index)(["createdAt"])
], Note);
