import { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/auth.service";
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

    req.user = user;
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
