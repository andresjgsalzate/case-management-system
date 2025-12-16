import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/PermissionService";
import { UserWithPermissions, ScopeFilterOptions } from "../types/permissions";
export declare class AuthorizationMiddleware {
    private permissionService;
    private teamService;
    constructor();
    private getTeamService;
    private getUserWithPermissions;
    requirePermission(permissionName: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requirePermissionWithScope(module: string, action: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireAllPermissions(permissionNames: string[]): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireAnyPermission(permissionNames: string[]): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    filterByScope(module: string, action: string, options?: ScopeFilterOptions): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireAdmin(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createCustomPermissionCheck(checkFunction: (user: UserWithPermissions, permissionService: PermissionService) => Promise<boolean>, errorMessage?: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const authMiddleware: AuthorizationMiddleware;
export declare const requirePermission: (permissionName: string) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requirePermissionWithScope: (module: string, action: string) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAllPermissions: (permissionNames: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAnyPermission: (permissionNames: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const filterByScope: (module: string, action: string, options?: any) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAdmin: () => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
