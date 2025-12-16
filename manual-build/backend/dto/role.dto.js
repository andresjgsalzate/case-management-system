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
exports.AssignPermissionsRequest = exports.RoleFilterParams = exports.UpdateRoleRequest = exports.CreateRoleRequest = void 0;
const class_validator_1 = require("class-validator");
class CreateRoleRequest {
    constructor() {
        this.isActive = true;
    }
}
exports.CreateRoleRequest = CreateRoleRequest;
__decorate([
    (0, class_validator_1.IsString)({ message: "El nombre es requerido" }),
    (0, class_validator_1.Length)(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" }),
    __metadata("design:type", String)
], CreateRoleRequest.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La descripción debe ser un texto" }),
    (0, class_validator_1.Length)(0, 255, { message: "La descripción no puede exceder 255 caracteres" }),
    __metadata("design:type", String)
], CreateRoleRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "El estado activo debe ser verdadero o falso" }),
    __metadata("design:type", Boolean)
], CreateRoleRequest.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: "Los permisos deben ser un array" }),
    (0, class_validator_1.IsUUID)("all", {
        each: true,
        message: "Cada permiso debe ser un UUID válido",
    }),
    __metadata("design:type", Array)
], CreateRoleRequest.prototype, "permissionIds", void 0);
class UpdateRoleRequest {
}
exports.UpdateRoleRequest = UpdateRoleRequest;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El nombre debe ser un texto" }),
    (0, class_validator_1.Length)(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" }),
    __metadata("design:type", String)
], UpdateRoleRequest.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La descripción debe ser un texto" }),
    (0, class_validator_1.Length)(0, 255, { message: "La descripción no puede exceder 255 caracteres" }),
    __metadata("design:type", String)
], UpdateRoleRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "El estado activo debe ser verdadero o falso" }),
    __metadata("design:type", Boolean)
], UpdateRoleRequest.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: "Los permisos deben ser un array" }),
    (0, class_validator_1.IsUUID)("all", {
        each: true,
        message: "Cada permiso debe ser un UUID válido",
    }),
    __metadata("design:type", Array)
], UpdateRoleRequest.prototype, "permissionIds", void 0);
class RoleFilterParams {
    constructor() {
        this.page = 1;
        this.limit = 10;
    }
}
exports.RoleFilterParams = RoleFilterParams;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoleFilterParams.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RoleFilterParams.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoleFilterParams.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoleFilterParams.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RoleFilterParams.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RoleFilterParams.prototype, "limit", void 0);
class AssignPermissionsRequest {
}
exports.AssignPermissionsRequest = AssignPermissionsRequest;
__decorate([
    (0, class_validator_1.IsArray)({ message: "Los permisos deben ser un array" }),
    (0, class_validator_1.IsUUID)("all", {
        each: true,
        message: "Cada permiso debe ser un UUID válido",
    }),
    __metadata("design:type", Array)
], AssignPermissionsRequest.prototype, "permissionIds", void 0);
