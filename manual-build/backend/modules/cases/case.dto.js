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
exports.CaseFiltersDto = exports.UpdateCaseDto = exports.CreateCaseDto = void 0;
const class_validator_1 = require("class-validator");
const Case_1 = require("../../entities/Case");
class CreateCaseDto {
}
exports.CreateCaseDto = CreateCaseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "El número de caso es requerido" }),
    (0, class_validator_1.MaxLength)(50, {
        message: "El número de caso no puede exceder 50 caracteres",
    }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "numeroCaso", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "La descripción es requerida" }),
    (0, class_validator_1.MaxLength)(500, { message: "La descripción no puede exceder 500 caracteres" }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: "Debe seleccionar una opción" }),
    (0, class_validator_1.Max)(3, { message: "Valor inválido" }),
    __metadata("design:type", Number)
], CreateCaseDto.prototype, "historialCaso", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: "Debe seleccionar una opción" }),
    (0, class_validator_1.Max)(3, { message: "Valor inválido" }),
    __metadata("design:type", Number)
], CreateCaseDto.prototype, "conocimientoModulo", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: "Debe seleccionar una opción" }),
    (0, class_validator_1.Max)(3, { message: "Valor inválido" }),
    __metadata("design:type", Number)
], CreateCaseDto.prototype, "manipulacionDatos", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: "Debe seleccionar una opción" }),
    (0, class_validator_1.Max)(3, { message: "Valor inválido" }),
    __metadata("design:type", Number)
], CreateCaseDto.prototype, "claridadDescripcion", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: "Debe seleccionar una opción" }),
    (0, class_validator_1.Max)(3, { message: "Valor inválido" }),
    __metadata("design:type", Number)
], CreateCaseDto.prototype, "causaFallo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "originId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "applicationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, {
        message: "Las observaciones no pueden exceder 1000 caracteres",
    }),
    __metadata("design:type", String)
], CreateCaseDto.prototype, "observaciones", void 0);
class UpdateCaseDto {
}
exports.UpdateCaseDto = UpdateCaseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "El número de caso es requerido" }),
    (0, class_validator_1.MaxLength)(50, {
        message: "El número de caso no puede exceder 50 caracteres",
    }),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "numeroCaso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "La descripción es requerida" }),
    (0, class_validator_1.MaxLength)(500, { message: "La descripción no puede exceder 500 caracteres" }),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateCaseDto.prototype, "historialCaso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateCaseDto.prototype, "conocimientoModulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateCaseDto.prototype, "manipulacionDatos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateCaseDto.prototype, "claridadDescripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateCaseDto.prototype, "causaFallo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "originId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "applicationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "observaciones", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Case_1.EstadoCase),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateCaseDto.prototype, "assignedToId", void 0);
class CaseFiltersDto {
}
exports.CaseFiltersDto = CaseFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Case_1.ClasificacionCase),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "clasificacion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "originId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "applicationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "busqueda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Case_1.EstadoCase),
    __metadata("design:type", String)
], CaseFiltersDto.prototype, "estado", void 0);
