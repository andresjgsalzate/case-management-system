import { Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";

export interface SystemModule {
  name: string;
  version: string;
  description: string;
  features: string[];
  endpoints: string[];
  status: "active" | "maintenance" | "deprecated";
  permissions: string[];
}

export interface SystemInfo {
  version: string;
  name: string;
  description: string;
  buildDate: string;
  environment: string;
  modules: SystemModule[];
  stats: {
    totalModules: number;
    activeModules: number;
    totalEndpoints: number;
    uptime: number;
  };
}

export class SystemInfoController {
  /**
   * Obtener información completa del sistema
   */
  async getSystemInfo(req: Request, res: Response) {
    try {
      console.log("Obteniendo módulos del sistema...");
      const modules = this.getSystemModules();
      console.log("Módulos obtenidos:", modules.length);

      console.log("Calculando estadísticas...");
      const stats = this.getSystemStats(modules);
      console.log("Estadísticas calculadas:", stats);

      const systemInfo: SystemInfo = {
        version: "1.0.0",
        name: "Case Management System",
        description:
          "Sistema completo de gestión de casos con funcionalidades avanzadas",
        buildDate: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        modules,
        stats,
      };

      console.log("Enviando respuesta...");
      res.status(200).json({
        success: true,
        data: systemInfo,
      });
    } catch (error) {
      console.error("Error obteniendo información del sistema:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtener solo la versión del sistema
   */
  async getVersion(req: Request, res: Response) {
    try {
      console.log("Iniciando getVersion...");

      res.status(200).json({
        success: true,
        data: {
          version: "1.0.0",
          name: "case-management-backend",
          buildDate: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error obteniendo versión:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener módulos disponibles
   */
  async getModules(req: Request, res: Response) {
    try {
      const modules = this.getSystemModules();

      res.status(200).json({
        success: true,
        data: modules,
      });
    } catch (error) {
      console.error("Error obteniendo módulos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener changelog del sistema
   */
  async getChangelog(req: Request, res: Response) {
    try {
      const changelogPath = join(__dirname, "../../../CHANGELOG.md");
      let changelog = "";

      try {
        changelog = readFileSync(changelogPath, "utf-8");
      } catch (error) {
        console.warn("Changelog no encontrado en:", changelogPath);
        changelog =
          "# Changelog\n\n## Versión 1.0.0 - 2025-01-15\n\n### Añadido\n- Sistema de gestión de casos completo\n- Módulos de dashboard, TODOs y knowledge base\n- Sistema de autenticación y permisos";
      }

      res.status(200).json({
        success: true,
        data: {
          changelog,
          lastUpdate: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error obteniendo changelog:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats(req: Request, res: Response) {
    try {
      const modules = this.getSystemModules();
      const stats = this.getSystemStats(modules);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener información del package.json
   */
  private getPackageInfo() {
    try {
      const packagePath = join(__dirname, "../../../package.json");
      const packageContent = readFileSync(packagePath, "utf-8");
      return JSON.parse(packageContent);
    } catch (error) {
      console.error("Error leyendo package.json:", error);
      return {
        name: "case-management-backend",
        version: "1.0.0",
        description: "Backend API para sistema de gestión de casos",
      };
    }
  }

  /**
   * Definir módulos del sistema con sus capacidades
   */
  private getSystemModules(): SystemModule[] {
    return [
      {
        name: "Dashboard",
        version: "1.0.0",
        description: "Panel principal con métricas en tiempo real",
        features: [
          "Métricas de casos activos/cerrados",
          "Estadísticas de TODOs",
          "Gráficos interactivos",
          "KPIs del sistema",
          "Filtros temporales",
        ],
        endpoints: ["/api/dashboard/metrics", "/api/dashboard/stats"],
        status: "active",
        permissions: ["dashboard.view"],
      },
      {
        name: "Control de Casos",
        version: "1.0.0",
        description: "Timer y control de tiempo por caso",
        features: [
          "Crear, editar, eliminar casos",
          "Estados personalizables",
          "Asignación de usuarios",
          "Seguimiento de tiempo",
          "Historial de cambios",
          "Búsqueda avanzada",
          "Exportación a PDF/Excel",
        ],
        endpoints: [
          "/api/cases",
          "/api/cases/:id",
          "/api/cases/search",
          "/api/cases/export",
        ],
        status: "active",
        permissions: [
          "cases.view",
          "cases.create",
          "cases.edit",
          "cases.delete",
        ],
      },
      {
        name: "Sistema de TODOs",
        version: "1.0.0",
        description: "Gestión de tareas con prioridades y seguimiento",
        features: [
          "CRUD de tareas",
          "Prioridades (Alta, Media, Baja, Crítica)",
          "Estados (Pendiente, En Progreso, Completado)",
          "Asignación de usuarios",
          "Fechas límite",
          "Comentarios",
          "Vista Kanban",
        ],
        endpoints: [
          "/api/todos",
          "/api/todos/:id",
          "/api/todos/priorities",
          "/api/todos/stats",
        ],
        status: "active",
        permissions: [
          "todos.view",
          "todos.create",
          "todos.edit",
          "todos.delete",
        ],
      },
      {
        name: "Autenticación y Seguridad",
        version: "1.0.0",
        description: "Sistema seguro de autenticación con JWT",
        features: [
          "Login/logout seguro",
          "Tokens JWT con refresh",
          "Control de sesiones",
          "Fingerprinting",
          "Rate limiting",
          "Cifrado de tokens",
          "Monitoreo de actividad",
        ],
        endpoints: [
          "/api/auth/login",
          "/api/auth/logout",
          "/api/auth/refresh",
          "/api/auth/permissions",
        ],
        status: "active",
        permissions: ["auth.login"],
      },
      {
        name: "Gestión de Usuarios",
        version: "1.0.0",
        description: "Administración completa de usuarios y roles",
        features: [
          "CRUD de usuarios",
          "Gestión de roles",
          "Asignación de permisos",
          "Perfiles de usuario",
          "Estados de activación",
          "Cambio de contraseñas",
        ],
        endpoints: [
          "/api/users",
          "/api/users/:id",
          "/api/roles",
          "/api/permissions",
        ],
        status: "active",
        permissions: [
          "users.view",
          "users.create",
          "users.edit",
          "users.delete",
        ],
      },
      {
        name: "Sistema de Notas",
        version: "1.0.0",
        description: "Documentación y notas por caso",
        features: [
          "Editor de texto enriquecido",
          "Notas por caso",
          "Versionado de documentos",
          "Adjuntos",
          "Etiquetado",
          "Búsqueda en contenido",
        ],
        endpoints: ["/api/notes", "/api/notes/:id", "/api/notes/search"],
        status: "active",
        permissions: [
          "notes.view",
          "notes.create",
          "notes.edit",
          "notes.delete",
        ],
      },
      {
        name: "Base de Conocimiento",
        version: "1.0.0",
        description: "Sistema completo de documentación técnica",
        features: [
          "Editor BlockNote avanzado",
          "Categorización inteligente",
          "Versionado automático",
          "Búsqueda semántica",
          "Sistema de feedback",
          "Estadísticas de uso",
        ],
        endpoints: [
          "/api/knowledge",
          "/api/knowledge/:id",
          "/api/knowledge/search",
          "/api/knowledge/:id/versions",
        ],
        status: "active",
        permissions: [
          "knowledge.view",
          "knowledge.create",
          "knowledge.edit",
          "knowledge.delete",
        ],
      },
      {
        name: "Sistema de Etiquetas",
        version: "1.0.0",
        description: "Gestión y organización con etiquetas",
        features: [
          "CRUD de etiquetas",
          "Colores automáticos",
          "Categorías jerárquicas",
          "Estadísticas de uso",
          "Filtrado por tags",
        ],
        endpoints: ["/api/tags", "/api/tags/:id", "/api/tags/stats"],
        status: "active",
        permissions: ["tags.view", "tags.create", "tags.edit", "tags.delete"],
      },
      {
        name: "Gestión de Disposiciones",
        version: "1.0.0",
        description: "Control de disposiciones mensuales",
        features: [
          "Disposiciones por período",
          "Estados (Borrador, Activa, Archivada)",
          "Asignación múltiple",
          "Seguimiento de cumplimiento",
          "Reportes de disposiciones",
        ],
        endpoints: [
          "/api/dispositions",
          "/api/dispositions/:id",
          "/api/dispositions/reports",
        ],
        status: "active",
        permissions: [
          "dispositions.view",
          "dispositions.create",
          "dispositions.edit",
        ],
      },
      {
        name: "Sistema de Archivo",
        version: "1.0.0",
        description: "Archivado temporal y eliminación controlada",
        features: [
          "Archivo temporal reversible",
          "Eliminación permanente (admin)",
          "Razones de archivo",
          "Auditoría completa",
          "Proceso de restauración",
        ],
        endpoints: [
          "/api/archive",
          "/api/archive/restore",
          "/api/archive/permanent-delete",
        ],
        status: "active",
        permissions: [
          "archive.view",
          "archive.create",
          "archive.restore",
          "archive.delete",
        ],
      },
      {
        name: "Control de Tiempo",
        version: "1.0.0",
        description: "Registro y seguimiento de tiempo",
        features: [
          "Registro manual de tiempo",
          "Timer automático integrado",
          "Reportes de tiempo",
          "Base para facturación",
          "Exportación de registros",
        ],
        endpoints: [
          "/api/time-tracking",
          "/api/time-tracking/reports",
          "/api/time-tracking/export",
        ],
        status: "active",
        permissions: ["time.view", "time.create", "time.edit"],
      },
      {
        name: "Administración del Sistema",
        version: "1.0.0",
        description: "Configuración y administración global",
        features: [
          "Gestión de aplicaciones",
          "Estados de caso personalizables",
          "Configuración de orígenes",
          "Niveles de prioridad",
          "Tipos de documento",
          "Parámetros globales",
        ],
        endpoints: [
          "/api/applications",
          "/api/case-statuses",
          "/api/origins",
          "/api/priorities",
          "/api/document-types",
        ],
        status: "active",
        permissions: ["admin.view", "admin.configure"],
      },
      {
        name: "Sistema de Auditoría",
        version: "1.0.0",
        description: "Sistema completo de auditoría y trazabilidad",
        features: [
          "Auditoría automática de todas las operaciones CRUD",
          "Seguimiento de acceso a archivos y documentos",
          "Registro de descargas y visualizaciones",
          "Auditoría de reportes y métricas",
          "Control de cambios detallado",
          "Trazabilidad de sesiones de usuario",
          "Historial completo de modificaciones",
          "Detección de actividad sospechosa",
          "Cumplimiento normativo y forense",
          "Exportación de logs de auditoría",
        ],
        endpoints: [
          "/api/audit/logs",
          "/api/audit/stats",
          "/api/audit/export",
          "/api/audit/entity/:id/history",
          "/api/audit/user/:id/activity",
        ],
        status: "active",
        permissions: [
          "audit.view",
          "audit.export",
          "audit.stats",
          "audit.history",
        ],
      },
    ];
  }

  /**
   * Calcular estadísticas del sistema
   */
  private getSystemStats(modules: SystemModule[]) {
    const activeModules = modules.filter((m) => m.status === "active").length;
    const totalEndpoints = modules.reduce(
      (acc, module) => acc + module.endpoints.length,
      0
    );

    return {
      totalModules: modules.length,
      activeModules,
      totalEndpoints,
      uptime: process.uptime(),
    };
  }
}
