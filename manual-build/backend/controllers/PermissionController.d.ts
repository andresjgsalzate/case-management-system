import { Request, Response } from "express";
export declare class PermissionController {
    private permissionService;
    constructor();
    getAllPermissions(req: Request, res: Response): Promise<void>;
    getPermissionsByModule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getModulesStructure(req: Request, res: Response): Promise<void>;
    searchPermissions(req: Request, res: Response): Promise<void>;
    createPermission(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    checkUserPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getHighestScope(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getActions(req: Request, res: Response): Promise<void>;
    translateAction(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateNamesFormat(req: Request, res: Response): Promise<void>;
}
