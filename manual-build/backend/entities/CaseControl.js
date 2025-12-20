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
exports.CaseControl = void 0;
const typeorm_1 = require("typeorm");
const Case_1 = require("./Case");
const UserProfile_1 = require("./UserProfile");
const CaseStatusControl_1 = require("./CaseStatusControl");
const TimeEntry_1 = require("./TimeEntry");
const ManualTimeEntry_1 = require("./ManualTimeEntry");
let CaseControl = class CaseControl {
};
exports.CaseControl = CaseControl;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CaseControl.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CaseControl.prototype, "caseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CaseControl.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CaseControl.prototype, "statusId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], CaseControl.prototype, "totalTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], CaseControl.prototype, "timerStartAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], CaseControl.prototype, "isTimerActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], CaseControl.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], CaseControl.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], CaseControl.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CaseControl.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CaseControl.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Case_1.Case, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "caseId" }),
    __metadata("design:type", Case_1.Case)
], CaseControl.prototype, "case", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], CaseControl.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CaseStatusControl_1.CaseStatusControl, { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "statusId" }),
    __metadata("design:type", CaseStatusControl_1.CaseStatusControl)
], CaseControl.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TimeEntry_1.TimeEntry, (timeEntry) => timeEntry.caseControl),
    __metadata("design:type", Array)
], CaseControl.prototype, "timeEntries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ManualTimeEntry_1.ManualTimeEntry, (manualEntry) => manualEntry.caseControl),
    __metadata("design:type", Array)
], CaseControl.prototype, "manualTimeEntries", void 0);
exports.CaseControl = CaseControl = __decorate([
    (0, typeorm_1.Entity)("case_control"),
    (0, typeorm_1.Index)(["caseId"], { unique: true })
], CaseControl);
