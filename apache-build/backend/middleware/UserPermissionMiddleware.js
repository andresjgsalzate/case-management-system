"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissionMiddleware = void 0;
const PermissionService_1 = require("../services/PermissionService");
class UserPermissionMiddleware {
    constructor() {
        this.canViewUsers = (scope) => {
            return async (req, res, next) => {
                try {
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: "Usuario no autenticado",
                        });
                    }
                    const permission = `users:view:${scope}`;
                    const hasPermission = await this.permissionService.hasPermission(req.user.roleId, permission);
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            message: "No tienes permisos para ver usuarios",
                        });
                    }
                    if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: "Solo puedes ver tu propio perfil",
                        });
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: "Error al verificar permisos",
                    });
                }
            };
        };
        this.canCreateUsers = (scope) => {
            return async (req, res, next) => {
                try {
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: "Usuario no autenticado",
                        });
                    }
                    const permission = `users:create:${scope}`;
                    const hasPermission = await this.permissionService.hasPermission(req.user.roleId, permission);
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            message: "No tienes permisos para crear usuarios",
                        });
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: "Error al verificar permisos",
                    });
                }
            };
        };
        this.canEditUsers = (scope) => {
            return async (req, res, next) => {
                try {
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: "Usuario no autenticado",
                        });
                    }
                    const permission = `users:edit:${scope}`;
                    const hasPermission = await this.permissionService.hasPermission(req.user.roleId, permission);
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            message: "No tienes permisos para editar usuarios",
                        });
                    }
                    if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: "Solo puedes editar tu propio perfil",
                        });
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: "Error al verificar permisos",
                    });
                }
            };
        };
        this.canDeleteUsers = (scope) => {
            return async (req, res, next) => {
                try {
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: "Usuario no autenticado",
                        });
                    }
                    const permission = `users:delete:${scope}`;
                    const hasPermission = await this.permissionService.hasPermission(req.user.roleId, permission);
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            message: "No tienes permisos para eliminar usuarios",
                        });
                    }
                    if (scope === "own" && req.params.id && req.params.id !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: "Solo puedes eliminar tu propio perfil",
                        });
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: "Error al verificar permisos",
                    });
                }
            };
        };
        this.canManagePasswords = async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: "Usuario no autenticado",
                    });
                }
                const hasPermission = await this.permissionService.hasPermission(req.user.roleId, "users:manage:passwords");
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para gestionar contraseñas",
                    });
                }
                next();
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Error al verificar permisos",
                });
            }
        };
        this.canManageRoles = async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: "Usuario no autenticado",
                    });
                }
                const hasPermission = await this.permissionService.hasPermission(req.user.roleId, "users:manage:roles");
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para gestionar roles",
                    });
                }
                next();
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Error al verificar permisos",
                });
            }
        };
        this.canManageStatus = async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: "Usuario no autenticado",
                    });
                }
                const hasPermission = await this.permissionService.hasPermission(req.user.roleId, "users:manage:status");
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para gestionar estado de usuarios",
                    });
                }
                next();
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Error al verificar permisos",
                });
            }
        };
        this.canAccessUsers = (scopes) => {
            return async (req, res, next) => {
                try {
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: "Usuario no autenticado",
                        });
                    }
                    for (const scope of scopes) {
                        const permission = `users:view:${scope}`;
                        const hasPermission = await this.permissionService.hasPermission(req.user.roleId, permission);
                        if (hasPermission) {
                            req.user = { ...req.user, allowedScope: scope };
                            return next();
                        }
                    }
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para acceder a usuarios",
                    });
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        message: "Error al verificar permisos",
                    });
                }
            };
        };
        this.permissionService = new PermissionService_1.PermissionService();
    }
}
exports.UserPermissionMiddleware = UserPermissionMiddleware;
