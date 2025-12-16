"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTeamPermission = exports.requireAdmin = exports.filterByScope = exports.requireAnyPermission = exports.requireAllPermissions = exports.requirePermissionWithScope = exports.requirePermission = exports.authMiddleware = exports.AuthorizationMiddleware = void 0;
const PermissionService_1 = require("../services/PermissionService");
const TeamService_1 = require("../services/TeamService");
const data_source_1 = __importDefault(require("../data-source"));
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
        if (req.user) {
            const user = req.user;
            let userTeamIds = [];
            try {
                if (data_source_1.default.isInitialized) {
                    const teamService = this.getTeamService();
                    const userTeams = await teamService.getUserTeams(user.id);
                    userTeamIds = userTeams.map((team) => team.id);
                }
            }
            catch (error) {
                console.warn("No se pudieron cargar los equipos del usuario:", error);
            }
            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                roleId: user.roleId || "",
                roleName: user.roleName,
                teamId: userTeamIds[0],
                teamIds: userTeamIds,
                ...req.userWithPermissions,
            };
        }
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
                console.error("Error verificando permisos:", error);
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
                const scope = await this.permissionService.getHighestScope(user.roleId, module, action);
                if (!scope) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredModule: module,
                        requiredAction: action,
                    });
                }
                user.permissionScope = scope;
                req.userWithPermissions = user;
                next();
            }
            catch (error) {
                console.error("Error verificando permisos con scope:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    requireAnyPermission(permissionNames) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                let hasAnyPermission = false;
                let highestScope = null;
                for (const permissionName of permissionNames) {
                    const hasPermission = await this.permissionService.hasPermission(user.roleId, permissionName);
                    if (hasPermission) {
                        hasAnyPermission = true;
                        const parts = permissionName.split(".");
                        const scope = parts[parts.length - 1];
                        if (!highestScope ||
                            this.getScopePriority(scope) > this.getScopePriority(highestScope)) {
                            highestScope = scope;
                        }
                    }
                }
                if (!hasAnyPermission) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredAnyOf: permissionNames,
                    });
                }
                user.permissionScope = highestScope || undefined;
                req.userWithPermissions = user;
                next();
            }
            catch (error) {
                console.error("Error verificando permisos múltiples:", error);
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
                const missingPermissions = [];
                for (const permissionName of permissionNames) {
                    const hasPermission = await this.permissionService.hasPermission(user.roleId, permissionName);
                    if (!hasPermission) {
                        missingPermissions.push(permissionName);
                    }
                }
                if (missingPermissions.length > 0) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        missingPermissions,
                    });
                }
                next();
            }
            catch (error) {
                console.error("Error verificando todos los permisos:", error);
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
                        requiredModule: module,
                        requiredAction: action,
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
                        if (options.teamIdField &&
                            user.teamIds &&
                            user.teamIds.length > 0) {
                            user.scopeFilters[options.teamIdField] = user.teamIds;
                        }
                        if (options.getEntityTeamId && user.teamIds) {
                            const entityTeamId = await options.getEntityTeamId(req);
                            if (entityTeamId && !user.teamIds.includes(entityTeamId)) {
                                return res.status(403).json({
                                    error: "Solo puede acceder a recursos de sus equipos",
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
    requireTeamPermission(permission, checkTeamManagership = false) {
        return async (req, res, next) => {
            try {
                const user = await this.getUserWithPermissions(req);
                if (!user) {
                    return res.status(401).json({
                        error: "No autenticado",
                    });
                }
                const { teamId } = req.params;
                const hasPermission = await this.permissionService.hasPermission(user.roleId, permission);
                if (!hasPermission) {
                    return res.status(403).json({
                        error: "Permisos insuficientes",
                        requiredPermission: permission,
                    });
                }
                if (checkTeamManagership && permission.includes(".own") && teamId) {
                    try {
                        const teamService = this.getTeamService();
                        const isManager = await teamService.isUserTeamManager(user.id, teamId);
                        if (!isManager) {
                            return res.status(403).json({
                                error: "Solo el manager del equipo puede realizar esta acción",
                            });
                        }
                    }
                    catch (error) {
                        console.warn("Error verificando managership del equipo:", error);
                    }
                }
                next();
            }
            catch (error) {
                console.error("Error en verificación de permisos de equipo:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
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
                console.error("Error en verificación personalizada:", error);
                return res.status(500).json({
                    error: "Error interno del servidor",
                });
            }
        };
    }
    getScopePriority(scope) {
        switch (scope) {
            case "own":
                return 1;
            case "team":
                return 2;
            case "all":
                return 3;
            default:
                return 0;
        }
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
const requireTeamPermission = (permission, checkManagership = false) => exports.authMiddleware.requireTeamPermission(permission, checkManagership);
exports.requireTeamPermission = requireTeamPermission;
exports.default = exports.authMiddleware;
