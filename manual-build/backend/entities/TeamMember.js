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
exports.TeamMember = void 0;
const typeorm_1 = require("typeorm");
const Team_1 = require("./Team");
const UserProfile_1 = require("./UserProfile");
let TeamMember = class TeamMember {
    isCurrentlyActive() {
        return this.isActive && (!this.leftAt || this.leftAt > new Date());
    }
    getMembershipDurationInDays() {
        if (!this.joinedAt)
            return 0;
        const endDate = this.leftAt || new Date();
        const startDate = this.joinedAt;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    hasManagementRole() {
        return this.role === "manager" || this.role === "lead";
    }
    getRoleLevel() {
        const roleLevels = {
            member: 1,
            senior: 2,
            lead: 3,
            manager: 4,
        };
        return roleLevels[this.role] || 0;
    }
    canManage(otherMember) {
        if (this.teamId !== otherMember.teamId)
            return false;
        if (this.role === "manager")
            return true;
        if (this.role === "lead" &&
            ["senior", "member"].includes(otherMember.role)) {
            return true;
        }
        return false;
    }
    deactivate(leftDate) {
        this.isActive = false;
        this.leftAt = leftDate || new Date();
        this.updatedAt = new Date();
    }
    reactivate() {
        this.isActive = true;
        this.leftAt = undefined;
        this.joinedAt = this.joinedAt || new Date();
        this.updatedAt = new Date();
    }
    changeRole(newRole) {
        this.role = newRole;
        this.updatedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            teamId: this.teamId,
            userId: this.userId,
            role: this.role,
            isActive: this.isActive,
            joinedAt: this.joinedAt,
            leftAt: this.leftAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            user: this.user
                ? {
                    id: this.user.id,
                    fullName: this.user.fullName,
                    email: this.user.email,
                    isActive: this.user.isActive,
                }
                : undefined,
            team: this.team
                ? {
                    id: this.team.id,
                    name: this.team.name,
                    code: this.team.code,
                    color: this.team.color,
                }
                : undefined,
            stats: {
                isCurrentlyActive: this.isCurrentlyActive(),
                membershipDurationDays: this.getMembershipDurationInDays(),
                hasManagementRole: this.hasManagementRole(),
                roleLevel: this.getRoleLevel(),
            },
        };
    }
    validate() {
        const errors = [];
        if (!this.teamId) {
            errors.push("El ID del equipo es requerido");
        }
        if (!this.userId) {
            errors.push("El ID del usuario es requerido");
        }
        if (!this.role ||
            !["manager", "lead", "senior", "member"].includes(this.role)) {
            errors.push("El rol debe ser uno de: manager, lead, senior, member");
        }
        if (this.leftAt && this.joinedAt && this.leftAt < this.joinedAt) {
            errors.push("La fecha de salida no puede ser anterior a la fecha de ingreso");
        }
        if (!this.isActive && !this.leftAt) {
            errors.push("Las membresías inactivas deben tener fecha de salida");
        }
        if (this.isActive && this.leftAt) {
            errors.push("Las membresías activas no pueden tener fecha de salida");
        }
        return errors;
    }
    toString() {
        const teamName = this.team?.name || `Team[${this.teamId}]`;
        const userName = this.user?.fullName || `User[${this.userId}]`;
        const status = this.isActive ? "Active" : "Inactive";
        return `TeamMember[${status}]: ${userName} as ${this.role} in ${teamName}`;
    }
};
exports.TeamMember = TeamMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TeamMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], TeamMember.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], TeamMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 20,
        default: "member",
    }),
    __metadata("design:type", String)
], TeamMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], TeamMember.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true, default: () => "NOW()" }),
    __metadata("design:type", Date)
], TeamMember.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], TeamMember.prototype, "leftAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], TeamMember.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], TeamMember.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Team_1.Team, (team) => team.members, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "teamId" }),
    __metadata("design:type", Team_1.Team)
], TeamMember.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserProfile_1.UserProfile, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", UserProfile_1.UserProfile)
], TeamMember.prototype, "user", void 0);
exports.TeamMember = TeamMember = __decorate([
    (0, typeorm_1.Entity)("team_members"),
    (0, typeorm_1.Index)("idx_team_members_team", ["teamId"]),
    (0, typeorm_1.Index)("idx_team_members_user", ["userId"]),
    (0, typeorm_1.Index)("idx_team_members_active", ["isActive"]),
    (0, typeorm_1.Index)("idx_team_members_role", ["role"]),
    (0, typeorm_1.Index)("idx_team_members_joined_at", ["joinedAt"]),
    (0, typeorm_1.Index)("idx_team_members_left_at", ["leftAt"])
], TeamMember);
