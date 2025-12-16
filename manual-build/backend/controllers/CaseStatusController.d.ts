import { Request, Response } from "express";
export declare class CaseStatusController {
    private caseStatusService;
    constructor();
    getAllStatuses(req: Request, res: Response): Promise<void>;
    getStatusById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    searchStatuses(req: Request, res: Response): Promise<void>;
    getStatusStats(req: Request, res: Response): Promise<void>;
    reorderStatuses(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    checkCanDeleteStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getActiveStatusesOrdered(req: Request, res: Response): Promise<void>;
}
