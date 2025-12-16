import { Request, Response } from "express";
export declare class NoteController {
    private noteService;
    constructor();
    getAllNotes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createNote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getNotesStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateNote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteNote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    toggleArchiveNote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
