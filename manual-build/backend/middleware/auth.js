"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateToken = void 0;
const auth_service_1 = require("../modules/auth/auth.service");
const database_1 = require("../config/database");
const UserProfile_1 = require("../entities/UserProfile");
const RolePermission_1 = require("../entities/RolePermission");
const errorHandler_1 = require("./errorHandler");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = authHeader && authHeader.split(" ")[1];
        if (!token && req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            throw (0, errorHandler_1.createError)("Access token required", 401);
        }
        const authService = new auth_service_1.AuthService();
        const user = await authService.validateToken(token);
        if (!user) {
            throw (0, errorHandler_1.createError)("Invalid or expired token", 401);
        }
        const userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        const rolePermissionRepository = database_1.AppDataSource.getRepository(RolePermission_1.RolePermission);
        const userWithRole = await userRepository.findOne({
            where: { id: user.id },
            relations: ["role"],
        });
        if (!userWithRole || !userWithRole.role) {
            throw (0, errorHandler_1.createError)("User role not found", 401);
        }
        const rolePermissions = await rolePermissionRepository
            .createQueryBuilder("rp")
            .innerJoinAndSelect("rp.permission", "permission")
            .where("rp.roleId = :roleId", { roleId: userWithRole.role.id })
            .andWhere("permission.isActive = :isActive", { isActive: true })
            .getMany();
        const permissions = rolePermissions.map((rp) => rp.permission.name);
        req.user = {
            ...user,
            roleId: userWithRole.role.id,
            roleName: userWithRole.role.name,
            permissions: permissions,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw (0, errorHandler_1.createError)("Authentication required", 401);
            }
            if (!allowedRoles.includes(user.roleName)) {
                throw (0, errorHandler_1.createError)("Insufficient permissions", 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorizeRole = authorizeRole;
