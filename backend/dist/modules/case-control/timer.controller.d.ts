import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
export declare class TimerController {
    private caseControlRepository;
    private timeEntryRepository;
    constructor();
    startTimer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    stopTimer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    pauseTimer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getActiveTime(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
