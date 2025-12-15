import { Request, Response } from "express";
export declare class AuthController {
    private authService;
    constructor();
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    me: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateUserRole: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserByEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
