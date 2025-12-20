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
exports.AuditEntityChange = exports.ChangeType = void 0;
const typeorm_1 = require("typeorm");
const AuditLog_1 = require("./AuditLog");
var ChangeType;
(function (ChangeType) {
    ChangeType["ADDED"] = "ADDED";
    ChangeType["MODIFIED"] = "MODIFIED";
    ChangeType["REMOVED"] = "REMOVED";
})(ChangeType || (exports.ChangeType = ChangeType = {}));
let AuditEntityChange = class AuditEntityChange {
    getChangeDescription() {
        const descriptions = {
            [ChangeType.ADDED]: "añadido",
            [ChangeType.MODIFIED]: "modificado",
            [ChangeType.REMOVED]: "eliminado",
        };
        return descriptions[this.changeType] || this.changeType;
    }
    getDisplayValue(value) {
        if (!value)
            return "(vacío)";
        if (this.isSensitive)
            return "***";
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === "object") {
                return JSON.stringify(parsed, null, 2);
            }
            return parsed.toString();
        }
        catch {
            return value.length > 100 ? value.substring(0, 100) + "..." : value;
        }
    }
    getOldDisplayValue() {
        return this.getDisplayValue(this.oldValue);
    }
    getNewDisplayValue() {
        return this.getDisplayValue(this.newValue);
    }
    getFieldDisplayName() {
        const fieldNames = {
            fullName: "Nombre completo",
            email: "Correo electrónico",
            isActive: "Estado activo",
            roleName: "Rol",
            title: "Título",
            description: "Descripción",
            estado: "Estado",
            fechaVencimiento: "Fecha de vencimiento",
            fechaResolucion: "Fecha de resolución",
            observaciones: "Observaciones",
            isCompleted: "Completado",
            assignedUserId: "Usuario asignado",
            createdAt: "Fecha de creación",
            updatedAt: "Fecha de actualización",
        };
        return fieldNames[this.fieldName] || this.fieldName;
    }
    getFullChangeDescription() {
        const fieldName = this.getFieldDisplayName();
        const changeType = this.getChangeDescription();
        switch (this.changeType) {
            case ChangeType.ADDED:
                return `${fieldName} fue ${changeType} con valor: ${this.getNewDisplayValue()}`;
            case ChangeType.REMOVED:
                return `${fieldName} fue ${changeType} (valor anterior: ${this.getOldDisplayValue()})`;
            case ChangeType.MODIFIED:
                return `${fieldName} fue ${changeType} de "${this.getOldDisplayValue()}" a "${this.getNewDisplayValue()}"`;
            default:
                return `${fieldName} fue ${changeType}`;
        }
    }
};
exports.AuditEntityChange = AuditEntityChange;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "audit_log_id", type: "uuid" }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "auditLogId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "field_name", type: "varchar", length: 100 }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "fieldName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "field_type", type: "varchar", length: 50 }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "fieldType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "old_value", type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "oldValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "new_value", type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "newValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "change_type",
        type: "enum",
        enum: ChangeType,
    }),
    __metadata("design:type", String)
], AuditEntityChange.prototype, "changeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_sensitive", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], AuditEntityChange.prototype, "isSensitive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], AuditEntityChange.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AuditLog_1.AuditLog, (auditLog) => auditLog.changes, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "audit_log_id" }),
    __metadata("design:type", AuditLog_1.AuditLog)
], AuditEntityChange.prototype, "auditLog", void 0);
exports.AuditEntityChange = AuditEntityChange = __decorate([
    (0, typeorm_1.Entity)("audit_entity_changes"),
    (0, typeorm_1.Index)(["auditLogId"]),
    (0, typeorm_1.Index)(["fieldName"]),
    (0, typeorm_1.Index)(["changeType"])
], AuditEntityChange);
