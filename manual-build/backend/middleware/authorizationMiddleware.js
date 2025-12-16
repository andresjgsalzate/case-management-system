"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.filterByScope = exports.requireAnyPermission = exports.requireAllPermissions = exports.requirePermissionWithScope = exports.requirePermission = exports.authMiddleware = exports.AuthorizationMiddleware = void 0;
const PermissionService_1 = require("../services/PermissionService");
const TeamService_1 = require("../services/TeamService");
class AuthorizationMiddleware {
    constructor() {
        this.teamService = null;
        this.permissionService = new PermissionService_1.PermissionService();
    }
    getTeamService() {
        if (!this.teamService) {
            this.teamService = new TeamService_1.TeamService();
        }
        return this.teamService;
    }
    async getUserWithPermissions(req) {
        console.log("=== getUserWithPermissions START ===");
        console.log("req.user exists:", !!req.user);
        if (req.user) {
            const user = req.user;
            console.log("User data:", {
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.roleName,
            });
            let userTeamIds = [];
            try {
                console.log("Loading user teams...");
                const teamService = this.getTeamService();
                const userTeams = await teamService.getUserTeams(user.id);
                userTeamIds = userTeams.map((team) => team.id);
                console.log("User teams loaded:", userTeamIds);
            }
            catch (error) {
                console.warn("No se pudieron cargar los equipos del usuario:", error);
            }
            const userWithPermissions = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                roleId: user.roleId || "",
                roleName: user.roleName,
                teamId: userTeamIds[0],
                teamIds: userTeamIds,
                ...req.userWithPermissions,
            };
            console.log("Returning userWithPermissions:", userWithPermissions);
            console.log("=== getUserWithPermissions END ===");
            return userWithPermissions;
        }
        console.log("No user found in req.user");
        console.log("=== getUserWithPermissions END ===");
        return null;
    }
    requirePermission(permissionName) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const hasPermission = await this.permissionService.hasPermission(user.roleId, permissionName);
                if (!hasPermission) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredPermission: permissionName,
                    });
                }
                next();
            }
            catch (error) {
                console.error("Error en verificación de permisos:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    requirePermissionWithScope(module, action) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const highestScope = await this.permissionService.getHighestScope(user.roleId, module, action);
                if (!highestScope) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredPermission: `${module}.${action}.*`,
                    });
                }
                user.permissionScope = highestScope;
                req.userWithPermissions = user;
                next();
            }
            catch (error) {
                console.error("Error en verificación de permisos con scope:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    requireAllPermissions(permissionNames) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const permissionResults = await this.permissionService.hasPermissions(user.roleId, permissionNames);
                const missingPermissions = permissionNames.filter((permission) => !permissionResults[permission]);
                if (missingPermissions.length > 0) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        missingPermissions,
                    });
                }
                next();
            }
            catch (error) {
                console.error("Error en verificación de múltiples permisos:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    requireAnyPermission(permissionNames) {
        return async (req, res, next) => {
            try {
                console.log("=== DEBUGGING requireAnyPermission ===");
                console.log("Permissions to check:", permissionNames);
                const user = await this.getUserWithPermissions(req);
                console.log("User found:", user ? `ID: ${user.id}, RoleId: ${user.roleId}` : "NULL");
                if (!user) {
                    console.log("User not found, returning 401");
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                console.log("Calling hasPermissions with roleId:", user.roleId, "permissions:", permissionNames);
                const permissionResults = await this.permissionService.hasPermissions(user.roleId, permissionNames);
                console.log("Permission results:", permissionResults);
                const hasAnyPermission = permissionNames.some((permission) => permissionResults[permission]);
                console.log("Has any permission:", hasAnyPermission);
                if (!hasAnyPermission) {
                    console.log("No permissions found, returning 403");
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredAnyOf: permissionNames,
                    });
                }
                console.log("Permission check passed, calling next()");
                next();
            }
            catch (error) {
                console.error("=== ERROR in requireAnyPermission ===");
                console.error("Error en verificación de permisos opcionales:", error);
                console.error("Stack trace:", error instanceof Error ? error.stack : error);
                console.error("=== END ERROR ===");
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    filterByScope(module, action, options = {}) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const highestScope = await this.permissionService.getHighestScope(user.roleId, module, action);
                if (!highestScope) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                    });
                }
                user.permissionScope = highestScope;
                user.scopeFilters = {};
                switch (highestScope) {
                    case "own":
                        if (options.userIdField) {
                            user.scopeFilters[options.userIdField] = user.id;
                        }
                        if (options.getEntityId) {
                            const entityId = options.getEntityId(req);
                            if (entityId && entityId !== user.id) {
                                return res.status(403).json({
                                    error: "Solo puede acceder a sus propios recursos",
                                });
                            }
                        }
                        break;
                    case "team":
                        if (options.teamIdField && user.teamId) {
                            user.scopeFilters[options.teamIdField] = user.teamId;
                        }
                        if (options.getEntityTeamId) {
                            const entityTeamId = await options.getEntityTeamId(req);
                            if (entityTeamId && entityTeamId !== user.teamId) {
                                return res.status(403).json({
                                    error: "Solo puede acceder a recursos de su equipo",
                                });
                            }
                        }
                        break;
                    case "all":
                        break;
                }
                req.userWithPermissions = user;
                next();
            }
            catch (error) {
                console.error("Error en filtrado por scope:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    requireAdmin() {
        return this.requirePermission("roles.manage.all");
    }
    createCustomPermissionCheck(checkFunction, errorMessage = "Permisos insuficientes") {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const hasPermission = await checkFunction(user, this.permissionService);
                if (!hasPermission) {
                    return res.status(403).json({
                        error: errorMessage,
                    });
                }
                next();
            }
            catch (error) {
                console.error("Error en verificación personalizada de permisos:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
}
exports.AuthorizationMiddleware = AuthorizationMiddleware;
exports.authMiddleware = new AuthorizationMiddleware();
const requirePermission = (permissionName) => exports.authMiddleware.requirePermission(permissionName);
exports.requirePermission = requirePermission;
const requirePermissionWithScope = (module, action) => exports.authMiddleware.requirePermissionWithScope(module, action);
exports.requirePermissionWithScope = requirePermissionWithScope;
const requireAllPermissions = (permissionNames) => exports.authMiddleware.requireAllPermissions(permissionNames);
exports.requireAllPermissions = requireAllPermissions;
const requireAnyPermission = (permissionNames) => exports.authMiddleware.requireAnyPermission(permissionNames);
exports.requireAnyPermission = requireAnyPermission;
const filterByScope = (module, action, options) => exports.authMiddleware.filterByScope(module, action, options);
exports.filterByScope = filterByScope;
const requireAdmin = () => exports.authMiddleware.requireAdmin();
exports.requireAdmin = requireAdmin;
