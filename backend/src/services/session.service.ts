import { Repository, LessThan } from "typeorm";
import { createHash } from "crypto";
import { UAParser } from "ua-parser-js";
import { AppDataSource } from "../config/database";
import { UserSession } from "../entities/UserSession";
import { UserProfile } from "../entities/UserProfile";
import { AuditService } from "./AuditService";

export interface SessionInfo {
  userAgent?: string;
  ip?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export class SessionService {
  private sessionRepository: Repository<UserSession>;
  private userRepository: Repository<UserProfile>;
  private auditService: AuditService;

  constructor() {
    try {
      this.sessionRepository = AppDataSource.getRepository(UserSession);
      this.userRepository = AppDataSource.getRepository(UserProfile);
      this.auditService = new AuditService();
    } catch (error) {
      console.error("❌ Error initializing SessionService:", error);
      throw new Error(
        "Failed to initialize SessionService - database may not be ready"
      );
    }
  }

  /**
   * Crea una nueva sesión única para el usuario
   * Invalida todas las sesiones anteriores
   */
  async createUniqueSession(
    userId: string,
    token: string,
    refreshToken: string,
    sessionInfo: SessionInfo
  ): Promise<UserSession> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Invalidar todas las sesiones activas del usuario
      const existingSessions = await this.sessionRepository.find({
        where: { userId, isActive: true },
      });

      if (existingSessions.length > 0) {
        await this.sessionRepository.update(
          { userId, isActive: true },
          {
            isActive: false,
            logoutReason: "new_login",
            updatedAt: new Date(),
          }
        );

        // Registrar en auditoría para cada sesión cerrada
        for (const session of existingSessions) {
          await this.logSessionActivity(
            userId,
            "FORCE_LOGOUT",
            "UserSession",
            session.id, // Usar el ID real de la sesión
            {
              reason: "new_login",
              device: session.deviceInfo,
              message: "Sesión cerrada automáticamente por nuevo login",
            },
            sessionInfo
          );
        }
      }

      // 2. Crear hash de los tokens para almacenamiento seguro
      const tokenHash = this.hashToken(token);
      const refreshTokenHash = refreshToken
        ? this.hashToken(refreshToken)
        : undefined;

      // 3. Parsear información del dispositivo
      const deviceInfo = this.parseDeviceInfo(sessionInfo.userAgent || "");

      // 4. Calcular tiempo de expiración (24 horas por defecto)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // 5. Crear nueva sesión
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

      // 6. Registrar nuevo login en auditoría
      await this.logSessionActivity(
        userId,
        "LOGIN",
        "UserSession",
        savedSession.id,
        {
          sessionId: savedSession.id,
          deviceInfo,
          message: "Usuario inició sesión exitosamente",
        },
        sessionInfo
      );

      await queryRunner.commitTransaction();
      return savedSession;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Valida si el token tiene una sesión activa
   */
  async validateActiveSession(token: string): Promise<UserSession | null> {
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

    // Verificar si la sesión ha expirado
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(session.id, "expired");
      return null;
    }

    // Actualizar última actividad
    session.lastActivityAt = new Date();
    await this.sessionRepository.save(session);

    return session;
  }

  /**
   * Invalida una sesión específica
   */
  async invalidateSession(
    sessionId: string,
    reason: "manual" | "forced" | "expired" | "new_login" = "manual"
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session && session.isActive) {
      await this.sessionRepository.update(sessionId, {
        isActive: false,
        logoutReason: reason,
        updatedAt: new Date(),
      });

      // Registrar logout en auditoría
      await this.logSessionActivity(
        session.userId,
        "LOGOUT",
        "UserSession",
        sessionId,
        {
          sessionId,
          reason,
          message: `Sesión cerrada: ${reason}`,
        }
      );
    }
  }

  /**
   * Invalida todas las sesiones de un usuario (útil para logout global)
   */
  async invalidateAllUserSessions(
    userId: string,
    reason: "manual" | "forced" | "security" = "manual"
  ): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
    });

    if (activeSessions.length > 0) {
      await this.sessionRepository.update(
        { userId, isActive: true },
        {
          isActive: false,
          logoutReason: reason,
          updatedAt: new Date(),
        }
      );

      // Registrar en auditoría para cada sesión cerrada
      for (const session of activeSessions) {
        await this.logSessionActivity(
          userId,
          "LOGOUT_ALL",
          "UserSession",
          session.id, // Usar el ID real de la sesión
          {
            reason,
            device: session.deviceInfo,
            message: `Sesión cerrada por logout global: ${reason}`,
          }
        );
      }
    }
  }

  /**
   * Obtiene sesiones activas de un usuario
   */
  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivityAt: "DESC" },
    });
  }

  /**
   * Limpia sesiones expiradas (para ejecutar periódicamente)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.sessionRepository.find({
        where: {
          isActive: true,
          expiresAt: LessThan(new Date()),
        },
      });

      if (expiredSessions.length > 0) {
        await this.sessionRepository.update(
          {
            isActive: true,
            expiresAt: LessThan(new Date()),
          },
          {
            isActive: false,
            logoutReason: "expired",
            updatedAt: new Date(),
          }
        );
      }

      return expiredSessions.length;
    } catch (error) {
      console.error("Error in cleanupExpiredSessions:", error);
      throw error;
    }
  }

  /**
   * Genera hash de token para almacenamiento seguro
   */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Parsea información del User-Agent
   */
  private parseDeviceInfo(userAgent: string) {
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      return {
        userAgent,
        browser: `${result.browser.name} ${result.browser.version}`,
        os: `${result.os.name} ${result.os.version}`,
        device: result.device.type || "desktop",
      };
    } catch (error) {
      return {
        userAgent,
        browser: "Unknown",
        os: "Unknown",
        device: "Unknown",
      };
    }
  }

  /**
   * Método auxiliar para registrar actividades de sesión en auditoría
   */
  private async logSessionActivity(
    userId: string,
    action: "LOGIN" | "LOGOUT" | "LOGOUT_ALL" | "FORCE_LOGOUT",
    entityType: string,
    entityId: string,
    details: any,
    sessionInfo?: SessionInfo
  ): Promise<void> {
    try {
      // Obtener el email del usuario
      const userProfileRepo = AppDataSource.getRepository(UserProfile);
      const userProfile = await userProfileRepo.findOne({
        where: { id: userId },
        select: ["email", "fullName"],
      });

      if (!userProfile) {
        console.warn(
          "⚠️ No se pudo encontrar el perfil de usuario para auditoría:",
          userId
        );
        return;
      }

      await this.auditService.createAuditLog({
        userId,
        userEmail: userProfile.email,
        userName: userProfile.fullName,
        action: action as any,
        entityType,
        entityId,
        module: "SessionManagement",
        operationContext: details,
        ipAddress: sessionInfo?.ip,
        userAgent: sessionInfo?.userAgent,
      });

      // Session activity logged
    } catch (error) {
      console.error("❌ Error registrando actividad de sesión:", error);
      console.error("❌ Stack trace:", (error as Error)?.stack);
      // No lanzar error para no afectar la funcionalidad principal
    }
  }
}
