import { Role } from "./Role";
import { Case } from "./Case";
import { TeamMember } from "./TeamMember";
import { Team } from "./Team";
export declare class UserProfile {
    id: string;
    email: string;
    fullName?: string;
    password?: string;
    roleId?: string;
    roleName: string;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    role?: Role;
    cases: Case[];
    teamMemberships: TeamMember[];
    managedTeams: Team[];
    getActiveTeams(): Team[];
    getActiveTeamMemberships(): TeamMember[];
    isActiveMemberOfTeam(teamId: string): boolean;
    getRoleInTeam(teamId: string): "manager" | "lead" | "senior" | "member" | null;
    isTeamManager(): boolean;
    isManagerOfTeam(teamId: string): boolean;
    getManagedTeams(): Team[];
    getTeamIds(): string[];
    canManageUserInTeams(otherUserId: string, otherUserTeams: string[]): boolean;
    getTeamStats(): {
        totalTeams: number;
        managedTeamsCount: number;
        roles: Record<string, number>;
        isManager: boolean;
    };
}
