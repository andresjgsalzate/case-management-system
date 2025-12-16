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
exports.TeamStatsQueryDto = exports.BulkTeamMemberDto = exports.TransferTeamLeadershipDto = exports.TeamMemberQueryDto = exports.TeamQueryDto = exports.UpdateTeamMemberDto = exports.AddTeamMemberDto = exports.UpdateTeamDto = exports.CreateTeamDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTeamDto {
}
exports.CreateTeamDto = CreateTeamDto;
__decorate([
    (0, class_validator_1.IsString)({ message: "El nombre debe ser una cadena de texto" }),
    (0, class_validator_1.IsNotEmpty)({ message: "El nombre del equipo es requerido" }),
    (0, class_validator_1.Length)(1, 100, { message: "El nombre debe tener entre 1 y 100 caracteres" }),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: "El código debe ser una cadena de texto" }),
    (0, class_validator_1.IsNotEmpty)({ message: "El código del equipo es requerido" }),
    (0, class_validator_1.Length)(2, 10, { message: "El código debe tener entre 2 y 10 caracteres" }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_-]+$/, {
        message: "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos",
    }),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La descripción debe ser una cadena de texto" }),
    (0, class_validator_1.MaxLength)(1000, {
        message: "La descripción no puede exceder 1000 caracteres",
    }),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)({
        message: "El color debe estar en formato hexadecimal válido (#RRGGBB)",
    }),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del manager debe ser un UUID válido" }),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], CreateTeamDto.prototype, "isActive", void 0);
class UpdateTeamDto {
}
exports.UpdateTeamDto = UpdateTeamDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El nombre debe ser una cadena de texto" }),
    (0, class_validator_1.IsNotEmpty)({ message: "El nombre del equipo no puede estar vacío" }),
    (0, class_validator_1.Length)(1, 100, { message: "El nombre debe tener entre 1 y 100 caracteres" }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El código debe ser una cadena de texto" }),
    (0, class_validator_1.IsNotEmpty)({ message: "El código del equipo no puede estar vacío" }),
    (0, class_validator_1.Length)(2, 10, { message: "El código debe tener entre 2 y 10 caracteres" }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_-]+$/, {
        message: "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos",
    }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La descripción debe ser una cadena de texto" }),
    (0, class_validator_1.MaxLength)(1000, {
        message: "La descripción no puede exceder 1000 caracteres",
    }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)({
        message: "El color debe estar en formato hexadecimal válido (#RRGGBB)",
    }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del manager debe ser un UUID válido" }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], UpdateTeamDto.prototype, "isActive", void 0);
class AddTeamMemberDto {
}
exports.AddTeamMemberDto = AddTeamMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "El ID del usuario debe ser un UUID válido" }),
    __metadata("design:type", String)
], AddTeamMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["manager", "lead", "senior", "member"], {
        message: "El rol debe ser uno de: manager, lead, senior, member",
    }),
    __metadata("design:type", String)
], AddTeamMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], AddTeamMemberDto.prototype, "isActive", void 0);
class UpdateTeamMemberDto {
}
exports.UpdateTeamMemberDto = UpdateTeamMemberDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["manager", "lead", "senior", "member"], {
        message: "El rol debe ser uno de: manager, lead, senior, member",
    }),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], UpdateTeamMemberDto.prototype, "isActive", void 0);
class TeamQueryDto {
}
exports.TeamQueryDto = TeamQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La búsqueda debe ser una cadena de texto" }),
    (0, class_validator_1.MinLength)(1, { message: "La búsqueda debe tener al menos 1 caracter" }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], TeamQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del manager debe ser un UUID válido" }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "managerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El código debe ser una cadena de texto" }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El ordenamiento debe ser una cadena de texto" }),
    (0, class_validator_1.IsEnum)(["name", "code", "createdAt", "updatedAt", "membersCount"], {
        message: "El ordenamiento debe ser uno de: name, code, createdAt, updatedAt, membersCount",
    }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["ASC", "DESC"], {
        message: "La dirección debe ser ASC o DESC",
    }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La página debe ser un número" }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: "La página debe ser un número entero positivo" }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El límite debe ser un número" }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: "El límite debe ser un número entero positivo" }),
    __metadata("design:type", String)
], TeamQueryDto.prototype, "limit", void 0);
class TeamMemberQueryDto {
}
exports.TeamMemberQueryDto = TeamMemberQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del equipo debe ser un UUID válido" }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del usuario debe ser un UUID válido" }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["manager", "lead", "senior", "member"], {
        message: "El rol debe ser uno de: manager, lead, senior, member",
    }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "isActive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], TeamMemberQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La búsqueda debe ser una cadena de texto" }),
    (0, class_validator_1.MinLength)(1, { message: "La búsqueda debe tener al menos 1 caracter" }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["joinedAt", "leftAt", "role", "user.fullName"], {
        message: "El ordenamiento debe ser uno de: joinedAt, leftAt, role, user.fullName",
    }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["ASC", "DESC"], {
        message: "La dirección debe ser ASC o DESC",
    }),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "sortOrder", void 0);
class TransferTeamLeadershipDto {
}
exports.TransferTeamLeadershipDto = TransferTeamLeadershipDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "El ID del nuevo manager debe ser un UUID válido" }),
    __metadata("design:type", String)
], TransferTeamLeadershipDto.prototype, "newManagerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La razón debe ser una cadena de texto" }),
    (0, class_validator_1.MaxLength)(500, { message: "La razón no puede exceder 500 caracteres" }),
    __metadata("design:type", String)
], TransferTeamLeadershipDto.prototype, "reason", void 0);
class BulkTeamMemberDto {
}
exports.BulkTeamMemberDto = BulkTeamMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, {
        each: true,
        message: "Todos los IDs de usuario deben ser UUIDs válidos",
    }),
    __metadata("design:type", Array)
], BulkTeamMemberDto.prototype, "userIds", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["manager", "lead", "senior", "member"], {
        message: "El rol debe ser uno de: manager, lead, senior, member",
    }),
    __metadata("design:type", String)
], BulkTeamMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "La razón debe ser una cadena de texto" }),
    (0, class_validator_1.MaxLength)(500, { message: "La razón no puede exceder 500 caracteres" }),
    __metadata("design:type", String)
], BulkTeamMemberDto.prototype, "reason", void 0);
class TeamStatsQueryDto {
}
exports.TeamStatsQueryDto = TeamStatsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: "El ID del equipo debe ser un UUID válido" }),
    __metadata("design:type", String)
], TeamStatsQueryDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: "El período debe ser una cadena de texto" }),
    (0, class_validator_1.IsEnum)(["week", "month", "quarter", "year"], {
        message: "El período debe ser uno de: week, month, quarter, year",
    }),
    __metadata("design:type", String)
], TeamStatsQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: "includeInactive debe ser un valor booleano" }),
    __metadata("design:type", Boolean)
], TeamStatsQueryDto.prototype, "includeInactive", void 0);
