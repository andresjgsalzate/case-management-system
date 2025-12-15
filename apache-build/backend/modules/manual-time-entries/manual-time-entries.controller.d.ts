import { Request, Response } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                fullName?: string;
                role?: string;
                roleName?: string;
            };
        }
    }
}
export declare class ManualTimeEntriesController {
    private manualTimeEntryRepository;
    private caseControlRepository;
    getManualTimeEntriesByCaseControl(req: Request, res: Response): Promise<void>;
    createManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteManualTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getManualTimeEntriesByUser(req: Request, res: Response): Promise<void>;
}
