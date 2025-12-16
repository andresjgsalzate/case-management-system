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
exports.UserProfile = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("./Role");
const Case_1 = require("./Case");
const TeamMember_1 = require("./TeamMember");
const Team_1 = require("./Team");
let UserProfile = class UserProfile {
    getActiveTeams() {
        return (this.teamMemberships
            ?.filter((membership) => membership.isActive)
            ?.map((membership) => membership.team)
            ?.filter((team) => team && team.isActive) || []);
    }
    getActiveTeamMemberships() {
        return (this.teamMemberships?.filter((membership) => membership.isActive) || []);
    }
    isActiveMemberOfTeam(teamId) {
        return this.getActiveTeamMemberships().some((membership) => membership.teamId === teamId);
    }
    getRoleInTeam(teamId) {
        const membership = this.getActiveTeamMemberships().find((membership) => membership.teamId === teamId);
        return membership?.role || null;
    }
    isTeamManager() {
        return (this.getActiveTeamMemberships().some((membership) => membership.role === "manager") || (this.managedTeams?.length || 0) > 0);
    }
    isManagerOfTeam(teamId) {
        return (this.getActiveTeamMemberships().some((membership) => membership.teamId === teamId && membership.role === "manager") ||
            this.managedTeams?.some((team) => team.id === teamId) ||
            false);
    }
    getManagedTeams() {
        const membershipTeams = this.getActiveTeamMemberships()
            .filter((membership) => membership.role === "manager" || membership.role === "lead")
            .map((membership) => membership.team)
            .filter((team) => team);
        const officialManagedTeams = this.managedTeams?.filter((team) => team.isActive) || [];
        const allManagedTeams = [...membershipTeams, ...officialManagedTeams];
        return allManagedTeams.filter((team, index, self) => index === self.findIndex((t) => t.id === team.id));
    }
    getTeamIds() {
        return this.getActiveTeams().map((team) => team.id);
    }
    canManageUserInTeams(otherUserId, otherUserTeams) {
        const managedTeamIds = this.getManagedTeams().map((team) => team.id);
        return managedTeamIds.some((teamId) => otherUserTeams.includes(teamId));
    }
    getTeamStats() {
        const activeTeams = this.getActiveTeams();
        const managedTeams = this.getManagedTeams();
        const memberships = this.getActiveTeamMemberships();
        return {
            totalTeams: activeTeams.length,
            managedTeamsCount: managedTeams.length,
            roles: memberships.reduce((acc, membership) => {
                acc[membership.role] = (acc[membership.role] || 0) + 1;
                return acc;
            }, {}),
            isManager: this.isTeamManager(),
        };
    }
};
exports.UserProfile = UserProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], UserProfile.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", default: "user" }),
    __metadata("design:type", String)
], UserProfile.prototype, "roleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], UserProfile.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], UserProfile.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz", name: "created_at" }),
    __metadata("design:type", Date)
], UserProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz", name: "updated_at" }),
    __metadata("design:type", Date)
], UserProfile.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Role_1.Role, (role) => role.userProfiles),
    (0, typeorm_1.JoinColumn)({ name: "roleId" }),
    __metadata("design:type", Role_1.Role)
], UserProfile.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Case_1.Case, (caseEntity) => caseEntity.user),
    __metadata("design:type", Array)
], UserProfile.prototype, "cases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeamMember_1.TeamMember, (teamMember) => teamMember.user),
    __metadata("design:type", Array)
], UserProfile.prototype, "teamMemberships", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Team_1.Team, (team) => team.manager),
    __metadata("design:type", Array)
], UserProfile.prototype, "managedTeams", void 0);
exports.UserProfile = UserProfile = __decorate([
    (0, typeorm_1.Entity)("user_profiles")
], UserProfile);
