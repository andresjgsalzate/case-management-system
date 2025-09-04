import { Request, Response } from "express";
import { PermissionService } from "../services/PermissionService";
import { RoleService } from "../services/RoleService";

export class TestController {
  private permissionService: PermissionService;
  private roleService: RoleService;

  constructor() {
    this.permissionService = new PermissionService();
    this.roleService = new RoleService();
  }

  // Endpoint de prueba para listar permisos sin autenticación
  async getPermissionsTest(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      res.json({
        success: true,
        data: permissions,
        total: permissions.length,
      });
    } catch (error) {
      console.error("Error getting permissions:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Endpoint de prueba para listar roles sin autenticación
  async getRolesTest(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.roleService.getAllRoles();
      res.json({
        success: true,
        data: roles,
        total: roles.length,
      });
    } catch (error) {
      console.error("Error getting roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Endpoint para probar permisos por módulo
  async getPermissionsByModule(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.params;
      if (!module) {
        res.status(400).json({ error: "Módulo requerido" });
        return;
      }

      const permissions = await this.permissionService.getPermissionsByModule(
        module
      );
      res.json({
        success: true,
        module,
        data: permissions,
        total: permissions.length,
      });
    } catch (error) {
      console.error("Error getting permissions by module:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Endpoint para probar permisos de un rol específico
  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      if (!roleId) {
        res.status(400).json({ error: "ID de rol requerido" });
        return;
      }

      const roleData = await this.roleService.getRoleWithPermissions(roleId);
      if (!roleData) {
        res.status(404).json({ error: "Rol no encontrado" });
        return;
      }

      res.json({
        success: true,
        role: {
          id: roleData.role.id,
          name: roleData.role.name,
          description: roleData.role.description,
        },
        permissions: roleData.permissions.map((permission) => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          module: permission.module,
          action: permission.action,
          scope: permission.scope,
        })),
        permissionsByModule: roleData.permissionsByModule,
        totalPermissions: roleData.permissions.length,
      });
    } catch (error) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Endpoint para verificar el sistema completo
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      const roles = await this.roleService.getAllRoles();

      // Obtener estadísticas por módulo
      const moduleStats = permissions.reduce((acc: any, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = {
            total: 0,
            actions: new Set(),
            scopes: new Set(),
          };
        }
        acc[permission.module].total++;
        acc[permission.module].actions.add(permission.action);
        acc[permission.module].scopes.add(permission.scope);
        return acc;
      }, {});

      // Convertir Sets a arrays
      Object.keys(moduleStats).forEach((module) => {
        moduleStats[module].actions = Array.from(moduleStats[module].actions);
        moduleStats[module].scopes = Array.from(moduleStats[module].scopes);
      });

      res.json({
        success: true,
        system: {
          totalPermissions: permissions.length,
          totalRoles: roles.length,
          totalModules: Object.keys(moduleStats).length,
          moduleStats,
          roles: roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
          })),
        },
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
