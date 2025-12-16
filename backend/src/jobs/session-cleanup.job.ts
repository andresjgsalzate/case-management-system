import { SessionService } from "../services/session.service";
import { logger } from "../utils/logger";

export class SessionCleanupJob {
  private sessionService: SessionService | null = null;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    try {
      this.sessionService = new SessionService();
    } catch (error) {
      logger.warn(
        "⚠️ No se pudo inicializar SessionService en el constructor, se reintentará más tarde"
      );
      this.sessionService = null;
    }
  }

  /**
   * Inicia el job de limpieza automática
   * @param intervalMinutes - Intervalo en minutos entre limpiezas (por defecto 60 minutos)
   */
  public start(intervalMinutes: number = 60): void {
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(
      `🧹 Iniciando job de limpieza de sesiones cada ${intervalMinutes} minutos`
    );

    // Ejecutar inmediatamente la primera vez
    this.runCleanup();

    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, intervalMs);
  }

  /**
   * Detiene el job de limpieza
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info("🛑 Job de limpieza de sesiones detenido");
    }
  }

  /**
   * Ejecuta manualmente la limpieza
   */
  public async runCleanup(): Promise<number> {
    try {
      logger.info("🧹 Ejecutando limpieza de sesiones expiradas...");

      // Verificar que el SessionService esté disponible
      if (!this.sessionService) {
        try {
          logger.info("🔄 Intentando reinicializar SessionService...");
          this.sessionService = new SessionService();
          logger.info("✅ SessionService reinicializado exitosamente");
        } catch (error) {
          logger.warn("⚠️ SessionService no disponible, saltando limpieza");
          return 0;
        }
      }

      const cleanedCount = await this.sessionService.cleanupExpiredSessions();

      if (cleanedCount > 0) {
        logger.info(
          `✅ Limpieza completada: ${cleanedCount} sesiones expiradas marcadas como inactivas`
        );
      } else {
        logger.debug("✅ Limpieza completada: No hay sesiones expiradas");
      }

      return cleanedCount;
    } catch (error) {
      logger.error("❌ Error durante la limpieza de sesiones:", error);
      // Si es un error de entidad no encontrada, intentar reinicializar después
      if (error instanceof Error && error.message.includes("No metadata for")) {
        logger.warn(
          "⚠️ Entidades no cargadas completamente, reintentando en el próximo ciclo"
        );
      }
      return 0;
    }
  }

  /**
   * Obtiene estadísticas de sesiones
   */
  public async getSessionStats(): Promise<{
    totalActiveSessions: number;
    sessionsByUser: Record<string, number>;
  }> {
    try {
      // Aquí se pueden agregar más estadísticas según sea necesario
      return {
        totalActiveSessions: 0,
        sessionsByUser: {},
      };
    } catch (error) {
      logger.error("Error obteniendo estadísticas de sesiones:", error);
      return {
        totalActiveSessions: 0,
        sessionsByUser: {},
      };
    }
  }
}
