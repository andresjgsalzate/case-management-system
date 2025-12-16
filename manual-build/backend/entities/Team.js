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
exports.Team = void 0;
const typeorm_1 = require("typeorm");
const UserProfile_1 = require("./UserProfile");
const TeamMember_1 = require("./TeamMember");
let Team = class Team {
    getActiveMembers() {
        return this.members?.filter((member) => member.isActive) || [];
    }
    getActiveMembersCount() {
        return this.getActiveMembers().length;
    }
    get memberCount() {
        return this.getActiveMembersCount();
    }
    isUserActiveMember(userId) {
        return this.getActiveMembers().some((member) => member.userId === userId);
    }
    getUserRole(userId) {
        const member = this.getActiveMembers().find((member) => member.userId === userId);
        return member?.role || null;
    }
    isUserManager(userId) {
        return (this.managerId === userId ||
            this.getActiveMembers().some((member) => member.userId === userId && member.role === "manager"));
    }
    getMembersByRole(role) {
        return this.getActiveMembers().filter((member) => member.role === role);
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            code: this.code,
            description: this.description,
            color: this.color,
            managerId: this.managerId,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            memberCount: this.memberCount,
            manager: this.manager
                ? {
                    id: this.manager.id,
                    fullName: this.manager.fullName,
                    email: this.manager.email,
                }
                : undefined,
            stats: this.members
                ? {
                    totalMembers: this.members.length,
                    activeMembers: this.getActiveMembersCount(),
                    membersByRole: {
                        managers: this.getMembersByRole("manager").length,
                        leads: this.getMembersByRole("lead").length,
                        seniors: this.getMembersByRole("senior").length,
                        members: this.getMembersByRole("member").length,
                    },
                }
                : undefined,
        };
    }
    validate() {
        const errors = [];
        if (!this.name || this.name.trim().length === 0) {
            errors.push("El nombre del equipo es requerido");
        }
        if (this.name && this.name.length > 100) {
            errors.push("El nombre del equipo no puede exceder 100 caracteres");
        }
        if (!this.code || this.code.trim().length === 0) {
            errors.push("El código del equipo es requerido");
        }
        if (this.code && !/^[A-Z0-9_-]+$/.test(this.code)) {
            errors.push("El código del equipo solo puede contener letras mayúsculas, números, guiones y guiones bajos");
        }
        if (this.code && this.code.length > 10) {
            errors.push("El código del equipo no puede exceder 10 caracteres");
        }
        if (this.color && !/^#[0-9A-Fa-f]{6}$/.test(this.color)) {
            errors.push("El color debe estar en formato hexadecimal válido (#RRGGBB)");
        }
        return errors;
    }
    toString() {
        return `Team[${this.code}]: ${this.name}`;
    }
};
exports.Team = Team;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Team.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, unique: true }),
    __metadata("design:type", String)
], Team.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, unique: true }),
    __metadata("design:type", String)
], Team.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Team.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 7, nullable: true }),
    __metadata("design:type", String)
], Team.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)("idx_teams_manager"),
    __metadata("design:type", String)
], Team.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Team.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Team.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Team.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "managerId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], Team.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeamMember_1.TeamMember, (teamMember) => teamMember.team, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Team.prototype, "members", void 0);
exports.Team = Team = __decorate([
    (0, typeorm_1.Entity)("teams"),
    (0, typeorm_1.Index)("idx_teams_active", ["isActive"]),
    (0, typeorm_1.Index)("idx_teams_code", ["code"]),
    (0, typeorm_1.Index)("idx_teams_name", ["name"])
], Team);
