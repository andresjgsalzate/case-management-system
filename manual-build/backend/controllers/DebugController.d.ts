import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare class DebugController {
    static inspectTables(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static testMetricsQueries(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static cleanupOrphanRecords(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
