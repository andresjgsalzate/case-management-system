import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Role } from "../entities/Role";
import { RolePermission } from "../entities/RolePermission";
import { Permission } from "../entities/Permission";
import { UserProfile } from "../entities/UserProfile";

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export class RoleService {
  private roleRepository: Repository<Role>;
  private rolePermissionRepository: Repository<RolePermission>;
  private permissionRepository: Repository<Permission>;
  private userProfileRepository: Repository<UserProfile>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
    this.rolePermissionRepository = AppDataSource.getRepository(RolePermission);
    this.permissionRepository = AppDataSource.getRepository(Permission);
    this.userProfileRepository = AppDataSource.getRepository(UserProfile);
  }

  /**
   * Obtener todos los roles activos con conteos
   */
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }

  /**
   * Obtener roles con conteos de usuarios y permisos
   */
  async getRolesWithCounts(): Promise<any[]> {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r."isActive",
        r."createdAt",
        r."updatedAt",
        COALESCE(user_count.count, 0) as "userCount",
        COALESCE(permission_count.count, 0) as "permissionCount"
      FROM roles r
      LEFT JOIN (
        SELECT 
          up."roleId",
          COUNT(*) as count
        FROM user_profiles up
        WHERE up."roleId" IS NOT NULL
        GROUP BY up."roleId"
      ) user_count ON r.id = user_count."roleId"
      LEFT JOIN (
        SELECT 
          rp."roleId",
          COUNT(*) as count
        FROM role_permissions rp
        GROUP BY rp."roleId"
      ) permission_count ON r.id = permission_count."roleId"
      ORDER BY r."createdAt" DESC
    `;

    const result = await this.roleRepository.query(query);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userCount: parseInt(row.userCount) || 0,
      permissionCount: parseInt(row.permissionCount) || 0,
    }));
  }

  /**
   * Obtener rol por ID con sus permisos
   */
  async getRoleById(id: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { id },
      relations: ["rolePermissions", "rolePermissions.permission"],
    });
  }

  /**
   * Obtener rol por ID con detalles completos de permisos
   */
  async getRoleWithPermissions(id: string): Promise<{
    role: Role;
    permissions: Permission[];
    permissionsByModule: { [module: string]: Permission[] };
  } | null> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      return null;
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: id },
      relations: ["permission"],
      order: { permission: { module: "ASC", action: "ASC", scope: "ASC" } },
    });

    const permissions = rolePermissions
      .map((rp) => rp.permission)
      .filter((permission) => permission.isActive);

    // Agrupar permisos por módulo
    const permissionsByModule: { [module: string]: Permission[] } = {};
    permissions.forEach((permission) => {
      if (!permissionsByModule[permission.module]) {
        permissionsByModule[permission.module] = [];
      }
      permissionsByModule[permission.module]!.push(permission);
    });

    return {
      role,
      permissions,
      permissionsByModule,
    };
  }

  /**
   * Crear un nuevo rol
   */
  async createRole(roleData: CreateRoleDto): Promise<Role> {
    // Verificar que no existe un rol con el mismo nombre
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleData.name },
    });

    if (existingRole) {
      throw new Error("Ya existe un rol con ese nombre");
    }

    // Crear el rol
    const role = this.roleRepository.create({
      name: roleData.name,
      description: roleData.description,
    });

    const savedRole = await this.roleRepository.save(role);

    // Asignar permisos si se proporcionaron
    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      await this.assignPermissionsToRole(savedRole.id, roleData.permissionIds);
    }

    return savedRole;
  }

  /**
   * Actualizar un rol existente
   */
  async updateRole(id: string, roleData: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new Error("Rol no encontrado");
    }

    // Verificar nombre único si se está cambiando
    if (roleData.name && roleData.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (existingRole) {
        throw new Error("Ya existe un rol con ese nombre");
      }
    }

    // Actualizar campos del rol
    if (roleData.name !== undefined) role.name = roleData.name;
    if (roleData.description !== undefined)
      role.description = roleData.description;
    if (roleData.isActive !== undefined) role.isActive = roleData.isActive;

    const updatedRole = await this.roleRepository.save(role);

    // Actualizar permisos si se proporcionaron
    if (roleData.permissionIds) {
      await this.assignPermissionsToRole(id, roleData.permissionIds);
    }

    return updatedRole;
  }

  /**
   * Eliminar un rol (eliminación real si no tiene usuarios, soft delete si tiene usuarios)
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new Error("Rol no encontrado");
    }

    // No permitir eliminar roles del sistema (identificados por ID específico)
    // TODO: Agregar campo isSystemRole a la entidad Role para mejor gestión
    if (id === "00000000-0000-0000-0000-000000000001") {
      throw new Error("No se puede eliminar el rol del sistema");
    }

    // Verificar la información del rol para decidir el tipo de eliminación
    const deleteInfo = await this.canDeleteRole(id);

    if (!deleteInfo.canDelete) {
      throw new Error(deleteInfo.reason || "No se puede eliminar el rol");
    }

    if (deleteInfo.hasUsers) {
      // Soft delete - marcar como inactivo si tiene usuarios asociados
      await this.roleRepository.update(id, { isActive: false });

      // Mantener los permisos para posible restauración futura
      // No eliminar las asignaciones de permisos en soft delete
    } else {
      // Eliminación real si no tiene usuarios asociados

      // Primero eliminar todas las asignaciones de permisos
      await this.rolePermissionRepository.delete({ roleId: id });

      // Luego eliminar el rol completamente
      await this.roleRepository.delete(id);
    }
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

    // Verificar que todos los permisos existen
    const permissions = await this.permissionRepository.findByIds(
      permissionIds
    );
    if (permissions.length !== permissionIds.length) {
      throw new Error("Algunos permisos no existen");
    }

    // Eliminar permisos existentes del rol
    await this.rolePermissionRepository.delete({ roleId });

    // Asignar nuevos permisos
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));

      await this.rolePermissionRepository.insert(rolePermissions);
    }
  }

  /**
   * Clonar un rol existente
   */
  async cloneRole(
    sourceRoleId: string,
    newRoleName: string,
    newRoleDescription?: string
  ): Promise<Role> {
    const sourceRole = await this.getRoleWithPermissions(sourceRoleId);

    if (!sourceRole) {
      throw new Error("Rol origen no encontrado");
    }

    // Crear nuevo rol con los mismos permisos
    const permissionIds = sourceRole.permissions.map((p) => p.id);

    return await this.createRole({
      name: newRoleName,
      description: newRoleDescription || `Copia de ${sourceRole.role.name}`,
      permissionIds,
    });
  }

  /**
   * Obtener estadísticas de roles
   */
  async getRoleStats(): Promise<{
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    rolesWithMostPermissions: { role: Role; permissionsCount: number }[];
  }> {
    try {
      const totalRoles = await this.roleRepository.count();
      const activeRoles = await this.roleRepository.count({
        where: { isActive: true },
      });
      const inactiveRoles = totalRoles - activeRoles;

      // Simplificando temporalmente para diagnosticar
      const rolesWithMostPermissions: {
        role: Role;
        permissionsCount: number;
      }[] = [];

      return {
        totalRoles,
        activeRoles,
        inactiveRoles,
        rolesWithMostPermissions,
      };
    } catch (error) {
      console.error("Error in getRoleStats:", error);
      throw error;
    }
  }

  /**
   * Buscar roles con filtros
   */
  async searchRoles(filters: {
    search?: string;
    isActive?: boolean;
    hasPermission?: string;
  }): Promise<Role[]> {
    const queryBuilder = this.roleRepository.createQueryBuilder("role");

    if (filters.isActive !== undefined) {
      queryBuilder.where("role.isActive = :isActive", {
        isActive: filters.isActive,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        "(role.name ILIKE :search OR role.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.hasPermission) {
      queryBuilder
        .innerJoin("role.rolePermissions", "rp")
        .innerJoin("rp.permission", "permission")
        .andWhere("permission.name = :permissionName", {
          permissionName: filters.hasPermission,
        });
    }

    return await queryBuilder.orderBy("role.name", "ASC").getMany();
  }

  /**
   * Verificar si un rol puede ser eliminado
   */
  async canDeleteRole(
    roleId: string
  ): Promise<{
    canDelete: boolean;
    reason?: string;
    hasUsers?: boolean;
    hasPermissions?: boolean;
  }> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });

    if (!role) {
      return { canDelete: false, reason: "Rol no encontrado" };
    }

    // No se puede eliminar roles del sistema (identificados por ID específico)
    // TODO: Agregar campo isSystemRole a la entidad Role para mejor gestión
    if (roleId === "00000000-0000-0000-0000-000000000001") {
      return {
        canDelete: false,
        reason: "No se puede eliminar el rol del sistema",
      };
    }

    // Verificar si hay usuarios asignados a este rol
    const userCount = await this.userProfileRepository.count({
      where: { roleId },
    });

    // Verificar si hay permisos asignados a este rol
    const permissionCount = await this.rolePermissionRepository.count({
      where: { roleId },
    });

    const hasUsers = userCount > 0;
    const hasPermissions = permissionCount > 0;

    return {
      canDelete: true,
      hasUsers,
      hasPermissions,
    };
  }
}
