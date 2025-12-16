"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const class_validator_1 = require("class-validator");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./auth.dto");
const errorHandler_1 = require("../../middleware/errorHandler");
class AuthController {
    constructor() {
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const loginDto = new auth_dto_1.LoginDto(req.body.email, req.body.password);
            const errors = await (0, class_validator_1.validate)(loginDto);
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
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const registerDto = new auth_dto_1.RegisterDto(req.body.email, req.body.password, req.body.fullName);
            const errors = await (0, class_validator_1.validate)(registerDto);
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
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        this.me = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
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
        this.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const users = await this.authService.getAllUsers();
            res.json({
                success: true,
                data: users,
            });
        });
        this.updateUserRole = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        this.getUserByEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        this.authService = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
