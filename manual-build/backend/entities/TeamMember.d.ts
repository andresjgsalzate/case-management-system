import { Team } from "./Team";
import { UserProfile } from "./UserProfile";
export declare class TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: "manager" | "lead" | "senior" | "member";
    isActive: boolean;
    joinedAt?: Date;
    leftAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    team: Team;
    user: UserProfile;
    isCurrentlyActive(): boolean;
    getMembershipDurationInDays(): number;
    hasManagementRole(): boolean;
    getRoleLevel(): number;
    canManage(otherMember: TeamMember): boolean;
    deactivate(leftDate?: Date): void;
    reactivate(): void;
    changeRole(newRole: "manager" | "lead" | "senior" | "member"): void;
    toJSON(): {
        id: string;
        teamId: string;
        userId: string;
        role: "manager" | "lead" | "senior" | "member";
        isActive: boolean;
        joinedAt: Date | undefined;
        leftAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: string;
            fullName: string | undefined;
            email: string;
            isActive: boolean;
        } | undefined;
        team: {
            id: string;
            name: string;
            code: string;
            color: string | undefined;
        } | undefined;
        stats: {
            isCurrentlyActive: boolean;
            membershipDurationDays: number;
            hasManagementRole: boolean;
            roleLevel: number;
        };
    };
    validate(): string[];
    toString(): string;
}
