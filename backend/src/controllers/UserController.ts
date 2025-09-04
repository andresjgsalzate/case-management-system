import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdatePasswordDto,
  UserFilterDto,
} from "../dto/user.dto";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Crear nuevo usuario
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const createUserDto = plainToClass(CreateUserDto, req.body);

      // Validar datos de entrada
      const errors = await validate(createUserDto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const user = await this.userService.createUser(createUserDto);

      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear usuario",
      });
    }
  }

  // Obtener usuario por ID
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener usuario",
      });
    }
  }

  // Actualizar usuario
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateUserDto = plainToClass(UpdateUserDto, req.body);

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      // Validar datos de entrada
      const errors = await validate(updateUserDto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const user = await this.userService.updateUser(id, updateUserDto);

      res.status(200).json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
      });
    }
  }

  // Eliminar usuario
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      await this.userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al eliminar usuario",
      });
    }
  }

  // Cambiar contraseña (usuario autenticado)
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const changePasswordDto = plainToClass(ChangePasswordDto, req.body);

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      // Validar datos de entrada
      const errors = await validate(changePasswordDto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      await this.userService.changePassword(id, changePasswordDto);

      res.status(200).json({
        success: true,
        message: "Contraseña cambiada exitosamente",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al cambiar contraseña",
      });
    }
  }

  // Actualizar contraseña (admin)
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatePasswordDto = plainToClass(UpdatePasswordDto, req.body);

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      // Validar datos de entrada
      const errors = await validate(updatePasswordDto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      await this.userService.updatePassword(id, updatePasswordDto);

      res.status(200).json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar contraseña",
      });
    }
  }

  // Listar usuarios con filtros y paginación
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const filterDto = plainToClass(UserFilterDto, req.query);

      // Validar parámetros de consulta
      const errors = await validate(filterDto);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Parámetros de consulta inválidos",
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const result = await this.userService.getUsers(filterDto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener usuarios",
      });
    }
  }

  // Cambiar estado activo/inactivo del usuario
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      const user = await this.userService.toggleUserStatus(id);

      res.status(200).json({
        success: true,
        message: `Usuario ${
          user.isActive ? "activado" : "desactivado"
        } exitosamente`,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al cambiar estado del usuario",
      });
    }
  }
}
