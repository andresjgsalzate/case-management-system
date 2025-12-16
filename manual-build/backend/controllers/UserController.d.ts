import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
}
export declare class UserController {
    private userService;
    constructor();
    createUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
    updatePassword(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    toggleUserStatus(req: Request, res: Response): Promise<void>;
}
export {};
