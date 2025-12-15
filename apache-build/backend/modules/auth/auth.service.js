"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const UserProfile_1 = require("../../entities/UserProfile");
const environment_1 = require("../../config/environment");
const errorHandler_1 = require("../../middleware/errorHandler");
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email, isActive: true },
        });
        if (!user) {
            throw (0, errorHandler_1.createError)("Invalid credentials", 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password || "");
        if (!isPasswordValid) {
            throw (0, errorHandler_1.createError)("Invalid credentials", 401);
        }
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
        const token = this.generateToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                roleName: user.roleName,
            },
            token,
            refreshToken,
        };
    }
    async register(registerDto) {
        const { email, password, fullName } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw (0, errorHandler_1.createError)("User already exists", 409);
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const newUser = this.userRepository.create({
            email,
            password: hashedPassword,
            fullName,
            roleName: "user",
            isActive: true,
        });
        const savedUser = await this.userRepository.save(newUser);
        const token = this.generateToken(savedUser.id);
        const refreshToken = this.generateRefreshToken(savedUser.id);
        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                fullName: savedUser.fullName,
                roleName: savedUser.roleName,
            },
            token,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        try {
            const jwtSecret = environment_1.config.jwt.refreshSecret || "default-refresh-secret";
            const decoded = jsonwebtoken_1.default.verify(refreshToken, jwtSecret);
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId, isActive: true },
            });
            if (!user) {
                throw (0, errorHandler_1.createError)("User not found", 404);
            }
            const newToken = this.generateToken(user.id);
            return { token: newToken };
        }
        catch (error) {
            throw (0, errorHandler_1.createError)("Invalid refresh token", 401);
        }
    }
    generateToken(userId) {
        const secret = environment_1.config.jwt.secret || "default-secret";
        const options = {
            expiresIn: environment_1.config.jwt.expiresIn || "24h",
        };
        return jsonwebtoken_1.default.sign({ userId }, secret, options);
    }
    generateRefreshToken(userId) {
        const secret = environment_1.config.jwt.refreshSecret || "default-refresh-secret";
        const options = {
            expiresIn: environment_1.config.jwt.refreshExpiresIn || "7d",
        };
        return jsonwebtoken_1.default.sign({ userId }, secret, options);
    }
    async validateToken(token) {
        try {
            const secret = environment_1.config.jwt.secret || "default-secret";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            const user = await this.userRepository.findOne({
                where: { id: decoded.userId, isActive: true },
            });
            return user || null;
        }
        catch (error) {
            return null;
        }
    }
    async getAllUsers() {
        const users = await this.userRepository.find({
            where: { isActive: true },
            select: ["id", "fullName", "email", "roleName"],
        });
        return users;
    }
    async updateUserRole(userId, roleName) {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            throw (0, errorHandler_1.createError)("User not found", 404);
        }
        user.roleName = roleName;
        user.updatedAt = new Date();
        const updatedUser = await this.userRepository.save(user);
        return updatedUser;
    }
    async getUserByEmail(email) {
        const user = await this.userRepository.findOne({
            where: { email, isActive: true },
        });
        return user;
    }
}
exports.AuthService = AuthService;
