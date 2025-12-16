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
exports.TodoTimeEntry = void 0;
const typeorm_1 = require("typeorm");
const TodoControl_1 = require("./TodoControl");
const UserProfile_1 = require("./UserProfile");
let TodoTimeEntry = class TodoTimeEntry {
};
exports.TodoTimeEntry = TodoTimeEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TodoTimeEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "todo_control_id" }),
    __metadata("design:type", String)
], TodoTimeEntry.prototype, "todoControlId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id" }),
    __metadata("design:type", String)
], TodoTimeEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "start_time", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoTimeEntry.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "end_time", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], TodoTimeEntry.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "duration_minutes", type: "integer", nullable: true }),
    __metadata("design:type", Number)
], TodoTimeEntry.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "entry_type",
        type: "varchar",
        length: 20,
        default: "automatic",
    }),
    __metadata("design:type", String)
], TodoTimeEntry.prototype, "entryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TodoTimeEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoTimeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoTimeEntry.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TodoControl_1.TodoControl, (control) => control.timeEntries),
    (0, typeorm_1.JoinColumn)({ name: "todo_control_id" }),
    __metadata("design:type", TodoControl_1.TodoControl)
], TodoTimeEntry.prototype, "todoControl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], TodoTimeEntry.prototype, "user", void 0);
exports.TodoTimeEntry = TodoTimeEntry = __decorate([
    (0, typeorm_1.Entity)("todo_time_entries")
], TodoTimeEntry);
