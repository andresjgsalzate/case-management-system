import { Request, Response } from "express";
export declare class RoleController {
    private roleService;
    constructor();
    getAllRoles(req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getRolePermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    assignPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    cloneRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getRoleStats(req: Request, res: Response): Promise<void>;
    searchRoles(req: Request, res: Response): Promise<void>;
    checkCanDeleteRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
