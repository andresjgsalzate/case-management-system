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
exports.AuditLog = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const AuditEntityChange_1 = require("./AuditEntityChange");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["RESTORE"] = "RESTORE";
    AuditAction["ARCHIVE"] = "ARCHIVE";
    AuditAction["READ"] = "READ";
    AuditAction["DOWNLOAD"] = "DOWNLOAD";
    AuditAction["VIEW"] = "VIEW";
    AuditAction["EXPORT"] = "EXPORT";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["LOGOUT_ALL"] = "LOGOUT_ALL";
    AuditAction["FORCE_LOGOUT"] = "FORCE_LOGOUT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLog = class AuditLog {
    getEntityDisplayName() {
        return this.entityName || `${this.entityType}#${this.entityId}`;
    }
    getActionDescription() {
        const actionDescriptions = {
            [AuditAction.CREATE]: "creó",
            [AuditAction.UPDATE]: "actualizó",
            [AuditAction.DELETE]: "eliminó",
            [AuditAction.RESTORE]: "restauró",
            [AuditAction.ARCHIVE]: "archivó",
            [AuditAction.READ]: "accedió a",
            [AuditAction.DOWNLOAD]: "descargó",
            [AuditAction.VIEW]: "visualizó",
            [AuditAction.EXPORT]: "exportó",
            [AuditAction.LOGIN]: "inició sesión en",
            [AuditAction.LOGOUT]: "cerró sesión de",
            [AuditAction.LOGOUT_ALL]: "cerró todas las sesiones de",
            [AuditAction.FORCE_LOGOUT]: "forzó el cierre de sesión en",
        };
        return actionDescriptions[this.action] || this.action;
    }
    getFullDescription() {
        return `${this.userName || this.userEmail} ${this.getActionDescription()} ${this.getEntityDisplayName()}`;
    }
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_email", type: "varchar", length: 255 }),
    __metadata("design:type", String)
], AuditLog.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_name", type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_role", type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userRole", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AuditAction,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "entity_type", type: "varchar", length: 100 }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "entity_id", type: "uuid" }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "entity_name", type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], AuditLog.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "operation_context", type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "operationContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_address", type: "inet", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_city", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_country", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_country_code",
        type: "varchar",
        length: 10,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipCountryCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_timezone", type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipTimezone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_latitude",
        type: "decimal",
        precision: 10,
        scale: 8,
        nullable: true,
    }),
    __metadata("design:type", Number)
], AuditLog.prototype, "ipLatitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_longitude",
        type: "decimal",
        precision: 11,
        scale: 8,
        nullable: true,
    }),
    __metadata("design:type", Number)
], AuditLog.prototype, "ipLongitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_network_cidr",
        type: "varchar",
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipNetworkCidr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_asn", type: "integer", nullable: true }),
    __metadata("design:type", Number)
], AuditLog.prototype, "ipAsn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_isp", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipIsp", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_organization",
        type: "varchar",
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipOrganization", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "ip_enrichment_source",
        type: "varchar",
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipEnrichmentSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ip_is_private", type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "ipIsPrivate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_agent", type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "session_id", type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "request_path",
        type: "varchar",
        length: 500,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestPath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "request_method",
        type: "varchar",
        length: 10,
        nullable: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "operation_success", type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "operationSuccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "error_message", type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], AuditLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AuditEntityChange_1.AuditEntityChange, (change) => change.auditLog, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], AuditLog.prototype, "changes", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)("audit_logs"),
    (0, typeorm_1.Index)(["userId"]),
    (0, typeorm_1.Index)(["action"]),
    (0, typeorm_1.Index)(["entityType"]),
    (0, typeorm_1.Index)(["entityId"]),
    (0, typeorm_1.Index)(["module"]),
    (0, typeorm_1.Index)(["createdAt"]),
    (0, typeorm_1.Index)(["ipAddress"]),
    (0, typeorm_1.Index)(["entityType", "entityId"]),
    (0, typeorm_1.Index)(["userId", "action", "createdAt"])
], AuditLog);
