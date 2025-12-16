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
exports.Application = void 0;
const typeorm_1 = require("typeorm");
const Case_1 = require("./Case");
let Application = class Application {
};
exports.Application = Application;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Application.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], Application.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Application.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Application.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Application.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Application.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Case_1.Case, (caseEntity) => caseEntity.application),
    __metadata("design:type", Array)
], Application.prototype, "cases", void 0);
exports.Application = Application = __decorate([
    (0, typeorm_1.Entity)("aplicaciones")
], Application);
