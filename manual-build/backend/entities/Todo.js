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
exports.Todo = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const TodoPriority_1 = require("./TodoPriority");
const TodoControl_1 = require("./TodoControl");
let Todo = class Todo {
    get control() {
        return this.controls && this.controls.length > 0
            ? this.controls[0]
            : undefined;
    }
};
exports.Todo = Todo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Todo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Todo.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Todo.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "priority_id" }),
    __metadata("design:type", String)
], Todo.prototype, "priorityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_user_id", nullable: true }),
    __metadata("design:type", String)
], Todo.prototype, "assignedUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by_user_id" }),
    __metadata("design:type", String)
], Todo.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], Todo.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "estimated_minutes", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Todo.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_completed", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Todo.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "completed_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], Todo.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Todo.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Todo.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TodoPriority_1.TodoPriority),
    (0, typeorm_1.JoinColumn)({ name: "priority_id" }),
    __metadata("design:type", TodoPriority_1.TodoPriority)
], Todo.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Todo.prototype, "assignedUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "created_by_user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Todo.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TodoControl_1.TodoControl, (control) => control.todo),
    __metadata("design:type", Array)
], Todo.prototype, "controls", void 0);
exports.Todo = Todo = __decorate([
    (0, typeorm_1.Entity)("todos")
], Todo);
