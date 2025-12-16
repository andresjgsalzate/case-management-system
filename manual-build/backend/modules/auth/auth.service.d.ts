import { UserProfile } from "../../entities/UserProfile";
import { LoginDto, RegisterDto, AuthResponse } from "./auth.dto";
import { SessionInfo } from "../../services/session.service";
export declare class AuthService {
    private userRepository;
    private sessionService;
    constructor();
    login(loginDto: LoginDto, sessionInfo?: SessionInfo): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
    }>;
    private generateToken;
    private generateRefreshToken;
    validateToken(token: string): Promise<UserProfile | null>;
    getAllUsers(): Promise<UserProfile[]>;
    updateUserRole(userId: string, roleName: string): Promise<UserProfile>;
    getUserByEmail(email: string): Promise<UserProfile | null>;
    logout(token: string): Promise<void>;
    logoutAllSessions(userId: string): Promise<void>;
    getUserActiveSessions(userId: string): Promise<import("../../entities/UserSession").UserSession[]>;
}
