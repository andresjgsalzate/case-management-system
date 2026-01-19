import { UserSession } from "../entities/UserSession";
export interface SessionInfo {
    userAgent?: string;
    ip?: string;
    deviceInfo?: {
        browser?: string;
        os?: string;
        device?: string;
    };
}
export declare class SessionService {
    private sessionRepository;
    private userRepository;
    private auditService;
    constructor();
    createUniqueSession(userId: string, token: string, refreshToken: string, sessionInfo: SessionInfo): Promise<UserSession>;
    validateActiveSession(token: string): Promise<UserSession | null>;
    invalidateSession(sessionId: string, reason?: "manual" | "forced" | "expired" | "new_login"): Promise<void>;
    invalidateAllUserSessions(userId: string, reason?: "manual" | "forced" | "security"): Promise<void>;
    getUserActiveSessions(userId: string): Promise<UserSession[]>;
    cleanupExpiredSessions(): Promise<number>;
    updateSessionToken(refreshToken: string, newToken: string): Promise<UserSession | null>;
    private hashToken;
    private parseDeviceInfo;
    private logSessionActivity;
}
