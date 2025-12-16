import { Request, Response } from "express";
export declare class CaseStatusController {
    private caseStatusRepository;
    constructor();
    getAllStatuses(req: Request, res: Response): Promise<void>;
    getStatusById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    initializeDefaultStatuses(req: Request, res: Response): Promise<void>;
}
