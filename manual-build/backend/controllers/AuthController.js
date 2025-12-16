"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const database_1 = require("../config/database");
const UserProfile_1 = require("../entities/UserProfile");
const Permission_1 = require("../entities/Permission");
const RolePermission_1 = require("../entities/RolePermission");
class AuthController {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        this.permissionRepository = database_1.AppDataSource.getRepository(Permission_1.Permission);
        this.rolePermissionRepository = database_1.AppDataSource.getRepository(RolePermission_1.RolePermission);
        this.getUserPermissions = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Usuario no autenticado",
                    });
                }
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
                const rolePermissions = await this.rolePermissionRepository
                    .createQueryBuilder("rp")
                    .innerJoinAndSelect("rp.permission", "permission")
                    .where("rp.roleId = :roleId", { roleId: user.role.id })
                    .andWhere("permission.isActive = :isActive", { isActive: true })
                    .getMany();
                const permissions = rolePermissions.map((rp) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    module: rp.permission.module,
                    action: rp.permission.action,
                    scope: rp.permission.scope,
                    description: rp.permission.description,
                    isActive: rp.permission.isActive,
                }));
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
            }
            catch (error) {
                console.error("Error getting user permissions:", error);
                res.status(500).json({
                    success: false,
                    message: "Error interno del servidor",
                });
            }
        };
        this.checkPermission = async (req, res) => {
            try {
                const { permission } = req.params;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        hasPermission: false,
                        message: "Usuario no autenticado",
                    });
                }
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
            }
            catch (error) {
                console.error("Error checking permission:", error);
                res.status(500).json({
                    success: false,
                    hasPermission: false,
                    message: "Error interno del servidor",
                });
            }
        };
        this.checkModuleAccess = async (req, res) => {
            try {
                const { module } = req.params;
                const userId = req.user?.id;
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
            }
            catch (error) {
                console.error("Error checking module access:", error);
                res.status(500).json({
                    success: false,
                    hasAccess: false,
                    message: "Error interno del servidor",
                });
            }
        };
    }
}
exports.AuthController = AuthController;
