import { Team, TeamMember } from "../entities";
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto, UpdateTeamMemberDto, TeamQueryDto, TeamMemberQueryDto, TransferTeamLeadershipDto, BulkTeamMemberDto, TeamStatsResponseDto } from "../dto/team.dto";
export declare class TeamService {
    private teamRepository;
    private teamMemberRepository;
    private userRepository;
    constructor();
    createTeam(createTeamDto: CreateTeamDto): Promise<Team>;
    getTeamById(id: string): Promise<Team>;
    getAllTeams(query?: TeamQueryDto): Promise<{
        teams: Team[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateTeam(id: string, updateTeamDto: UpdateTeamDto): Promise<Team>;
    deleteTeam(id: string): Promise<{
        message: string;
        action: string;
    }>;
    toggleTeamStatus(id: string): Promise<Team>;
    addMember(teamId: string, addMemberDto: AddTeamMemberDto): Promise<TeamMember>;
    getMemberById(id: string): Promise<TeamMember>;
    getTeamMembers(teamId: string, query?: TeamMemberQueryDto): Promise<TeamMember[]>;
    updateMember(teamId: string, userId: string, updateMemberDto: UpdateTeamMemberDto): Promise<TeamMember>;
    removeMember(teamId: string, userId: string): Promise<void>;
    updateMemberRole(teamId: string, userId: string, newRole: "manager" | "lead" | "senior" | "member"): Promise<TeamMember>;
    getUserTeams(userId: string): Promise<Team[]>;
    isUserInTeam(userId: string, teamId: string): Promise<boolean>;
    isUserTeamManager(userId: string, teamId: string): Promise<boolean>;
    getUserManagedTeamIds(userId: string): Promise<string[]>;
    transferLeadership(teamId: string, transferDto: TransferTeamLeadershipDto, currentManagerId: string): Promise<Team>;
    addBulkMembers(teamId: string, bulkMemberDto: BulkTeamMemberDto): Promise<TeamMember[]>;
    getTeamStats(teamId: string): Promise<TeamStatsResponseDto>;
    private createTeamQueryBuilder;
}
