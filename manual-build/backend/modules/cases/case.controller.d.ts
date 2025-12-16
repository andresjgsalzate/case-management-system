import { Request, Response, NextFunction } from "express";
export declare class CaseController {
    private caseService;
    constructor();
    createCase(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCases(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCaseById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateCase(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteCase(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCaseStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const createCase: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCases: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCaseById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCase: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCase: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCaseStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
