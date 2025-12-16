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
export declare class TimeEntriesController {
    private timeEntryRepository;
    private caseControlRepository;
    getTimeEntriesByCaseControl(req: Request, res: Response): Promise<void>;
    getTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteTimeEntry(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTimeEntriesByUser(req: Request, res: Response): Promise<void>;
}
