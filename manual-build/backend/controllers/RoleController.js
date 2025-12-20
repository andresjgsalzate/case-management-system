"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const RoleService_1 = require("../services/RoleService");
class RoleController {
    constructor() {
        this.roleService = new RoleService_1.RoleService();
    }
    async getAllRoles(req, res) {
        try {
            const { page = 1, limit = 10, search, isActive, sortBy = "createdAt", sortOrder = "DESC", } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            if (search || isActive !== undefined) {
                const filters = {
                    search: search,
                    isActive: isActive === "true",
                };
                const roles = await this.roleService.searchRoles(filters);
                res.json({
                    success: true,
                    data: {
                        roles: roles.slice(offset, offset + limitNum),
                        total: roles.length,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(roles.length / limitNum),
                    },
                    message: "Roles obtenidos correctamente",
                });
            }
            else {
                const allRoles = await this.roleService.getRolesWithCounts();
                allRoles.sort((a, b) => {
                    if (sortBy === "name") {
                        return sortOrder === "ASC"
                            ? a.name.localeCompare(b.name)
                            : b.name.localeCompare(a.name);
                    }
                    else if (sortBy === "createdAt") {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();
                        return sortOrder === "ASC" ? dateA - dateB : dateB - dateA;
                    }
                    return 0;
                });
                const paginatedRoles = allRoles.slice(offset, offset + limitNum);
                res.json({
                    success: true,
                    data: {
                        roles: paginatedRoles,
                        total: allRoles.length,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(allRoles.length / limitNum),
                    },
                    message: "Roles obtenidos correctamente",
                });
            }
        }
        catch (error) {
            console.error("Error al obtener roles:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getRoleById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            const roleData = await this.roleService.getRoleWithPermissions(id);
            if (!roleData) {
                return res.status(404).json({
                    success: false,
                    error: "Rol no encontrado",
                });
            }
            res.json({
                success: true,
                data: roleData,
                message: "Rol obtenido correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener rol:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async createRole(req, res) {
        try {
            const roleData = req.body;
            if (!roleData.name) {
                return res.status(400).json({
                    success: false,
                    error: "El nombre del rol es requerido",
                });
            }
            const role = await this.roleService.createRole(roleData);
            res.status(201).json({
                success: true,
                data: role,
                message: "Rol creado correctamente",
            });
        }
        catch (error) {
            console.error("Error al crear rol:", error);
            if (error instanceof Error) {
                if (error.message === "Ya existe un rol con ese nombre") {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Algunos permisos no existen") {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const roleData = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            const updatedRole = await this.roleService.updateRole(id, roleData);
            res.json({
                success: true,
                data: updatedRole,
                message: "Rol actualizado correctamente",
            });
        }
        catch (error) {
            console.error("Error al actualizar rol:", error);
            if (error instanceof Error) {
                if (error.message === "Rol no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Ya existe un rol con ese nombre") {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Algunos permisos no existen") {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async deleteRole(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            const canDelete = await this.roleService.canDeleteRole(id);
            if (!canDelete.canDelete) {
                return res.status(400).json({
                    success: false,
                    error: canDelete.reason,
                });
            }
            await this.roleService.deleteRole(id);
            res.json({
                success: true,
                message: "Rol eliminado correctamente",
            });
        }
        catch (error) {
            console.error("Error al eliminar rol:", error);
            if (error instanceof Error) {
                if (error.message === "Rol no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("No se puede eliminar")) {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getRolePermissions(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            const roleWithPermissions = await this.roleService.getRoleWithPermissions(id);
            if (!roleWithPermissions) {
                return res.status(404).json({
                    success: false,
                    error: "Rol no encontrado",
                });
            }
            res.json({
                success: true,
                data: roleWithPermissions.permissions,
                message: "Permisos del rol obtenidos correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener permisos del rol:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async assignPermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            if (!Array.isArray(permissionIds)) {
                return res.status(400).json({
                    success: false,
                    error: "Se debe proporcionar un array de IDs de permisos",
                });
            }
            await this.roleService.assignPermissionsToRole(id, permissionIds);
            res.json({
                success: true,
                message: "Permisos asignados correctamente",
            });
        }
        catch (error) {
            console.error("Error al asignar permisos:", error);
            if (error instanceof Error) {
                if (error.message === "Rol no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Algunos permisos no existen") {
                    return res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async cloneRole(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol origen es requerido",
                });
            }
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: "Nombre del nuevo rol es requerido",
                });
            }
            const clonedRole = await this.roleService.cloneRole(id, name, description);
            res.status(201).json({
                success: true,
                data: clonedRole,
                message: "Rol clonado correctamente",
            });
        }
        catch (error) {
            console.error("Error al clonar rol:", error);
            if (error instanceof Error) {
                if (error.message === "Rol origen no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Ya existe un rol con ese nombre") {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getRoleStats(req, res) {
        try {
            const stats = await this.roleService.getRoleStats();
            res.json({
                success: true,
                data: stats,
                message: "Estadísticas de roles obtenidas correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estadísticas de roles:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async searchRoles(req, res) {
        try {
            const { search, isActive, hasPermission } = req.query;
            const filters = {
                search: search,
                isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
                hasPermission: hasPermission,
            };
            const roles = await this.roleService.searchRoles(filters);
            res.json({
                success: true,
                data: roles,
                message: "Búsqueda de roles completada",
                filters: filters,
            });
        }
        catch (error) {
            console.error("Error al buscar roles:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async checkCanDeleteRole(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del rol es requerido",
                });
            }
            const result = await this.roleService.canDeleteRole(id);
            res.json({
                success: true,
                data: result,
                message: "Verificación completada",
            });
        }
        catch (error) {
            console.error("Error al verificar eliminación de rol:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
}
exports.RoleController = RoleController;
