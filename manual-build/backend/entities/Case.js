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
exports.Case = exports.EstadoCase = exports.ClasificacionCase = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const Application_1 = require("./Application");
const Origin_1 = require("./Origin");
var ClasificacionCase;
(function (ClasificacionCase) {
    ClasificacionCase["BAJA"] = "Baja Complejidad";
    ClasificacionCase["MEDIA"] = "Media Complejidad";
    ClasificacionCase["ALTA"] = "Alta Complejidad";
})(ClasificacionCase || (exports.ClasificacionCase = ClasificacionCase = {}));
var EstadoCase;
(function (EstadoCase) {
    EstadoCase["NUEVO"] = "nuevo";
    EstadoCase["ASIGNADO"] = "asignado";
    EstadoCase["EN_PROGRESO"] = "en_progreso";
    EstadoCase["PENDIENTE"] = "pendiente";
    EstadoCase["RESUELTO"] = "resuelto";
    EstadoCase["CERRADO"] = "cerrado";
    EstadoCase["CANCELADO"] = "cancelado";
    EstadoCase["RESTAURADO"] = "restaurado";
})(EstadoCase || (exports.EstadoCase = EstadoCase = {}));
let Case = class Case {
    calculateScoring() {
        this.puntuacion = this.calcularPuntuacion();
        this.clasificacion = this.clasificarCaso();
    }
    calcularPuntuacion() {
        const total = this.historialCaso +
            this.conocimientoModulo +
            this.manipulacionDatos +
            this.claridadDescripcion +
            this.causaFallo;
        return total;
    }
    clasificarCaso() {
        if (this.puntuacion >= 12)
            return ClasificacionCase.ALTA;
        if (this.puntuacion >= 7)
            return ClasificacionCase.MEDIA;
        return ClasificacionCase.BAJA;
    }
};
exports.Case = Case;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Case.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], Case.prototype, "numeroCaso", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Case.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Case.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Case.prototype, "historialCaso", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Case.prototype, "conocimientoModulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Case.prototype, "manipulacionDatos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Case.prototype, "claridadDescripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Case.prototype, "causaFallo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], Case.prototype, "puntuacion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ClasificacionCase,
    }),
    __metadata("design:type", String)
], Case.prototype, "clasificacion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EstadoCase,
        default: EstadoCase.NUEVO,
    }),
    __metadata("design:type", String)
], Case.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Case.prototype, "fechaVencimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Case.prototype, "fechaResolucion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, (user) => user.cases),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Case.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile),
    (0, typeorm_1.JoinColumn)({ name: "assignedToId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Case.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "applicationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Application_1.Application, (application) => application.cases),
    (0, typeorm_1.JoinColumn)({ name: "applicationId" }),
    __metadata("design:type", Application_1.Application)
], Case.prototype, "application", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "originId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Origin_1.Origin, (origin) => origin.cases),
    (0, typeorm_1.JoinColumn)({ name: "originId" }),
    __metadata("design:type", Origin_1.Origin)
], Case.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Case.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Case.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Case.prototype, "calculateScoring", null);
exports.Case = Case = __decorate([
    (0, typeorm_1.Entity)("cases")
], Case);
