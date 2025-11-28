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
    console.log("=== getUserWithPermissions START ===");
    console.log("req.user exists:", !!req.user);

    // Convertir el usuario existente al formato con permisos
    if (req.user) {
      // Casting para acceder a las propiedades correctas del UserProfile
      const user = req.user as any;
      console.log("User data:", {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.roleName,
      });

      // Obtener equipos del usuario si no están ya cargados
      let userTeamIds: string[] = [];
      try {
        console.log("Loading user teams...");
        const teamService = this.getTeamService();
        const userTeams = await teamService.getUserTeams(user.id);
        userTeamIds = userTeams.map((team) => team.id);
        console.log("User teams loaded:", userTeamIds);
      } catch (error) {
        console.warn("No se pudieron cargar los equipos del usuario:", error);
      }

      const userWithPermissions = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId || "", // Usar roleId correcto del UserProfile
        roleName: user.roleName,
        teamId: userTeamIds[0], // Primer equipo para compatibilidad
        teamIds: userTeamIds, // IDs de equipos del usuario
        ...req.userWithPermissions,
      };

      console.log("Returning userWithPermissions:", userWithPermissions);
      console.log("=== getUserWithPermissions END ===");
      return userWithPermissions;
    }

    console.log("No user found in req.user");
    console.log("=== getUserWithPermissions END ===");
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
        console.error("Error en verificación de permisos:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos con scope dinámico
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

        // Obtener el scope más alto que tiene el usuario
        const highestScope = await this.permissionService.getHighestScope(
          user.roleId,
          module,
          action
        );

        if (!highestScope) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredPermission: `${module}.${action}.*`,
          });
        }

        // Agregar el scope al request para uso posterior
        user.permissionScope = highestScope;
        req.userWithPermissions = user;
        next();
      } catch (error) {
        console.error("Error en verificación de permisos con scope:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para verificar múltiples permisos (AND)
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

        const permissionResults = await this.permissionService.hasPermissions(
          user.roleId,
          permissionNames
        );

        const missingPermissions = permissionNames.filter(
          (permission) => !permissionResults[permission]
        );

        if (missingPermissions.length > 0) {
          return res.status(403).json({
            error: "Permisos insuficientes",
            missingPermissions,
          });
        }

        next();
      } catch (error) {
        console.error("Error en verificación de múltiples permisos:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos opcionales (OR)
   */
  requireAnyPermission(permissionNames: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("=== DEBUGGING requireAnyPermission ===");
        console.log("Permissions to check:", permissionNames);

        const user = await this.getUserWithPermissions(req);
        console.log(
          "User found:",
          user ? `ID: ${user.id}, RoleId: ${user.roleId}` : "NULL"
        );

        if (!user) {
          console.log("User not found, returning 401");
          return res.status(401).json({
            error: "No autenticado",
          });
        }

        console.log(
          "Calling hasPermissions with roleId:",
          user.roleId,
          "permissions:",
          permissionNames
        );
        const permissionResults = await this.permissionService.hasPermissions(
          user.roleId,
          permissionNames
        );
        console.log("Permission results:", permissionResults);

        const hasAnyPermission = permissionNames.some(
          (permission) => permissionResults[permission]
        );
        console.log("Has any permission:", hasAnyPermission);

        if (!hasAnyPermission) {
          console.log("No permissions found, returning 403");
          return res.status(403).json({
            error: "Permisos insuficientes",
            requiredAnyOf: permissionNames,
          });
        }

        console.log("Permission check passed, calling next()");
        next();
      } catch (error) {
        console.error("=== ERROR in requireAnyPermission ===");
        console.error("Error en verificación de permisos opcionales:", error);
        console.error(
          "Stack trace:",
          error instanceof Error ? error.stack : error
        );
        console.error("=== END ERROR ===");
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }

  /**
   * Middleware para filtrar datos según scope
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
          });
        }

        // Agregar filtros al request según el scope
        user.permissionScope = highestScope;
        user.scopeFilters = {};

        switch (highestScope) {
          case "own":
            // Solo puede ver/modificar sus propios registros
            if (options.userIdField) {
              user.scopeFilters[options.userIdField] = user.id;
            }

            // Verificar propiedad del recurso si se proporciona
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
            // Puede ver/modificar registros de su equipo
            if (options.teamIdField && user.teamId) {
              user.scopeFilters[options.teamIdField] = user.teamId;
            }

            // Verificar equipo del recurso si se proporciona
            if (options.getEntityTeamId) {
              const entityTeamId = await options.getEntityTeamId(req);
              if (entityTeamId && entityTeamId !== user.teamId) {
                return res.status(403).json({
                  error: "Solo puede acceder a recursos de su equipo",
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
        console.error(
          "Error en verificación personalizada de permisos:",
          error
        );
        return res.status(500).json({
          error: "Error interno del servidor",
        });
      }
    };
  }
}

// Instancia singleton para uso en toda la aplicación
export const authMiddleware = new AuthorizationMiddleware();

// Funciones helper para facilitar el uso
export const requirePermission = (permissionName: string) =>
  authMiddleware.requirePermission(permissionName);

export const requirePermissionWithScope = (module: string, action: string) =>
  authMiddleware.requirePermissionWithScope(module, action);

export const requireAllPermissions = (permissionNames: string[]) =>
  authMiddleware.requireAllPermissions(permissionNames);

export const requireAnyPermission = (permissionNames: string[]) =>
  authMiddleware.requireAnyPermission(permissionNames);

export const filterByScope = (module: string, action: string, options?: any) =>
  authMiddleware.filterByScope(module, action, options);

export const requireAdmin = () => authMiddleware.requireAdmin();
