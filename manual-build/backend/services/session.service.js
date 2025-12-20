"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
const ua_parser_js_1 = require("ua-parser-js");
const database_1 = require("../config/database");
const UserSession_1 = require("../entities/UserSession");
const UserProfile_1 = require("../entities/UserProfile");
const AuditService_1 = require("./AuditService");
class SessionService {
    constructor() {
        try {
            this.sessionRepository = database_1.AppDataSource.getRepository(UserSession_1.UserSession);
            this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
            this.auditService = new AuditService_1.AuditService();
        }
        catch (error) {
            console.error("❌ Error initializing SessionService:", error);
            throw new Error("Failed to initialize SessionService - database may not be ready");
        }
    }
    async createUniqueSession(userId, token, refreshToken, sessionInfo) {
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const existingSessions = await this.sessionRepository.find({
                where: { userId, isActive: true },
            });
            if (existingSessions.length > 0) {
                await this.sessionRepository.update({ userId, isActive: true }, {
                    isActive: false,
                    logoutReason: "new_login",
                    updatedAt: new Date(),
                });
                for (const session of existingSessions) {
                    await this.logSessionActivity(userId, "FORCE_LOGOUT", "UserSession", session.id, {
                        reason: "new_login",
                        device: session.deviceInfo,
                        message: "Sesión cerrada automáticamente por nuevo login",
                    }, sessionInfo);
                }
            }
            const tokenHash = this.hashToken(token);
            const refreshTokenHash = refreshToken
                ? this.hashToken(refreshToken)
                : undefined;
            const deviceInfo = this.parseDeviceInfo(sessionInfo.userAgent || "");
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const newSession = this.sessionRepository.create({
                userId,
                tokenHash,
                refreshTokenHash,
                deviceInfo,
                ipAddress: sessionInfo.ip,
                isActive: true,
                expiresAt,
                lastActivityAt: new Date(),
            });
            const savedSession = await this.sessionRepository.save(newSession);
            await this.logSessionActivity(userId, "LOGIN", "UserSession", savedSession.id, {
                sessionId: savedSession.id,
                deviceInfo,
                message: "Usuario inició sesión exitosamente",
            }, sessionInfo);
            await queryRunner.commitTransaction();
            return savedSession;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async validateActiveSession(token) {
        const tokenHash = this.hashToken(token);
        const session = await this.sessionRepository.findOne({
            where: {
                tokenHash,
                isActive: true,
            },
            relations: ["user"],
        });
        if (!session) {
            return null;
        }
        if (session.expiresAt < new Date()) {
            await this.invalidateSession(session.id, "expired");
            return null;
        }
        session.lastActivityAt = new Date();
        await this.sessionRepository.save(session);
        return session;
    }
    async invalidateSession(sessionId, reason = "manual") {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (session && session.isActive) {
            await this.sessionRepository.update(sessionId, {
                isActive: false,
                logoutReason: reason,
                updatedAt: new Date(),
            });
            await this.logSessionActivity(session.userId, "LOGOUT", "UserSession", sessionId, {
                sessionId,
                reason,
                message: `Sesión cerrada: ${reason}`,
            });
        }
    }
    async invalidateAllUserSessions(userId, reason = "manual") {
        const activeSessions = await this.sessionRepository.find({
            where: { userId, isActive: true },
        });
        if (activeSessions.length > 0) {
            await this.sessionRepository.update({ userId, isActive: true }, {
                isActive: false,
                logoutReason: reason,
                updatedAt: new Date(),
            });
            for (const session of activeSessions) {
                await this.logSessionActivity(userId, "LOGOUT_ALL", "UserSession", session.id, {
                    reason,
                    device: session.deviceInfo,
                    message: `Sesión cerrada por logout global: ${reason}`,
                });
            }
        }
    }
    async getUserActiveSessions(userId) {
        return this.sessionRepository.find({
            where: { userId, isActive: true },
            order: { lastActivityAt: "DESC" },
        });
    }
    async cleanupExpiredSessions() {
        try {
            const expiredSessions = await this.sessionRepository.find({
                where: {
                    isActive: true,
                    expiresAt: (0, typeorm_1.LessThan)(new Date()),
                },
            });
            if (expiredSessions.length > 0) {
                await this.sessionRepository.update({
                    isActive: true,
                    expiresAt: (0, typeorm_1.LessThan)(new Date()),
                }, {
                    isActive: false,
                    logoutReason: "expired",
                    updatedAt: new Date(),
                });
            }
            return expiredSessions.length;
        }
        catch (error) {
            console.error("Error in cleanupExpiredSessions:", error);
            throw error;
        }
    }
    hashToken(token) {
        return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
    }
    parseDeviceInfo(userAgent) {
        try {
            const parser = new ua_parser_js_1.UAParser(userAgent);
            const result = parser.getResult();
            return {
                userAgent,
                browser: `${result.browser.name} ${result.browser.version}`,
                os: `${result.os.name} ${result.os.version}`,
                device: result.device.type || "desktop",
            };
        }
        catch (error) {
            return {
                userAgent,
                browser: "Unknown",
                os: "Unknown",
                device: "Unknown",
            };
        }
    }
    async logSessionActivity(userId, action, entityType, entityId, details, sessionInfo) {
        try {
            const userProfileRepo = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
            const userProfile = await userProfileRepo.findOne({
                where: { id: userId },
                select: ["email", "fullName"],
            });
            if (!userProfile) {
                console.warn("⚠️ No se pudo encontrar el perfil de usuario para auditoría:", userId);
                return;
            }
            await this.auditService.createAuditLog({
                userId,
                userEmail: userProfile.email,
                userName: userProfile.fullName,
                action: action,
                entityType,
                entityId,
                module: "SessionManagement",
                operationContext: details,
                ipAddress: sessionInfo?.ip,
                userAgent: sessionInfo?.userAgent,
            });
        }
        catch (error) {
            console.error("❌ Error registrando actividad de sesión:", error);
            console.error("❌ Stack trace:", error?.stack);
        }
    }
}
exports.SessionService = SessionService;
