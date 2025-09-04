import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { UserProfile } from "../entities/UserProfile";
import { Permission } from "../entities/Permission";
import { RolePermission } from "../entities/RolePermission";

export class AuthController {
  private userRepository = AppDataSource.getRepository(UserProfile);
  private permissionRepository = AppDataSource.getRepository(Permission);
  private rolePermissionRepository =
    AppDataSource.getRepository(RolePermission);

  // Obtener permisos del usuario autenticado
  getUserPermissions = async (req: Request, res: Response) => {
    try {
      // El middleware authenticateToken ya verificó el token y agregó req.user
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Buscar usuario con su rol
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["role"],
      });

      if (!user || !user.role) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado o sin rol asignado",
        });
      }

      // Obtener permisos activos del rol del usuario
      const rolePermissions = await this.rolePermissionRepository
        .createQueryBuilder("rp")
        .innerJoinAndSelect("rp.permission", "permission")
        .where("rp.roleId = :roleId", { roleId: user.role.id })
        .andWhere("permission.isActive = :isActive", { isActive: true })
        .getMany();

      // Extraer permisos únicos (solo los activos)
      const permissions = rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        scope: rp.permission.scope,
        description: rp.permission.description,
        isActive: rp.permission.isActive,
      }));

      // Extraer módulos únicos de permisos activos
      const modules = [...new Set(permissions.map((p) => p.module))];

      res.json({
        success: true,
        data: {
          permissions,
          modules,
          role: {
            id: user.role.id,
            name: user.role.name,
          },
        },
      });
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Verificar un permiso específico
  checkPermission = async (req: Request, res: Response) => {
    try {
      const { permission } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          hasPermission: false,
          message: "Usuario no autenticado",
        });
      }

      // Buscar usuario con su rol
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["role"],
      });

      if (!user || !user.role) {
        return res.status(404).json({
          success: false,
          hasPermission: false,
          message: "Usuario no encontrado o sin rol asignado",
        });
      }

      // Verificar si el rol tiene el permiso específico
      const rolePermission = await this.rolePermissionRepository
        .createQueryBuilder("rp")
        .innerJoin("rp.permission", "p")
        .where("rp.roleId = :roleId", { roleId: user.role.id })
        .andWhere("p.name = :permission", { permission })
        .andWhere("p.isActive = :isActive", { isActive: true })
        .getOne();

      const hasPermission = !!rolePermission;

      res.json({
        success: true,
        hasPermission,
        permission,
        role: user.role.name,
      });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({
        success: false,
        hasPermission: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Verificar acceso a módulo
  checkModuleAccess = async (req: Request, res: Response) => {
    try {
      const { module } = req.params;
      const userId = (req as any).user?.id;

      if (!module) {
        return res.status(400).json({
          success: false,
          hasAccess: false,
          message: "Módulo no especificado",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          hasAccess: false,
          message: "Usuario no autenticado",
        });
      }

      // Buscar usuario con su rol
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["role"],
      });

      if (!user || !user.role) {
        return res.status(404).json({
          success: false,
          hasAccess: false,
          message: "Usuario no encontrado o sin rol asignado",
        });
      }

      // Verificar si el rol tiene permisos para el módulo
      const modulePermissions = await this.rolePermissionRepository
        .createQueryBuilder("rp")
        .innerJoin("rp.permission", "p")
        .where("rp.roleId = :roleId", { roleId: user.role.id })
        .andWhere("p.module = :module", { module: module.toLowerCase() })
        .andWhere("p.isActive = :isActive", { isActive: true })
        .getMany();

      const hasAccess = modulePermissions.length > 0;

      res.json({
        success: true,
        hasAccess,
        module,
        role: user.role.name,
        permissionsCount: modulePermissions.length,
      });
    } catch (error) {
      console.error("Error checking module access:", error);
      res.status(500).json({
        success: false,
        hasAccess: false,
        message: "Error interno del servidor",
      });
    }
  };
}
