import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/PermissionService";
import { UserWithPermissions, ScopeFilterOptions } from "../types/permissions";
import { TeamService } from "../services/TeamService";
import AppDataSource from "../data-source";

export class AuthorizationMiddleware {
  private permissionService: PermissionService;
  private teamService: TeamService | null = null;

  constructor() {
    this.permissionService = new PermissionService();
  }

  /**
   * Obtiene una instancia del TeamService (lazy loading)
   */
  private getTeamService(): TeamService {
    if (!this.teamService) {
      this.teamService = new TeamService();
    }
    return this.teamService;
  }

  /**
   * Helper para obtener el usuario con permisos desde el request
   */
  private async getUserWithPermissions(
    req: Request
  ): Promise<UserWithPermissions | null> {
    // Convertir el usuario existente al formato con permisos
    if (req.user) {
      // Casting para acceder a las propiedades correctas del UserProfile
      const user = req.user as any;

      // Obtener equipos del usuario si no están ya cargados
      let userTeamIds: string[] = [];
      try {
        if (AppDataSource.isInitialized) {
          const teamService = this.getTeamService();
          const userTeams = await teamService.getUserTeams(user.id);
          userTeamIds = userTeams.map((team) => team.id);
        }
      } catch (error) {
        console.warn("No se pudieron cargar los equipos del usuario:", error);
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId || "", // Usar roleId correcto del UserProfile
        roleName: user.roleName,
        teamId: userTeamIds[0], // Primer equipo para compatibilidad
        teamIds: userTeamIds, // IDs de equipos del usuario
        ...req.userWithPermissions,
      };
    }
    return null;
  }

