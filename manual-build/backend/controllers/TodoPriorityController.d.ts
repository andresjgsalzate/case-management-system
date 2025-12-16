import { Request, Response } from "express";
export declare class TodoPriorityController {
    private getTodoPriorityRepository;
    getAllPriorities(req: Request, res: Response): Promise<void>;
    getPriorityStats(req: Request, res: Response): Promise<void>;
    getPriorityById(req: Request, res: Response): Promise<void>;
    createPriority(req: Request, res: Response): Promise<void>;
    updatePriority(req: Request, res: Response): Promise<void>;
    togglePriorityStatus(req: Request, res: Response): Promise<void>;
    deletePriority(req: Request, res: Response): Promise<void>;
    reorderPriorities(req: Request, res: Response): Promise<void>;
}
