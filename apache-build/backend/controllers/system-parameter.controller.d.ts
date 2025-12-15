import { Request, Response } from "express";
import { SystemParameterService } from "../services/system-parameter.service";
export declare class SystemParameterController {
    private readonly systemParameterService;
    constructor(systemParameterService: SystemParameterService);
    getAllParameters(req: Request, res: Response): Promise<void>;
    getParametersByCategory(req: Request, res: Response): Promise<void>;
    getParameterByKey(req: Request, res: Response): Promise<void>;
    getParameterValue(req: Request, res: Response): Promise<void>;
    createParameter(req: Request, res: Response): Promise<void>;
    updateParameter(req: Request, res: Response): Promise<void>;
    setParameterValue(req: Request, res: Response): Promise<void>;
    deleteParameter(req: Request, res: Response): Promise<void>;
    getConfigByCategory(req: Request, res: Response): Promise<void>;
    validateConfiguration(req: Request, res: Response): Promise<void>;
    getConfigurationStats(req: Request, res: Response): Promise<void>;
    refreshCache(req: Request, res: Response): Promise<void>;
}
