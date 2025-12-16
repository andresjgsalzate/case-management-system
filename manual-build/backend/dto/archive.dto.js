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
exports.ArchiveStatsResponseDto = exports.ArchivedItemResponseDto = exports.ArchivedTodoResponseDto = exports.ArchivedCaseResponseDto = exports.ArchiveFiltersDto = exports.ArchiveStatsDto = exports.DeleteArchivedItemDto = exports.RestoreArchivedItemDto = exports.CreateArchivedTodoDto = exports.CreateArchivedCaseDto = void 0;
const class_validator_1 = require("class-validator");
class CreateArchivedCaseDto {
}
exports.CreateArchivedCaseDto = CreateArchivedCaseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "originalCaseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "caseNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "classification", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "assignedUserId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "createdByUserId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "originalCreatedAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "originalUpdatedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "completedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedCaseDto.prototype, "archiveReason", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateArchivedCaseDto.prototype, "originalData", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateArchivedCaseDto.prototype, "controlData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateArchivedCaseDto.prototype, "totalTimeMinutes", void 0);
class CreateArchivedTodoDto {
}
exports.CreateArchivedTodoDto = CreateArchivedTodoDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "originalTodoId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateArchivedTodoDto.prototype, "isCompleted", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "originalCreatedAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "originalUpdatedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "completedAt", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "createdByUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "assignedUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "caseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchivedTodoDto.prototype, "archiveReason", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateArchivedTodoDto.prototype, "originalData", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateArchivedTodoDto.prototype, "controlData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateArchivedTodoDto.prototype, "totalTimeMinutes", void 0);
class RestoreArchivedItemDto {
}
exports.RestoreArchivedItemDto = RestoreArchivedItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RestoreArchivedItemDto.prototype, "reason", void 0);
class DeleteArchivedItemDto {
}
exports.DeleteArchivedItemDto = DeleteArchivedItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteArchivedItemDto.prototype, "reason", void 0);
class ArchiveStatsDto {
}
exports.ArchiveStatsDto = ArchiveStatsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsDto.prototype, "totalArchivedCases", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsDto.prototype, "totalArchivedTodos", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsDto.prototype, "totalArchivedTimeMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsDto.prototype, "archivedThisMonth", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsDto.prototype, "restoredThisMonth", void 0);
class ArchiveFiltersDto {
}
exports.ArchiveFiltersDto = ArchiveFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "archivedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "classification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ArchiveFiltersDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ArchiveFiltersDto.prototype, "showRestored", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveFiltersDto.prototype, "offset", void 0);
class ArchivedCaseResponseDto {
}
exports.ArchivedCaseResponseDto = ArchivedCaseResponseDto;
class ArchivedTodoResponseDto {
}
exports.ArchivedTodoResponseDto = ArchivedTodoResponseDto;
class ArchivedItemResponseDto {
}
exports.ArchivedItemResponseDto = ArchivedItemResponseDto;
class ArchiveStatsResponseDto {
}
exports.ArchiveStatsResponseDto = ArchiveStatsResponseDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsResponseDto.prototype, "totalArchivedCases", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsResponseDto.prototype, "totalArchivedTodos", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsResponseDto.prototype, "totalArchivedTimeMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsResponseDto.prototype, "archivedThisMonth", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ArchiveStatsResponseDto.prototype, "restoredThisMonth", void 0);
