import { Request, Response } from "express";
export declare class TestController {
    private permissionService;
    private roleService;
    constructor();
    getPermissionsTest(req: Request, res: Response): Promise<void>;
    getRolesTest(req: Request, res: Response): Promise<void>;
    getPermissionsByModule(req: Request, res: Response): Promise<void>;
    getRolePermissions(req: Request, res: Response): Promise<void>;
    getSystemStatus(req: Request, res: Response): Promise<void>;
}
