import { Request, Response } from "express";
import { PermissionService } from "../services/PermissionService";

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  /**
   * Obtener todos los permisos
   */
  async getAllPermissions(req: Request, res: Response) {
    try {
      const permissions = await this.permissionService.getAllPermissions();

      res.json({
        success: true,
        data: permissions,
        message: "Permisos obtenidos correctamente",
      });
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener permisos por módulo
   */
  async getPermissionsByModule(req: Request, res: Response) {
    try {
      const { module } = req.params;

      if (!module) {
        return res.status(400).json({
          success: false,
          error: "El módulo es requerido",
        });
      }

      const permissions = await this.permissionService.getPermissionsByModule(
        module
      );

      res.json({
        success: true,
        data: permissions,
        message: `Permisos del módulo ${module} obtenidos correctamente`,
      });
    } catch (error) {
      console.error("Error al obtener permisos por módulo:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estructura de módulos
   */
  async getModulesStructure(req: Request, res: Response) {
    try {
      const structure = await this.permissionService.getModulesStructure();

      res.json({
        success: true,
        data: structure,
        message: "Estructura de módulos obtenida correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estructura de módulos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Buscar permisos con filtros
   */
  async searchPermissions(req: Request, res: Response) {
    try {
      const { module, action, scope, search } = req.query;

      const filters = {
        module: module as string,
        action: action as string,
        scope: scope as string,
        search: search as string,
      };

      const permissions = await this.permissionService.searchPermissions(
        filters
      );

      res.json({
        success: true,
        data: permissions,
        message: "Búsqueda de permisos completada",
        filters: filters,
      });
    } catch (error) {
      console.error("Error al buscar permisos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear un nuevo permiso (solo para administradores)
   */
  async createPermission(req: Request, res: Response) {
    try {
      const { name, description, module, action, scope } = req.body;

      // Validaciones básicas
      if (!name || !module || !action || !scope) {
        return res.status(400).json({
          success: false,
          error: "Campos requeridos: name, module, action, scope",
        });
      }

      if (!["own", "team", "all"].includes(scope)) {
        return res.status(400).json({
          success: false,
          error: "El scope debe ser: own, team o all",
        });
      }

      const permission = await this.permissionService.createPermission({
        name,
        description,
        module,
        action,
        scope,
      });

      res.status(201).json({
        success: true,
        data: permission,
        message: "Permiso creado correctamente",
      });
    } catch (error) {
      console.error("Error al crear permiso:", error);

      if (
        error instanceof Error &&
        error.message === "Ya existe un permiso con ese nombre"
      ) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Verificar permisos del usuario actual
   */
  async checkUserPermissions(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "No autenticado",
        });
      }

      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: "Se debe proporcionar un array de permisos a verificar",
        });
      }

      // Verificar cada permiso individualmente
      const permissionResults: Record<string, boolean> = {};

      for (const permission of permissions) {
        try {
          // Usar el servicio de permisos para verificar si el usuario tiene este permiso
          const hasPermission = await this.permissionService.hasPermission(
            user.id,
            permission
          );
          permissionResults[permission] = hasPermission;
        } catch (error) {
          // Si hay error verificando un permiso específico, marcarlo como false
          permissionResults[permission] = false;
        }
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          roleName: user.roleName,
          permissions: permissionResults,
        },
        message: "Verificación de permisos completada",
      });
    } catch (error) {
      console.error("Error al verificar permisos del usuario:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener el scope más alto para una acción específica
   */
  async getHighestScope(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "No autenticado",
        });
      }

      const { module, action } = req.params;

      if (!module || !action) {
        return res.status(400).json({
          success: false,
          error: "Módulo y acción son requeridos",
        });
      }

      const roleId = user.role || ""; // Usar role como roleId con fallback
      if (!roleId) {
        return res.status(400).json({
          success: false,
          error: "Usuario sin rol asignado",
        });
      }

      const highestScope = await this.permissionService.getHighestScope(
        roleId,
        module,
        action
      );

      res.json({
        success: true,
        data: {
          module,
          action,
          highestScope,
          hasPermission: !!highestScope,
        },
        message: "Scope obtenido correctamente",
      });
    } catch (error) {
      console.error("Error al obtener scope:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
}
