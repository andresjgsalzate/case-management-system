import { Request, Response } from "express";
export declare class OriginController {
    private originService;
    constructor();
    getAllOrigins(req: Request, res: Response): Promise<void>;
    getOriginById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createOrigin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateOrigin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteOrigin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    searchOrigins(req: Request, res: Response): Promise<void>;
    getOriginStats(req: Request, res: Response): Promise<void>;
    checkCanDeleteOrigin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
