import { Request, Response, NextFunction } from "express";
export declare class ArchiveController {
    private archiveService;
    constructor();
    getArchiveStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedItems(req: Request, res: Response, next: NextFunction): Promise<void>;
    archiveCase(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    archiveTodo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    restoreArchivedItem(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteArchivedTodo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteArchivedItem(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    searchArchivedItems(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const getArchiveStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getArchivedItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const archiveCase: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const archiveTodo: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const restoreArchivedItem: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteArchivedItem: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchArchivedItems: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
