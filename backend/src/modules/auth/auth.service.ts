import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../../config/database";
import { UserProfile } from "../../entities/UserProfile";
import { Role } from "../../entities/Role";
import { config } from "../../config/environment";
import { createError } from "../../middleware/errorHandler";
import { LoginDto, RegisterDto, AuthResponse } from "./auth.dto";
import { SessionService, SessionInfo } from "../../services/session.service";

// ID fijo del rol "Usuario" para nuevos registros
const DEFAULT_USER_ROLE_ID = "00000000-0000-0000-0000-000000000002";

export class AuthService {
  private userRepository: Repository<UserProfile>;
  private roleRepository: Repository<Role>;
  private sessionService: SessionService;

  constructor() {
    console.log(
      "🔍 AuthService constructor - AppDataSource initialized:",
      AppDataSource.isInitialized,
    );
    try {
      this.userRepository = AppDataSource.getRepository(UserProfile);
      this.roleRepository = AppDataSource.getRepository(Role);
      this.sessionService = new SessionService();
    } catch (error) {
      console.error("❌ Error in AuthService constructor:", error);
      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
    sessionInfo?: SessionInfo,
  ): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw createError("Correo electrónico o contraseña incorrectos", 401);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      throw createError("Correo electrónico o contraseña incorrectos", 401);
    }

    // Actualizar último login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generar tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Crear sesión única (esto invalidará todas las sesiones anteriores)
    await this.sessionService.createUniqueSession(
      user.id,
      token,
      refreshToken,
      sessionInfo || {},
    );

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
      throw createError("El correo electrónico ya está registrado", 409);
    }

    // Buscar el rol "Usuario" por defecto
    const defaultRole = await this.roleRepository.findOne({
      where: { id: DEFAULT_USER_ROLE_ID },
    });

    if (!defaultRole) {
      console.error(
        "❌ Rol 'Usuario' no encontrado. Ejecute la migración add_usuario_role.sql",
      );
      throw createError(
        "Error de configuración del sistema. Contacte al administrador.",
        500,
      );
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario con el rol "Usuario" asignado
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      roleId: defaultRole.id,
      roleName: defaultRole.name,
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

      // Actualizar el token en la sesión existente
      const updatedSession = await this.sessionService.updateSessionToken(
        refreshToken,
        newToken,
      );

      if (!updatedSession) {
        console.warn(
          "⚠️ No se pudo actualizar la sesión, puede que haya expirado",
        );
        // Aunque no se encontró/actualizó la sesión, devolvemos el token
        // El próximo request validará si la sesión existe
      }

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

      // Primero verificar si el token está en una sesión activa
      const activeSession =
        await this.sessionService.validateActiveSession(token);
      if (!activeSession) {
        return null; // Token no está en una sesión activa o la sesión expiró
      }

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

  /**
   * Cerrar sesión del usuario (invalida la sesión actual)
   */
  async logout(token: string): Promise<void> {
    const activeSession =
      await this.sessionService.validateActiveSession(token);
    if (activeSession) {
      await this.sessionService.invalidateSession(activeSession.id, "manual");
    }
  }

  /**
   * Cerrar todas las sesiones del usuario (útil para forzar logout global)
   */
  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionService.invalidateAllUserSessions(userId, "forced");
  }

  /**
   * Obtener sesiones activas de un usuario (para administración)
   */
  async getUserActiveSessions(userId: string) {
    return this.sessionService.getUserActiveSessions(userId);
  }
}
