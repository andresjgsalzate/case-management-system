"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const database_1 = require("../config/database");
const Permission_1 = require("../entities/Permission");
const RolePermission_1 = require("../entities/RolePermission");
const Role_1 = require("../entities/Role");
class PermissionService {
    constructor() {
        try {
            console.log("=== PermissionService constructor START ===");
            console.log("AppDataSource isInitialized:", database_1.AppDataSource.isInitialized);
            this.permissionRepository = database_1.AppDataSource.getRepository(Permission_1.Permission);
            this.rolePermissionRepository =
                database_1.AppDataSource.getRepository(RolePermission_1.RolePermission);
            this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
            console.log("Repositories initialized successfully");
            console.log("=== PermissionService constructor END ===");
        }
        catch (error) {
            console.error("=== ERROR in PermissionService constructor ===");
            console.error("Error:", error);
            console.error("Stack:", error instanceof Error ? error.stack : "No stack");
            throw error;
        }
    }
    async getAllPermissions() {
        return await this.permissionRepository.find({
            where: { isActive: true },
            order: { module: "ASC", action: "ASC", scope: "ASC" },
        });
    }
    async getPermissionsByModule(module) {
        return await this.permissionRepository.find({
            where: { module, isActive: true },
            order: { action: "ASC", scope: "ASC" },
        });
    }
    async getPermissionsByRole(roleId) {
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { roleId },
            relations: ["permission"],
            order: { permission: { module: "ASC", action: "ASC", scope: "ASC" } },
        });
        return rolePermissions
            .map((rp) => rp.permission)
            .filter((permission) => permission.isActive);
    }
    async hasPermission(roleId, permissionName) {
        console.log(`=== hasPermission: ${permissionName} for role: ${roleId} ===`);
        try {
            const permission = await this.permissionRepository.findOne({
                where: { name: permissionName, isActive: true },
            });
            console.log(`Permission found:`, permission ? `ID: ${permission.id}` : "NULL");
            if (!permission) {
                console.log(`Permission ${permissionName} not found or not active`);
                return false;
            }
            const rolePermission = await this.rolePermissionRepository.findOne({
                where: { roleId, permissionId: permission.id },
            });
            console.log(`RolePermission found:`, !!rolePermission);
            const result = !!rolePermission;
            console.log(`=== hasPermission result: ${result} ===`);
            return result;
        }
        catch (error) {
            console.error(`Error in hasPermission for ${permissionName}:`, error);
            throw error;
        }
    }
    async hasPermissions(roleId, permissionNames) {
        console.log("=== hasPermissions START ===");
        console.log("RoleId:", roleId);
        console.log("Permission names:", permissionNames);
        const result = {};
        for (const permissionName of permissionNames) {
            console.log(`Checking permission: ${permissionName}`);
            try {
                result[permissionName] = await this.hasPermission(roleId, permissionName);
                console.log(`Permission ${permissionName}: ${result[permissionName]}`);
            }
            catch (error) {
                console.error(`Error checking permission ${permissionName}:`, error);
                throw error;
            }
        }
        console.log("Final result:", result);
        console.log("=== hasPermissions END ===");
        return result;
    }
    async hasPermissionWithScope(roleId, module, action, userScope = "own") {
        const permissionName = `${module}.${action}.${userScope}`;
        return await this.hasPermission(roleId, permissionName);
    }
    async getHighestScope(roleId, module, action) {
        const scopes = ["all", "team", "own"];
        for (const scope of scopes) {
            const hasPermission = await this.hasPermissionWithScope(roleId, module, action, scope);
            if (hasPermission) {
                return scope;
            }
        }
        return null;
    }
    async assignPermissionsToRole(roleId, permissionIds) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
            throw new Error("Rol no encontrado");
        }
        await this.rolePermissionRepository.delete({ roleId });
        const rolePermissions = permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
        }));
        await this.rolePermissionRepository.insert(rolePermissions);
    }
    async createPermission(permissionData) {
        const existingPermission = await this.permissionRepository.findOne({
            where: { name: permissionData.name },
        });
        if (existingPermission) {
            throw new Error("Ya existe un permiso con ese nombre");
        }
        const permission = this.permissionRepository.create(permissionData);
        return await this.permissionRepository.save(permission);
    }
    async getModulesStructure() {
        const permissions = await this.getAllPermissions();
        const structure = {};
        permissions.forEach((permission) => {
            if (!structure[permission.module]) {
                structure[permission.module] = {
                    actions: [],
                    scopes: [],
                    totalPermissions: 0,
                };
            }
            const moduleStructure = structure[permission.module];
            if (!moduleStructure.actions.includes(permission.action)) {
                moduleStructure.actions.push(permission.action);
            }
            if (!moduleStructure.scopes.includes(permission.scope)) {
                moduleStructure.scopes.push(permission.scope);
            }
            moduleStructure.totalPermissions++;
        });
        Object.keys(structure).forEach((module) => {
            const moduleStructure = structure[module];
            if (moduleStructure) {
                moduleStructure.actions.sort();
                moduleStructure.scopes.sort();
            }
        });
        return structure;
    }
    async searchPermissions(filters) {
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
            queryBuilder.andWhere("(permission.name ILIKE :search OR permission.description ILIKE :search)", { search: `%${filters.search}%` });
        }
        return await queryBuilder
            .orderBy("permission.module", "ASC")
            .addOrderBy("permission.action", "ASC")
            .addOrderBy("permission.scope", "ASC")
            .getMany();
    }
    async getAllActions() {
        const result = await this.permissionRepository
            .createQueryBuilder("permission")
            .select("DISTINCT permission.action", "action")
            .orderBy("permission.action", "ASC")
            .getRawMany();
        return result;
    }
    async translateAction(fromAction, toAction) {
        const result = await this.permissionRepository.update({ action: fromAction }, { action: toAction });
        return { count: result.affected || 0 };
    }
    async updateNamesFormat() {
        const permissions = await this.permissionRepository.find();
        let updatedCount = 0;
        for (const permission of permissions) {
            const newName = `${permission.module}.${permission.action}.${permission.scope}`;
            if (permission.name !== newName) {
                await this.permissionRepository.update({ id: permission.id }, { name: newName });
                updatedCount++;
            }
        }
        return { count: updatedCount };
    }
}
exports.PermissionService = PermissionService;
