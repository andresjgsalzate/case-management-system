import { Request, Response } from "express";
export declare class TodoController {
    private todoService;
    constructor();
    getAllTodos(req: Request, res: Response): Promise<void>;
    getTodoById(req: Request, res: Response): Promise<void>;
    createTodo(req: Request, res: Response): Promise<void>;
    updateTodo(req: Request, res: Response): Promise<void>;
    deleteTodo(req: Request, res: Response): Promise<void>;
    completeTodo(req: Request, res: Response): Promise<void>;
    reactivateTodo(req: Request, res: Response): Promise<void>;
    archiveTodo(req: Request, res: Response): Promise<void>;
    getTodoMetrics(req: Request, res: Response): Promise<void>;
    getTodoPriorities(req: Request, res: Response): Promise<void>;
    startTimer(req: Request, res: Response): Promise<void>;
    pauseTimer(req: Request, res: Response): Promise<void>;
    getTodoTimeEntries(req: Request, res: Response): Promise<void>;
    addManualTimeEntry(req: Request, res: Response): Promise<void>;
    deleteTimeEntry(req: Request, res: Response): Promise<void>;
    getManualTimeEntries(req: Request, res: Response): Promise<void>;
    deleteManualTimeEntry(req: Request, res: Response): Promise<void>;
}
