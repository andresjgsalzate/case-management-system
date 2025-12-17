import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        roleId: string;
        roleName: string;
        allowedScope?: string;
    };
}
export declare class UserPermissionMiddleware {
    private permissionService;
    constructor();
    canViewUsers: (scope: "own" | "team" | "all") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canCreateUsers: (scope: "own" | "team" | "all") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canEditUsers: (scope: "own" | "team" | "all") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canDeleteUsers: (scope: "own" | "team" | "all") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canManagePasswords: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canManageRoles: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canManageStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    canAccessUsers: (scopes: ("own" | "team" | "all")[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
