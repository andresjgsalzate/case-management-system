"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCleanupJob = void 0;
const session_service_1 = require("../services/session.service");
const logger_1 = require("../utils/logger");
class SessionCleanupJob {
    constructor() {
        this.sessionService = null;
        try {
            this.sessionService = new session_service_1.SessionService();
        }
        catch (error) {
            logger_1.logger.warn("⚠️ No se pudo inicializar SessionService en el constructor, se reintentará más tarde");
            this.sessionService = null;
        }
    }
    start(intervalMinutes = 60) {
        const intervalMs = intervalMinutes * 60 * 1000;
        logger_1.logger.info(`🧹 Iniciando job de limpieza de sesiones cada ${intervalMinutes} minutos`);
        this.runCleanup();
        this.intervalId = setInterval(() => {
            this.runCleanup();
        }, intervalMs);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            logger_1.logger.info("🛑 Job de limpieza de sesiones detenido");
        }
    }
    async runCleanup() {
        try {
            logger_1.logger.info("🧹 Ejecutando limpieza de sesiones expiradas...");
            if (!this.sessionService) {
                try {
                    logger_1.logger.info("🔄 Intentando reinicializar SessionService...");
                    this.sessionService = new session_service_1.SessionService();
                    logger_1.logger.info("✅ SessionService reinicializado exitosamente");
                }
                catch (error) {
                    logger_1.logger.warn("⚠️ SessionService no disponible, saltando limpieza");
                    return 0;
                }
            }
            const cleanedCount = await this.sessionService.cleanupExpiredSessions();
            if (cleanedCount > 0) {
                logger_1.logger.info(`✅ Limpieza completada: ${cleanedCount} sesiones expiradas marcadas como inactivas`);
            }
            else {
                logger_1.logger.debug("✅ Limpieza completada: No hay sesiones expiradas");
            }
            return cleanedCount;
        }
        catch (error) {
            logger_1.logger.error("❌ Error durante la limpieza de sesiones:", error);
            if (error instanceof Error && error.message.includes("No metadata for")) {
                logger_1.logger.warn("⚠️ Entidades no cargadas completamente, reintentando en el próximo ciclo");
            }
            return 0;
        }
    }
    async getSessionStats() {
        try {
            return {
                totalActiveSessions: 0,
                sessionsByUser: {},
            };
        }
        catch (error) {
            logger_1.logger.error("Error obteniendo estadísticas de sesiones:", error);
            return {
                totalActiveSessions: 0,
                sessionsByUser: {},
            };
        }
    }
}
exports.SessionCleanupJob = SessionCleanupJob;
