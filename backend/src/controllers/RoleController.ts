import { Request, Response } from "express";
import {
  RoleService,
  CreateRoleDto,
  UpdateRoleDto,
} from "../services/RoleService";

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  /**
   * Obtener todos los roles con paginación
   */
  async getAllRoles(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Si hay parámetros de búsqueda, usar el método de búsqueda
      if (search || isActive !== undefined) {
        const filters = {
          search: search as string,
          isActive: isActive === "true",
        };
        const roles = await this.roleService.searchRoles(filters);

        res.json({
          success: true,
          data: {
            roles: roles.slice(offset, offset + limitNum),
            total: roles.length,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(roles.length / limitNum),
          },
          message: "Roles obtenidos correctamente",
        });
      } else {
        // Obtener roles con conteos de usuarios y permisos
        const allRoles = await this.roleService.getRolesWithCounts();

        // Aplicar ordenamiento
        allRoles.sort((a, b) => {
          if (sortBy === "name") {
            return sortOrder === "ASC"
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          } else if (sortBy === "createdAt") {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === "ASC" ? dateA - dateB : dateB - dateA;
          }
          return 0;
        });

        const paginatedRoles = allRoles.slice(offset, offset + limitNum);

        res.json({
          success: true,
          data: {
            roles: paginatedRoles,
            total: allRoles.length,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(allRoles.length / limitNum),
          },
          message: "Roles obtenidos correctamente",
        });
      }
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener rol por ID con permisos
   */
  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol es requerido",
        });
      }

      const roleData = await this.roleService.getRoleWithPermissions(id);

      if (!roleData) {
        return res.status(404).json({
          success: false,
          error: "Rol no encontrado",
        });
      }

      res.json({
        success: true,
        data: roleData,
        message: "Rol obtenido correctamente",
      });
    } catch (error) {
      console.error("Error al obtener rol:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear un nuevo rol
   */
  async createRole(req: Request, res: Response) {
    try {
      const roleData: CreateRoleDto = req.body;

      // Validaciones básicas
      if (!roleData.name) {
        return res.status(400).json({
          success: false,
          error: "El nombre del rol es requerido",
        });
      }

      const role = await this.roleService.createRole(roleData);

      res.status(201).json({
        success: true,
        data: role,
        message: "Rol creado correctamente",
      });
    } catch (error) {
      console.error("Error al crear rol:", error);

      if (error instanceof Error) {
        if (error.message === "Ya existe un rol con ese nombre") {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Algunos permisos no existen") {
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Actualizar un rol existente
   */
  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const roleData: UpdateRoleDto = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol es requerido",
        });
      }

      const updatedRole = await this.roleService.updateRole(id, roleData);

      res.json({
        success: true,
        data: updatedRole,
        message: "Rol actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar rol:", error);

      if (error instanceof Error) {
        if (error.message === "Rol no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Ya existe un rol con ese nombre") {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Algunos permisos no existen") {
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Eliminar un rol (soft delete)
   */
  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol es requerido",
        });
      }

      // Verificar si se puede eliminar
      const canDelete = await this.roleService.canDeleteRole(id);
      if (!canDelete.canDelete) {
        return res.status(400).json({
          success: false,
          error: canDelete.reason,
        });
      }

      await this.roleService.deleteRole(id);

      res.json({
        success: true,
        message: "Rol eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar rol:", error);

      if (error instanceof Error) {
        if (error.message === "Rol no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message.includes("No se puede eliminar")) {
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Asignar permisos a un rol
   */
  async assignPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol es requerido",
        });
      }

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          error: "Se debe proporcionar un array de IDs de permisos",
        });
      }

      await this.roleService.assignPermissionsToRole(id, permissionIds);

      res.json({
        success: true,
        message: "Permisos asignados correctamente",
      });
    } catch (error) {
      console.error("Error al asignar permisos:", error);

      if (error instanceof Error) {
        if (error.message === "Rol no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Algunos permisos no existen") {
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Clonar un rol existente
   */
  async cloneRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol origen es requerido",
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nombre del nuevo rol es requerido",
        });
      }

      const clonedRole = await this.roleService.cloneRole(
        id,
        name,
        description
      );

      res.status(201).json({
        success: true,
        data: clonedRole,
        message: "Rol clonado correctamente",
      });
    } catch (error) {
      console.error("Error al clonar rol:", error);

      if (error instanceof Error) {
        if (error.message === "Rol origen no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Ya existe un rol con ese nombre") {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de roles
   */
  async getRoleStats(req: Request, res: Response) {
    try {
      const stats = await this.roleService.getRoleStats();

      res.json({
        success: true,
        data: stats,
        message: "Estadísticas de roles obtenidas correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de roles:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Buscar roles con filtros
   */
  async searchRoles(req: Request, res: Response) {
    try {
      const { search, isActive, hasPermission } = req.query;

      const filters = {
        search: search as string,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        hasPermission: hasPermission as string,
      };

      const roles = await this.roleService.searchRoles(filters);

      res.json({
        success: true,
        data: roles,
        message: "Búsqueda de roles completada",
        filters: filters,
      });
    } catch (error) {
      console.error("Error al buscar roles:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Verificar si un rol puede ser eliminado
   */
  async checkCanDeleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del rol es requerido",
        });
      }

      const result = await this.roleService.canDeleteRole(id);

      res.json({
        success: true,
        data: result,
        message: "Verificación completada",
      });
    } catch (error) {
      console.error("Error al verificar eliminación de rol:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
}
