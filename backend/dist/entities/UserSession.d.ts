import { UserProfile } from "./UserProfile";
export declare class UserSession {
    id: string;
    userId: string;
    user: UserProfile;
    tokenHash: string;
    refreshTokenHash?: string;
    deviceInfo?: {
        userAgent?: string;
        browser?: string;
        os?: string;
        device?: string;
        ip?: string;
    };
    ipAddress?: string;
    locationInfo?: {
        country?: string;
        city?: string;
        region?: string;
    };
    isActive: boolean;
    expiresAt: Date;
    lastActivityAt: Date;
    logoutReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
