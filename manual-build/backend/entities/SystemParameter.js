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
exports.SystemParameter = exports.ParameterCategory = exports.ParameterType = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
var ParameterType;
(function (ParameterType) {
    ParameterType["STRING"] = "string";
    ParameterType["NUMBER"] = "number";
    ParameterType["BOOLEAN"] = "boolean";
    ParameterType["JSON"] = "json";
    ParameterType["EMAIL"] = "email";
    ParameterType["URL"] = "url";
    ParameterType["PASSWORD"] = "password";
})(ParameterType || (exports.ParameterType = ParameterType = {}));
var ParameterCategory;
(function (ParameterCategory) {
    ParameterCategory["SESSION"] = "session";
    ParameterCategory["EMAIL"] = "email";
    ParameterCategory["NOTIFICATIONS"] = "notifications";
    ParameterCategory["SECURITY"] = "security";
    ParameterCategory["SYSTEM"] = "system";
    ParameterCategory["FILES"] = "files";
    ParameterCategory["DASHBOARD"] = "dashboard";
    ParameterCategory["REPORTS"] = "reports";
})(ParameterCategory || (exports.ParameterCategory = ParameterCategory = {}));
let SystemParameter = class SystemParameter {
    getParsedValue() {
        if (!this.parameterValue) {
            return this.getDefaultParsedValue();
        }
        switch (this.parameterType) {
            case ParameterType.NUMBER:
                const numValue = Number(this.parameterValue);
                return isNaN(numValue) ? this.getDefaultParsedValue() : numValue;
            case ParameterType.BOOLEAN:
                return this.parameterValue.toLowerCase() === "true";
            case ParameterType.JSON:
                try {
                    return JSON.parse(this.parameterValue);
                }
                catch {
                    return this.getDefaultParsedValue();
                }
            case ParameterType.EMAIL:
            case ParameterType.URL:
            case ParameterType.STRING:
            case ParameterType.PASSWORD:
            default:
                return this.parameterValue;
        }
    }
    getDefaultParsedValue() {
        if (!this.defaultValue) {
            return null;
        }
        switch (this.parameterType) {
            case ParameterType.NUMBER:
                const numValue = Number(this.defaultValue);
                return isNaN(numValue) ? null : numValue;
            case ParameterType.BOOLEAN:
                return this.defaultValue.toLowerCase() === "true";
            case ParameterType.JSON:
                try {
                    return JSON.parse(this.defaultValue);
                }
                catch {
                    return null;
                }
            default:
                return this.defaultValue;
        }
    }
    setParsedValue(value) {
        switch (this.parameterType) {
            case ParameterType.NUMBER:
                this.parameterValue = value?.toString() || null;
                break;
            case ParameterType.BOOLEAN:
                this.parameterValue = value ? "true" : "false";
                break;
            case ParameterType.JSON:
                this.parameterValue = JSON.stringify(value);
                break;
            default:
                this.parameterValue = value?.toString() || null;
        }
    }
    validateValue(value) {
        const errors = [];
        if (this.isRequired &&
            (value === null || value === undefined || value === "")) {
            errors.push(`El parámetro ${this.parameterKey} es requerido`);
            return errors;
        }
        if (!this.validationRules || !value) {
            return errors;
        }
        const rules = this.validationRules;
        if (rules.required && !value) {
            errors.push(`El parámetro ${this.parameterKey} es requerido`);
        }
        if (rules.maxLength &&
            typeof value === "string" &&
            value.length > rules.maxLength) {
            errors.push(`El parámetro ${this.parameterKey} no puede exceder ${rules.maxLength} caracteres`);
        }
        if (rules.minLength &&
            typeof value === "string" &&
            value.length < rules.minLength) {
            errors.push(`El parámetro ${this.parameterKey} debe tener al menos ${rules.minLength} caracteres`);
        }
        if (this.parameterType === ParameterType.NUMBER) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
                errors.push(`El parámetro ${this.parameterKey} debe ser un número válido`);
            }
            else {
                if (rules.min !== undefined && numValue < rules.min) {
                    errors.push(`El parámetro ${this.parameterKey} debe ser mayor o igual a ${rules.min}`);
                }
                if (rules.max !== undefined && numValue > rules.max) {
                    errors.push(`El parámetro ${this.parameterKey} debe ser menor o igual a ${rules.max}`);
                }
            }
        }
        if (rules.enum && Array.isArray(rules.enum)) {
            if (!rules.enum.includes(value)) {
                errors.push(`El parámetro ${this.parameterKey} debe ser uno de: ${rules.enum.join(", ")}`);
            }
        }
        if (this.parameterType === ParameterType.EMAIL) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push(`El parámetro ${this.parameterKey} debe ser un email válido`);
            }
        }
        if (this.parameterType === ParameterType.URL) {
            try {
                new URL(value);
            }
            catch {
                errors.push(`El parámetro ${this.parameterKey} debe ser una URL válida`);
            }
        }
        return errors;
    }
};
exports.SystemParameter = SystemParameter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SystemParameter.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "parameter_key",
        type: "varchar",
        length: 255,
        unique: true,
        nullable: false,
    }),
    __metadata("design:type", String)
], SystemParameter.prototype, "parameterKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "parameter_category",
        type: "enum",
        enum: ParameterCategory,
        nullable: false,
    }),
    __metadata("design:type", String)
], SystemParameter.prototype, "parameterCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "parameter_value",
        type: "text",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "parameterValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "parameter_type",
        type: "enum",
        enum: ParameterType,
        default: ParameterType.STRING,
    }),
    __metadata("design:type", String)
], SystemParameter.prototype, "parameterType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "parameter_description",
        type: "text",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "parameterDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "is_encrypted",
        type: "boolean",
        default: false,
    }),
    __metadata("design:type", Boolean)
], SystemParameter.prototype, "isEncrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "is_required",
        type: "boolean",
        default: false,
    }),
    __metadata("design:type", Boolean)
], SystemParameter.prototype, "isRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "default_value",
        type: "text",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "defaultValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "validation_rules",
        type: "jsonb",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "validationRules", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "is_active",
        type: "boolean",
        default: true,
    }),
    __metadata("design:type", Boolean)
], SystemParameter.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: "created_at",
        type: "timestamp",
    }),
    __metadata("design:type", Date)
], SystemParameter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: "updated_at",
        type: "timestamp",
    }),
    __metadata("design:type", Date)
], SystemParameter.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "created_by",
        type: "uuid",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "updated_by",
        type: "uuid",
        nullable: true,
    }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "updated_by" }),
    __metadata("design:type", Object)
], SystemParameter.prototype, "updater", void 0);
exports.SystemParameter = SystemParameter = __decorate([
    (0, typeorm_1.Entity)("system_parameters"),
    (0, typeorm_1.Index)(["parameterKey"], { unique: true }),
    (0, typeorm_1.Index)(["parameterCategory"]),
    (0, typeorm_1.Index)(["isActive"])
], SystemParameter);
