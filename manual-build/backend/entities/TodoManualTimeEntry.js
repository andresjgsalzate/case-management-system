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
exports.TodoManualTimeEntry = void 0;
const typeorm_1 = require("typeorm");
const TodoControl_1 = require("./TodoControl");
const UserProfile_1 = require("./UserProfile");
let TodoManualTimeEntry = class TodoManualTimeEntry {
};
exports.TodoManualTimeEntry = TodoManualTimeEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TodoManualTimeEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "todo_control_id" }),
    __metadata("design:type", String)
], TodoManualTimeEntry.prototype, "todoControlId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id" }),
    __metadata("design:type", String)
], TodoManualTimeEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], TodoManualTimeEntry.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "duration_minutes", type: "integer" }),
    __metadata("design:type", Number)
], TodoManualTimeEntry.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], TodoManualTimeEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by" }),
    __metadata("design:type", String)
], TodoManualTimeEntry.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoManualTimeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TodoControl_1.TodoControl, (control) => control.manualTimeEntries),
    (0, typeorm_1.JoinColumn)({ name: "todo_control_id" }),
    __metadata("design:type", TodoControl_1.TodoControl)
], TodoManualTimeEntry.prototype, "todoControl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], TodoManualTimeEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], TodoManualTimeEntry.prototype, "creator", void 0);
exports.TodoManualTimeEntry = TodoManualTimeEntry = __decorate([
    (0, typeorm_1.Entity)("todo_manual_time_entries")
], TodoManualTimeEntry);
