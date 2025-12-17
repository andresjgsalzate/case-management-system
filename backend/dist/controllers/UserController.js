"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const user_dto_1 = require("../dto/user.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UserController {
    constructor() {
        this.userService = new UserService_1.UserService();
    }
    async createUser(req, res) {
        try {
            const createUserDto = (0, class_transformer_1.plainToClass)(user_dto_1.CreateUserDto, req.body);
            const errors = await (0, class_validator_1.validate)(createUserDto);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al crear usuario",
            });
        }
    }
    async getUserById(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al obtener usuario",
            });
        }
    }
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateUserDto = (0, class_transformer_1.plainToClass)(user_dto_1.UpdateUserDto, req.body);
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "ID de usuario requerido",
                });
                return;
            }
            const errors = await (0, class_validator_1.validate)(updateUserDto);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Error al actualizar usuario",
            });
        }
    }
    async deleteUser(req, res) {
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al eliminar usuario",
            });
        }
    }
    async changePassword(req, res) {
        try {
            const { id } = req.params;
            const changePasswordDto = (0, class_transformer_1.plainToClass)(user_dto_1.ChangePasswordDto, req.body);
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "ID de usuario requerido",
                });
                return;
            }
            const errors = await (0, class_validator_1.validate)(changePasswordDto);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Error al cambiar contraseña",
            });
        }
    }
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const updatePasswordDto = (0, class_transformer_1.plainToClass)(user_dto_1.UpdatePasswordDto, req.body);
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "ID de usuario requerido",
                });
                return;
            }
            const errors = await (0, class_validator_1.validate)(updatePasswordDto);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Error al actualizar contraseña",
            });
        }
    }
    async getUsers(req, res) {
        try {
            const filterDto = (0, class_transformer_1.plainToClass)(user_dto_1.UserFilterDto, req.query);
            const errors = await (0, class_validator_1.validate)(filterDto);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Error al obtener usuarios",
            });
        }
    }
    async toggleUserStatus(req, res) {
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
                message: `Usuario ${user.isActive ? "activado" : "desactivado"} exitosamente`,
                data: user,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Error al cambiar estado del usuario",
            });
        }
    }
}
exports.UserController = UserController;
