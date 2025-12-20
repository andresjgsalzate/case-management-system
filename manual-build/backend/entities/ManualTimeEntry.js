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
exports.ManualTimeEntry = void 0;
const typeorm_1 = require("typeorm");
const CaseControl_1 = require("./CaseControl");
const UserProfile_1 = require("./UserProfile");
let ManualTimeEntry = class ManualTimeEntry {
};
exports.ManualTimeEntry = ManualTimeEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "caseControlId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], ManualTimeEntry.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], ManualTimeEntry.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ManualTimeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ManualTimeEntry.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CaseControl_1.CaseControl, (caseControl) => caseControl.manualTimeEntries, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "caseControlId" }),
    __metadata("design:type", CaseControl_1.CaseControl)
], ManualTimeEntry.prototype, "caseControl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], ManualTimeEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "createdBy" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], ManualTimeEntry.prototype, "creator", void 0);
exports.ManualTimeEntry = ManualTimeEntry = __decorate([
    (0, typeorm_1.Entity)("manual_time_entries")
], ManualTimeEntry);
