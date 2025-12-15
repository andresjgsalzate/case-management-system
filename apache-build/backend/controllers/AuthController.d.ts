import { Request, Response } from "express";
export declare class AuthController {
    private userRepository;
    private permissionRepository;
    private rolePermissionRepository;
    getUserPermissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    checkPermission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    checkModuleAccess: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
