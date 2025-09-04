import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Permission } from "../entities/Permission";
import { RolePermission } from "../entities/RolePermission";
import { Role } from "../entities/Role";

export class PermissionService {
  private permissionRepository: Repository<Permission>;
  private rolePermissionRepository: Repository<RolePermission>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.permissionRepository = AppDataSource.getRepository(Permission);
    this.rolePermissionRepository = AppDataSource.getRepository(RolePermission);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  /**
   * Obtener todos los permisos activos
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { isActive: true },
      order: { module: "ASC", action: "ASC", scope: "ASC" },
    });
  }

  /**
   * Obtener permisos por módulo
   */
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { module, isActive: true },
      order: { action: "ASC", scope: "ASC" },
    });
  }

  /**
   * Obtener permisos de un rol específico
   */
  async getPermissionsByRole(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ["permission"],
      order: { permission: { module: "ASC", action: "ASC", scope: "ASC" } },
    });

    return rolePermissions
      .map((rp) => rp.permission)
      .filter((permission) => permission.isActive);
  }

  /**
   * Verificar si un rol tiene un permiso específico
   */
  async hasPermission(
    roleId: string,
    permissionName: string
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: { name: permissionName, isActive: true },
    });

    if (!permission) {
      return false;
    }

    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId: permission.id },
    });

    return !!rolePermission;
  }

  /**
   * Verificar múltiples permisos para un rol
   */
  async hasPermissions(
    roleId: string,
    permissionNames: string[]
  ): Promise<{ [key: string]: boolean }> {
    const result: { [key: string]: boolean } = {};

    for (const permissionName of permissionNames) {
      result[permissionName] = await this.hasPermission(roleId, permissionName);
    }

    return result;
  }

  /**
   * Verificar permisos con scope dinámico
   * @param roleId ID del rol
   * @param module Módulo (ej: 'disposiciones')
   * @param action Acción (ej: 'ver')
   * @param userScope Scope del usuario ('own', 'team', 'all')
   */
  async hasPermissionWithScope(
    roleId: string,
    module: string,
    action: string,
    userScope: "own" | "team" | "all" = "own"
  ): Promise<boolean> {
    // Construir el nombre del permiso según el scope
    const permissionName = `${module}.${action}.${userScope}`;
    return await this.hasPermission(roleId, permissionName);
  }

  /**
   * Obtener el scope más alto que tiene un usuario para una acción específica
   */
  async getHighestScope(
    roleId: string,
    module: string,
    action: string
  ): Promise<"own" | "team" | "all" | null> {
    const scopes: ("all" | "team" | "own")[] = ["all", "team", "own"];

    for (const scope of scopes) {
      const hasPermission = await this.hasPermissionWithScope(
        roleId,
        module,
        action,
        scope
      );
      if (hasPermission) {
        return scope;
      }
    }

    return null;
  }

  /**
   * Asignar permisos a un rol
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    // Verificar que el rol existe
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error("Rol no encontrado");
    }

    // Eliminar permisos existentes del rol
    await this.rolePermissionRepository.delete({ roleId });

    // Asignar nuevos permisos
    const rolePermissions = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await this.rolePermissionRepository.insert(rolePermissions);
  }

  /**
   * Crear un nuevo permiso
   */
  async createPermission(permissionData: {
    name: string;
    description?: string;
    module: string;
    action: string;
    scope: "own" | "team" | "all";
  }): Promise<Permission> {
    // Verificar que no existe un permiso con el mismo nombre
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: permissionData.name },
    });

    if (existingPermission) {
      throw new Error("Ya existe un permiso con ese nombre");
    }

    const permission = this.permissionRepository.create(permissionData);
    return await this.permissionRepository.save(permission);
  }

  /**
   * Obtener estructura de módulos y acciones disponibles
   */
  async getModulesStructure(): Promise<{
    [module: string]: {
      actions: string[];
      scopes: string[];
      totalPermissions: number;
    };
  }> {
    const permissions = await this.getAllPermissions();
    const structure: {
      [module: string]: {
        actions: string[];
        scopes: string[];
        totalPermissions: number;
      };
    } = {};

    permissions.forEach((permission) => {
      if (!structure[permission.module]) {
        structure[permission.module] = {
          actions: [],
          scopes: [],
          totalPermissions: 0,
        };
      }

      const moduleStructure = structure[permission.module]!;
      if (!moduleStructure.actions.includes(permission.action)) {
        moduleStructure.actions.push(permission.action);
      }

      if (!moduleStructure.scopes.includes(permission.scope)) {
        moduleStructure.scopes.push(permission.scope);
      }

      moduleStructure.totalPermissions++;
    });

    // Ordenar arrays
    Object.keys(structure).forEach((module) => {
      const moduleStructure = structure[module];
      if (moduleStructure) {
        moduleStructure.actions.sort();
        moduleStructure.scopes.sort();
      }
    });

    return structure;
  }

  /**
   * Buscar permisos con filtros
   */
  async searchPermissions(filters: {
    module?: string;
    action?: string;
    scope?: string;
    search?: string;
  }): Promise<Permission[]> {
    const queryBuilder = this.permissionRepository
      .createQueryBuilder("permission")
      .where("permission.isActive = :isActive", { isActive: true });

    if (filters.module) {
      queryBuilder.andWhere("permission.module = :module", {
        module: filters.module,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere("permission.action = :action", {
        action: filters.action,
      });
    }

    if (filters.scope) {
      queryBuilder.andWhere("permission.scope = :scope", {
        scope: filters.scope,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        "(permission.name ILIKE :search OR permission.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    return await queryBuilder
      .orderBy("permission.module", "ASC")
      .addOrderBy("permission.action", "ASC")
      .addOrderBy("permission.scope", "ASC")
      .getMany();
  }
}
