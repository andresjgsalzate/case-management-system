import { UserProfile } from "./UserProfile";
import { TeamMember } from "./TeamMember";
export declare class Team {
    id: string;
    name: string;
    code: string;
    description?: string;
    color?: string;
    managerId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    manager?: UserProfile;
    members: TeamMember[];
    getActiveMembers(): TeamMember[];
    getActiveMembersCount(): number;
    get memberCount(): number;
    isUserActiveMember(userId: string): boolean;
    getUserRole(userId: string): "manager" | "lead" | "senior" | "member" | null;
    isUserManager(userId: string): boolean;
    getMembersByRole(role: "manager" | "lead" | "senior" | "member"): TeamMember[];
    toJSON(): {
        id: string;
        name: string;
        code: string;
        description: string | undefined;
        color: string | undefined;
        managerId: string | undefined;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        memberCount: number;
        manager: {
            id: string;
            fullName: string | undefined;
            email: string;
        } | undefined;
        stats: {
            totalMembers: number;
            activeMembers: number;
            membersByRole: {
                managers: number;
                leads: number;
                seniors: number;
                members: number;
            };
        } | undefined;
    };
    validate(): string[];
    toString(): string;
}
