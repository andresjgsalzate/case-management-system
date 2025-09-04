import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/PermissionService";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
    allowedScope?: string;
  };
}

export class UserPermissionMiddleware {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  // Verificar si el usuario puede ver usuarios
  canViewUsers = (scope: "own" | "team" | "all") => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const permission = `users:view:${scope}`;
        const hasPermission = await this.permissionService.hasPermission(
          req.user.roleId,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver usuarios",
          });
        }

        // Si es scope 'own', verificar que solo acceda a su propio perfil
        if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Solo puedes ver tu propio perfil",
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error al verificar permisos",
        });
      }
    };
  };

  // Verificar si el usuario puede crear usuarios
  canCreateUsers = (scope: "own" | "team" | "all") => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const permission = `users:create:${scope}`;
        const hasPermission = await this.permissionService.hasPermission(
          req.user.roleId,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para crear usuarios",
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error al verificar permisos",
        });
      }
    };
  };

  // Verificar si el usuario puede editar usuarios
  canEditUsers = (scope: "own" | "team" | "all") => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const permission = `users:edit:${scope}`;
        const hasPermission = await this.permissionService.hasPermission(
          req.user.roleId,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para editar usuarios",
          });
        }

        // Si es scope 'own', verificar que solo edite su propio perfil
        if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Solo puedes editar tu propio perfil",
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error al verificar permisos",
        });
      }
    };
  };

  // Verificar si el usuario puede eliminar usuarios
  canDeleteUsers = (scope: "own" | "team" | "all") => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const permission = `users:delete:${scope}`;
        const hasPermission = await this.permissionService.hasPermission(
          req.user.roleId,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar usuarios",
          });
        }

        // Si es scope 'own', verificar que solo elimine su propio perfil
        if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Solo puedes eliminar tu propio perfil",
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error al verificar permisos",
        });
      }
    };
  };

  // Verificar permisos especiales de gestión
  canManagePasswords = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const hasPermission = await this.permissionService.hasPermission(
        req.user.roleId,
        "users:manage:passwords"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para gestionar contraseñas",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
      });
    }
  };

  canManageRoles = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const hasPermission = await this.permissionService.hasPermission(
        req.user.roleId,
        "users:manage:roles"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para gestionar roles",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
      });
    }
  };

  canManageStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const hasPermission = await this.permissionService.hasPermission(
        req.user.roleId,
        "users:manage:status"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para gestionar estado de usuarios",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
      });
    }
  };

  // Middleware combinado que verifica múltiples scopes
  canAccessUsers = (scopes: ("own" | "team" | "all")[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        // Verificar si tiene alguno de los permisos especificados
        for (const scope of scopes) {
          const permission = `users:view:${scope}`;
          const hasPermission = await this.permissionService.hasPermission(
            req.user.roleId,
            permission
          );

          if (hasPermission) {
            // Guardar el scope permitido en la request para uso posterior
            req.user = { ...req.user, allowedScope: scope };
            return next();
          }
        }

        return res.status(403).json({
          success: false,
          message: "No tienes permisos para acceder a usuarios",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error al verificar permisos",
        });
      }
    };
  };
}
