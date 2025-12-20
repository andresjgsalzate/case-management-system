"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const database_1 = require("../config/database");
const Role_1 = require("../entities/Role");
const RolePermission_1 = require("../entities/RolePermission");
const Permission_1 = require("../entities/Permission");
const UserProfile_1 = require("../entities/UserProfile");
class RoleService {
    constructor() {
        this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
        this.rolePermissionRepository = database_1.AppDataSource.getRepository(RolePermission_1.RolePermission);
        this.permissionRepository = database_1.AppDataSource.getRepository(Permission_1.Permission);
        this.userProfileRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
    }
    async getAllRoles() {
        return await this.roleRepository.find({
            where: { isActive: true },
            order: { name: "ASC" },
        });
    }
    async getRolesWithCounts() {
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
        return result.map((row) => ({
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
    async getRoleById(id) {
        return await this.roleRepository.findOne({
            where: { id },
            relations: ["rolePermissions", "rolePermissions.permission"],
        });
    }
    async getRoleWithPermissions(id) {
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
        const permissionsByModule = {};
        permissions.forEach((permission) => {
            if (!permissionsByModule[permission.module]) {
                permissionsByModule[permission.module] = [];
            }
            permissionsByModule[permission.module].push(permission);
        });
        return {
            role,
            permissions,
            permissionsByModule,
        };
    }
    async createRole(roleData) {
        const existingRole = await this.roleRepository.findOne({
            where: { name: roleData.name },
        });
        if (existingRole) {
            throw new Error("Ya existe un rol con ese nombre");
        }
        const role = this.roleRepository.create({
            name: roleData.name,
            description: roleData.description,
        });
        const savedRole = await this.roleRepository.save(role);
        if (roleData.permissionIds && roleData.permissionIds.length > 0) {
            await this.assignPermissionsToRole(savedRole.id, roleData.permissionIds);
        }
        return savedRole;
    }
    async updateRole(id, roleData) {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (!role) {
            throw new Error("Rol no encontrado");
        }
        if (roleData.name && roleData.name !== role.name) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: roleData.name },
            });
            if (existingRole) {
                throw new Error("Ya existe un rol con ese nombre");
            }
        }
        if (roleData.name !== undefined)
            role.name = roleData.name;
        if (roleData.description !== undefined)
            role.description = roleData.description;
        if (roleData.isActive !== undefined)
            role.isActive = roleData.isActive;
        const updatedRole = await this.roleRepository.save(role);
        if (roleData.permissionIds) {
            await this.assignPermissionsToRole(id, roleData.permissionIds);
        }
        return updatedRole;
    }
    async deleteRole(id) {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (!role) {
            throw new Error("Rol no encontrado");
        }
        if (id === "00000000-0000-0000-0000-000000000001") {
            throw new Error("No se puede eliminar el rol del sistema");
        }
        const deleteInfo = await this.canDeleteRole(id);
        if (!deleteInfo.canDelete) {
            throw new Error(deleteInfo.reason || "No se puede eliminar el rol");
        }
        if (deleteInfo.hasUsers) {
            await this.roleRepository.update(id, { isActive: false });
        }
        else {
            await this.rolePermissionRepository.delete({ roleId: id });
            await this.roleRepository.delete(id);
        }
    }
    async assignPermissionsToRole(roleId, permissionIds) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
            throw new Error("Rol no encontrado");
        }
        const permissions = await this.permissionRepository.findByIds(permissionIds);
        if (permissions.length !== permissionIds.length) {
            throw new Error("Algunos permisos no existen");
        }
        await this.rolePermissionRepository.delete({ roleId });
        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
            }));
            await this.rolePermissionRepository.insert(rolePermissions);
        }
    }
    async cloneRole(sourceRoleId, newRoleName, newRoleDescription) {
        const sourceRole = await this.getRoleWithPermissions(sourceRoleId);
        if (!sourceRole) {
            throw new Error("Rol origen no encontrado");
        }
        const permissionIds = sourceRole.permissions.map((p) => p.id);
        return await this.createRole({
            name: newRoleName,
            description: newRoleDescription || `Copia de ${sourceRole.role.name}`,
            permissionIds,
        });
    }
    async getRoleStats() {
        try {
            const totalRoles = await this.roleRepository.count();
            const activeRoles = await this.roleRepository.count({
                where: { isActive: true },
            });
            const inactiveRoles = totalRoles - activeRoles;
            const rolesWithMostPermissions = [];
            return {
                totalRoles,
                activeRoles,
                inactiveRoles,
                rolesWithMostPermissions,
            };
        }
        catch (error) {
            console.error("Error in getRoleStats:", error);
            throw error;
        }
    }
    async searchRoles(filters) {
        const queryBuilder = this.roleRepository.createQueryBuilder("role");
        if (filters.isActive !== undefined) {
            queryBuilder.where("role.isActive = :isActive", {
                isActive: filters.isActive,
            });
        }
        if (filters.search) {
            queryBuilder.andWhere("(role.name ILIKE :search OR role.description ILIKE :search)", { search: `%${filters.search}%` });
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
    async canDeleteRole(roleId) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
            return { canDelete: false, reason: "Rol no encontrado" };
        }
        if (roleId === "00000000-0000-0000-0000-000000000001") {
            return {
                canDelete: false,
                reason: "No se puede eliminar el rol del sistema",
            };
        }
        const userCount = await this.userProfileRepository.count({
            where: { roleId },
        });
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
exports.RoleService = RoleService;
