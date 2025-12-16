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
exports.TodoControl = void 0;
const typeorm_1 = require("typeorm");
const Todo_1 = require("./Todo");
const UserProfile_1 = require("./UserProfile");
const CaseStatusControl_1 = require("./CaseStatusControl");
const TodoTimeEntry_1 = require("./TodoTimeEntry");
const TodoManualTimeEntry_1 = require("./TodoManualTimeEntry");
let TodoControl = class TodoControl {
};
exports.TodoControl = TodoControl;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TodoControl.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "todo_id", unique: true }),
    __metadata("design:type", String)
], TodoControl.prototype, "todoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id" }),
    __metadata("design:type", String)
], TodoControl.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "status_id" }),
    __metadata("design:type", String)
], TodoControl.prototype, "statusId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "total_time_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TodoControl.prototype, "totalTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "timer_start_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], TodoControl.prototype, "timerStartAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_timer_active", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], TodoControl.prototype, "isTimerActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "assigned_at",
        type: "timestamptz",
        default: () => "NOW()",
    }),
    __metadata("design:type", Date)
], TodoControl.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "started_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], TodoControl.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "completed_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], TodoControl.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoControl.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], TodoControl.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Todo_1.Todo, (todo) => todo.control),
    (0, typeorm_1.JoinColumn)({ name: "todo_id" }),
    __metadata("design:type", Todo_1.Todo)
], TodoControl.prototype, "todo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], TodoControl.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CaseStatusControl_1.CaseStatusControl),
    (0, typeorm_1.JoinColumn)({ name: "status_id" }),
    __metadata("design:type", CaseStatusControl_1.CaseStatusControl)
], TodoControl.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TodoTimeEntry_1.TodoTimeEntry, (timeEntry) => timeEntry.todoControl),
    __metadata("design:type", Array)
], TodoControl.prototype, "timeEntries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TodoManualTimeEntry_1.TodoManualTimeEntry, (manualEntry) => manualEntry.todoControl),
    __metadata("design:type", Array)
], TodoControl.prototype, "manualTimeEntries", void 0);
exports.TodoControl = TodoControl = __decorate([
    (0, typeorm_1.Entity)("todo_control")
], TodoControl);
