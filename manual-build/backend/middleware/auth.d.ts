import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: any;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeRole: (...allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
