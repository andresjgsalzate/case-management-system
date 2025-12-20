export declare class CreateTeamDto {
    name: string;
    code: string;
    description?: string;
    color?: string;
    managerId?: string;
    isActive?: boolean;
}
export declare class UpdateTeamDto {
    name?: string;
    code?: string;
    description?: string;
    color?: string;
    managerId?: string;
    isActive?: boolean;
}
export declare class AddTeamMemberDto {
    userId: string;
    role: "manager" | "lead" | "senior" | "member";
    isActive?: boolean;
}
export declare class UpdateTeamMemberDto {
    role?: "manager" | "lead" | "senior" | "member";
    isActive?: boolean;
}
export declare class TeamQueryDto {
    search?: string;
    isActive?: boolean;
    managerId?: string;
    code?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    page?: string;
    limit?: string;
}
export declare class TeamMemberQueryDto {
    teamId?: string;
    userId?: string;
    role?: "manager" | "lead" | "senior" | "member";
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export declare class TransferTeamLeadershipDto {
    newManagerId: string;
    reason?: string;
}
export declare class BulkTeamMemberDto {
    userIds: string[];
    role: "manager" | "lead" | "senior" | "member";
    reason?: string;
}
export declare class TeamStatsQueryDto {
    teamId?: string;
    period?: "week" | "month" | "quarter" | "year";
    includeInactive?: boolean;
}
export interface TeamResponseDto {
    id: string;
    name: string;
    code: string;
    description?: string;
    color?: string;
    managerId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    memberCount?: number;
    manager?: {
        id: string;
        fullName?: string;
        email: string;
    };
    stats?: {
        totalMembers: number;
        activeMembers: number;
        membersByRole: {
            managers: number;
            leads: number;
            seniors: number;
            members: number;
        };
    };
}
export interface TeamMemberResponseDto {
    id: string;
    teamId: string;
    userId: string;
    role: "manager" | "lead" | "senior" | "member";
    isActive: boolean;
    joinedAt?: Date;
    leftAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        fullName?: string;
        email: string;
        isActive: boolean;
    };
    team?: {
        id: string;
        name: string;
        code: string;
        color?: string;
    };
    stats?: {
        isCurrentlyActive: boolean;
        membershipDurationDays: number;
        hasManagementRole: boolean;
        roleLevel: number;
    };
}
export interface TeamStatsResponseDto {
    teamId: string;
    teamName: string;
    teamCode: string;
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    membersByRole: {
        managers: number;
        leads: number;
        seniors: number;
        members: number;
    };
    averageMembershipDuration: number;
    recentJoins: number;
    recentLeaves: number;
    isActive: boolean;
}