  /**
   * Middleware para verificar permisos específicos
   */
  requirePermission(permissionName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const hasPermission = await this.permissionService.hasPermission(
          user.roleId,
          permissionName
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredPermission: permissionName,
          });
        }

        next();
      } catch (error) {
        console.error("Error verificando permisos:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos con scope automático
   */
  requirePermissionWithScope(module: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const scope = await this.permissionService.getHighestScope(
          user.roleId,
          module,
          action
        );

        if (!scope) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredModule: module,
            requiredAction: action,
          });
        }

        user.permissionScope = scope;
        req.userWithPermissions = user;
        next();
      } catch (error) {
        console.error("Error verificando permisos con scope:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para requerir cualquiera de varios permisos
   */
  requireAnyPermission(permissionNames: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        // Verificar si tiene alguno de los permisos
        let hasAnyPermission = false;
        let highestScope: "own" | "team" | "all" | null = null;

        for (const permissionName of permissionNames) {
          const hasPermission = await this.permissionService.hasPermission(
            user.roleId,
            permissionName
          );

          if (hasPermission) {
            hasAnyPermission = true;

            // Extraer scope del nombre del permiso (formato: module.action.scope)
            const parts = permissionName.split(".");
            const scope = parts[parts.length - 1] as "own" | "team" | "all";

            // Determinar el scope más alto
            if (
              !highestScope ||
              this.getScopePriority(scope) > this.getScopePriority(highestScope)
            ) {
              highestScope = scope;
            }
          }
        }

        if (!hasAnyPermission) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredAnyOf: permissionNames,
          });
        }

        user.permissionScope = highestScope || undefined;
        req.userWithPermissions = user;
        next();
      } catch (error) {
        console.error("Error verificando permisos múltiples:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para requerir todos los permisos especificados
   */
  requireAllPermissions(permissionNames: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const missingPermissions: string[] = [];

        for (const permissionName of permissionNames) {
          const hasPermission = await this.permissionService.hasPermission(
            user.roleId,
            permissionName
          );

          if (!hasPermission) {
            missingPermissions.push(permissionName);
          }
        }

        if (missingPermissions.length > 0) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            missingPermissions,
          });
        }

        next();
      } catch (error) {
        console.error("Error verificando todos los permisos:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para filtrar por scope y aplicar restricciones
   */
  filterByScope(
    module: string,
    action: string,
    options: ScopeFilterOptions = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const highestScope = await this.permissionService.getHighestScope(
          user.roleId,
          module,
          action
        );

        if (!highestScope) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredModule: module,
            requiredAction: action,
          });
        }

        user.permissionScope = highestScope;
        user.scopeFilters = {};

        // Aplicar filtros según el scope
        switch (highestScope) {
          case "own":
            // Solo puede ver/modificar sus propios registros
            if (options.userIdField) {
              user.scopeFilters[options.userIdField] = user.id;
            }

            // Verificar propietario del recurso si se proporciona
            if (options.getEntityId) {
              const entityId = options.getEntityId(req);
              if (entityId && entityId !== user.id) {
                return res.status(403).json({
                  error: "Solo puede acceder a sus propios recursos",
                });
              }
            }
            break;

          case "team":
            // Puede ver/modificar registros de sus equipos
            if (
              options.teamIdField &&
              user.teamIds &&
              user.teamIds.length > 0
            ) {
              user.scopeFilters[options.teamIdField] = user.teamIds;
            }

            // Verificar equipo del recurso si se proporciona
            if (options.getEntityTeamId && user.teamIds) {
              const entityTeamId = await options.getEntityTeamId(req);
              if (entityTeamId && !user.teamIds.includes(entityTeamId)) {
                return res.status(403).json({
                  error: "Solo puede acceder a recursos de sus equipos",
                });
              }
            }
            break;

          case "all":
            // Sin restricciones adicionales
            break;
        }

        req.userWithPermissions = user;
        next();
      } catch (error) {
        console.error("Error en filtrado por scope:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos de administrador
   */
  requireAdmin() {
    return this.requirePermission("roles.manage.all");
  }

  /**
   * Middleware personalizado para verificación específica de equipos
   */
  requireTeamPermission(
    permission: string,
    checkTeamManagership: boolean = false
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const { teamId } = req.params;

        // Verificar permiso básico
        const hasPermission = await this.permissionService.hasPermission(
          user.roleId,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredPermission: permission,
          });
        }

        // Si se requiere managership del equipo y el permiso es .own
        if (checkTeamManagership && permission.includes(".own") && teamId) {
          try {
            const teamService = this.getTeamService();
            const isManager = await teamService.isUserTeamManager(
              user.id,
              teamId
            );

            if (!isManager) {
              return res.status(403).json({
                error: "Solo el manager del equipo puede realizar esta acción",
              });
            }
          } catch (error) {
            console.warn("Error verificando managership del equipo:", error);
          }
        }

        next();
      } catch (error) {
        console.error("Error en verificación de permisos de equipo:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Utility function para crear middleware personalizado
   */
  createCustomPermissionCheck(
    checkFunction: (
      user: UserWithPermissions,
      permissionService: PermissionService
    ) => Promise<boolean>,
    errorMessage: string = "Permisos insuficientes"
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await this.getUserWithPermissions(req);
        if (!user) {
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        const hasPermission = await checkFunction(user, this.permissionService);

        if (!hasPermission) {
          return res.status(403).json({
            error: errorMessage,
          });
        }

        next();
      } catch (error) {
        console.error("Error en verificación personalizada:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Helper para obtener prioridad de scope (mayor número = mayor alcance)
   */
  private getScopePriority(scope: "own" | "team" | "all"): number {
    switch (scope) {
      case "own":
        return 1;
      case "team":
        return 2;
      case "all":
        return 3;
      default:
        return 0;
    }
  }
}

// Instancia singleton del middleware
export const authMiddleware = new AuthorizationMiddleware();

// Funciones helper para uso directo
export const requirePermission = (permissionName: string) =>
  authMiddleware.requirePermission(permissionName);

export const requirePermissionWithScope = (module: string, action: string) =>
  authMiddleware.requirePermissionWithScope(module, action);

export const requireAllPermissions = (permissionNames: string[]) =>
  authMiddleware.requireAllPermissions(permissionNames);

export const requireAnyPermission = (permissionNames: string[]) =>
  authMiddleware.requireAnyPermission(permissionNames);

export const filterByScope = (
  module: string,
  action: string,
  options?: ScopeFilterOptions
) => authMiddleware.filterByScope(module, action, options);

export const requireAdmin = () => authMiddleware.requireAdmin();

export const requireTeamPermission = (
  permission: string,
  checkManagership: boolean = false
) => authMiddleware.requireTeamPermission(permission, checkManagership);

export default authMiddleware;
