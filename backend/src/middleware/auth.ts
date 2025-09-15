import { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/auth.service";
import { AppDataSource } from "../config/database";
import { UserProfile } from "../entities/UserProfile";
import { Role } from "../entities/Role";
import { RolePermission } from "../entities/RolePermission";
import { Permission } from "../entities/Permission";
import { createError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw createError("Access token required", 401);
    }

    const authService = new AuthService();
    const user = await authService.validateToken(token);

    if (!user) {
      throw createError("Invalid or expired token", 401);
    }

    // Obtener permisos del usuario
    const userRepository = AppDataSource.getRepository(UserProfile);
    const rolePermissionRepository =
      AppDataSource.getRepository(RolePermission);

    const userWithRole = await userRepository.findOne({
      where: { id: user.id },
      relations: ["role"],
    });

    if (!userWithRole || !userWithRole.role) {
      throw createError("User role not found", 401);
    }

    // Obtener permisos del rol
    const rolePermissions = await rolePermissionRepository
      .createQueryBuilder("rp")
      .innerJoinAndSelect("rp.permission", "permission")
      .where("rp.roleId = :roleId", { roleId: userWithRole.role.id })
      .andWhere("permission.isActive = :isActive", { isActive: true })
      .getMany();

    // Extraer nombres de permisos
    const permissions = rolePermissions.map((rp) => rp.permission.name);

    // Asignar al request
    req.user = {
      ...user,
      roleName: userWithRole.role.name,
      permissions: permissions,
    };

    console.log(
      `🔐 [AUTH] Usuario ${user.id} autenticado con ${permissions.length} permisos`
    );

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        throw createError("Authentication required", 401);
      }

      if (!allowedRoles.includes(user.roleName)) {
        throw createError("Insufficient permissions", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
