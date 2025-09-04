import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../../config/database";
import { UserProfile } from "../../entities/UserProfile";
import { config } from "../../config/environment";
import { createError } from "../../middleware/errorHandler";
import { LoginDto, RegisterDto, AuthResponse } from "./auth.dto";

export class AuthService {
  private userRepository: Repository<UserProfile>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserProfile);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw createError("Invalid credentials", 401);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      throw createError("Invalid credentials", 401);
    }

    // Actualizar último login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generar tokens
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

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, fullName } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw createError("User already exists", 409);
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      roleName: "user", // rol por defecto
      isActive: true,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Generar tokens
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

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const jwtSecret = config.jwt.refreshSecret || "default-refresh-secret";
      const decoded = jwt.verify(refreshToken, jwtSecret) as {
        userId: string;
      };

      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, isActive: true },
      });

      if (!user) {
        throw createError("User not found", 404);
      }

      const newToken = this.generateToken(user.id);
      return { token: newToken };
    } catch (error) {
      throw createError("Invalid refresh token", 401);
    }
  }

  private generateToken(userId: string): string {
    const secret = config.jwt.secret || "default-secret";
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn || "24h",
    };

    return jwt.sign({ userId }, secret, options);
  }

  private generateRefreshToken(userId: string): string {
    const secret = config.jwt.refreshSecret || "default-refresh-secret";
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn || "7d",
    };

    return jwt.sign({ userId }, secret, options);
  }

  async validateToken(token: string): Promise<UserProfile | null> {
    try {
      const secret = config.jwt.secret || "default-secret";
      const decoded = jwt.verify(token, secret) as {
        userId: string;
      };

      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, isActive: true },
      });

      return user || null;
    } catch (error) {
      return null;
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ["id", "fullName", "email", "roleName"],
    });

    return users;
  }

  async updateUserRole(userId: string, roleName: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    user.roleName = roleName;
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    return user;
  }
}
