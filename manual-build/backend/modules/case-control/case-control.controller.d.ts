import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
export declare class CaseControlController {
    private caseControlRepository;
    private caseStatusRepository;
    private caseRepository;
    private userRepository;
    private timeEntryRepository;
    private manualTimeEntryRepository;
    constructor();
    getCaseStatuses(req: Request, res: Response): Promise<void>;
    getAllCaseControls(req: Request, res: Response): Promise<void>;
    getCaseControlById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createCaseControl(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateCaseControlStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteCaseControl(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTimeEntries(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getManualTimeEntries(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
