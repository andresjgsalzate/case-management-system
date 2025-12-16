import { Request, Response, NextFunction } from "express";
export declare class DispositionController {
    private dispositionService;
    constructor();
    createDisposition(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllDispositions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDispositionById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateDisposition(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteDisposition(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAvailableYears(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMonthlyStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const createDisposition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllDispositions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getDispositionById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateDisposition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteDisposition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAvailableYears: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMonthlyStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
