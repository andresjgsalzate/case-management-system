import { Request, Response } from "express";
export declare class ApplicationController {
    private applicationService;
    constructor();
    getAllApplications(req: Request, res: Response): Promise<void>;
    getApplicationById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    searchApplications(req: Request, res: Response): Promise<void>;
    getApplicationStats(req: Request, res: Response): Promise<void>;
    checkCanDeleteApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
