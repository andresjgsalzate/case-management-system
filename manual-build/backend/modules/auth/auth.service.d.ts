import { UserProfile } from "../../entities/UserProfile";
import { LoginDto, RegisterDto, AuthResponse } from "./auth.dto";
export declare class AuthService {
    private userRepository;
    constructor();
    login(loginDto: LoginDto): Promise<AuthResponse>;
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
}
