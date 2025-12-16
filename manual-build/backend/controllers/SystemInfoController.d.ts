import { Request, Response } from "express";
export interface SystemModule {
    name: string;
    version: string;
    description: string;
    features: string[];
    endpoints: string[];
    status: "active" | "maintenance" | "deprecated";
    permissions: string[];
}
export interface SystemInfo {
    version: string;
    name: string;
    description: string;
    buildDate: string;
    environment: string;
    modules: SystemModule[];
    stats: {
        totalModules: number;
        activeModules: number;
        totalEndpoints: number;
        uptime: number;
    };
}
export declare class SystemInfoController {
    getSystemInfo(req: Request, res: Response): Promise<void>;
    getVersion(req: Request, res: Response): Promise<void>;
    getModules(req: Request, res: Response): Promise<void>;
    getChangelog(req: Request, res: Response): Promise<void>;
    getStats(req: Request, res: Response): Promise<void>;
    private getPackageInfo;
    private getSystemModules;
    private getSystemStats;
}
