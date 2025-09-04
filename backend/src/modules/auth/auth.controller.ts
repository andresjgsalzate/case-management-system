import { Request, Response } from "express";
import { validate } from "class-validator";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { asyncHandler } from "../../middleware/errorHandler";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const loginDto = new LoginDto(req.body.email, req.body.password);

    const errors = await validate(loginDto);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    const result = await this.authService.login(loginDto);

    res.json({
      success: true,
      data: result,
    });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const registerDto = new RegisterDto(
      req.body.email,
      req.body.password,
      req.body.fullName
    );

    const errors = await validate(registerDto);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    const result = await this.authService.register(registerDto);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token is required",
      });
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    // El usuario viene del middleware de autenticación
    const user = (req as any).user;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleName: user.roleName,
      },
    });
  });

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.authService.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { roleName } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    if (!roleName) {
      return res.status(400).json({
        error: "roleName is required",
      });
    }

    const updatedUser = await this.authService.updateUserRole(userId, roleName);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        roleName: updatedUser.roleName,
      },
    });
  });

  getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: "email is required",
      });
    }

    const user = await this.authService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleName: user.roleName,
      },
    });
  });
}
