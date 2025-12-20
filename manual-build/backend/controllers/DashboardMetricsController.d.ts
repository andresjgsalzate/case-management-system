import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare class DashboardMetricsController {
    private static verifyMetricPermissions;
    private static getUserWithPermissions;
    static getGeneralMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getTimeMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getUserTimeMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getCaseTimeMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getStatusMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getApplicationMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getPerformanceMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getDashboardStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
