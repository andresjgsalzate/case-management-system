"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../config/database");
const UserProfile_1 = require("../entities/UserProfile");
const Role_1 = require("../entities/Role");
const bcrypt = __importStar(require("bcryptjs"));
class UserService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
    }
    async createUser(createUserDto) {
        try {
            const existingUser = await this.userRepository.findOne({
                where: { email: createUserDto.email },
            });
            if (existingUser) {
                throw new Error("El email ya está en uso");
            }
            let role = null;
            if (createUserDto.roleId) {
                role = await this.roleRepository.findOne({
                    where: { id: createUserDto.roleId },
                });
                if (!role) {
                    throw new Error("El rol especificado no existe");
                }
            }
            else if (createUserDto.roleName) {
                role = await this.roleRepository.findOne({
                    where: { name: createUserDto.roleName },
                });
                if (!role) {
                    throw new Error("El rol especificado no existe");
                }
            }
            else {
                role = await this.roleRepository.findOne({
                    where: { name: "Usuario" },
                });
                if (!role) {
                    throw new Error("Rol por defecto no encontrado");
                }
            }
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const user = this.userRepository.create({
                email: createUserDto.email,
                fullName: createUserDto.fullName,
                password: hashedPassword,
                roleId: role.id,
                roleName: role.name,
                isActive: createUserDto.isActive ?? true,
            });
            const savedUser = await this.userRepository.save(user);
            return this.mapToUserResponse(savedUser, role);
        }
        catch (error) {
            throw new Error(`Error al crear usuario: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async getUserById(id) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                relations: ["role"],
            });
            if (!user) {
                return null;
            }
            return this.mapToUserResponse(user);
        }
        catch (error) {
            throw new Error(`Error al obtener usuario: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async updateUser(id, updateUserDto) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                relations: ["role"],
            });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            if (updateUserDto.email && updateUserDto.email !== user.email) {
                const existingUser = await this.userRepository.findOne({
                    where: { email: updateUserDto.email },
                });
                if (existingUser) {
                    throw new Error("El email ya está en uso");
                }
            }
            let role = null;
            if (updateUserDto.roleId) {
                role = await this.roleRepository.findOne({
                    where: { id: updateUserDto.roleId },
                });
                if (!role) {
                    throw new Error("El rol especificado no existe");
                }
            }
            else if (updateUserDto.roleName) {
                role = await this.roleRepository.findOne({
                    where: { name: updateUserDto.roleName },
                });
                if (!role) {
                    throw new Error("El rol especificado no existe");
                }
            }
            if (updateUserDto.email)
                user.email = updateUserDto.email;
            if (updateUserDto.fullName)
                user.fullName = updateUserDto.fullName;
            if (updateUserDto.isActive !== undefined)
                user.isActive = updateUserDto.isActive;
            if (role) {
                user.roleId = role.id;
                user.roleName = role.name;
            }
            const updatedUser = await this.userRepository.save(user);
            return this.mapToUserResponse(updatedUser, role || user.role);
        }
        catch (error) {
            throw new Error(`Error al actualizar usuario: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async deleteUser(id) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            await this.userRepository.remove(user);
            return true;
        }
        catch (error) {
            throw new Error(`Error al eliminar usuario: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async changePassword(id, changePasswordDto) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            if (!user.password) {
                throw new Error("Usuario no tiene contraseña configurada");
            }
            const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error("Contraseña actual incorrecta");
            }
            const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
            user.password = hashedNewPassword;
            await this.userRepository.save(user);
            return true;
        }
        catch (error) {
            throw new Error(`Error al cambiar contraseña: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async updatePassword(id, updatePasswordDto) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            const hashedNewPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
            user.password = hashedNewPassword;
            await this.userRepository.save(user);
            return true;
        }
        catch (error) {
            throw new Error(`Error al actualizar contraseña: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async getUsers(filterDto) {
        try {
            const page = filterDto.page || 1;
            const limit = filterDto.limit || 10;
            const skip = (page - 1) * limit;
            let query = this.userRepository
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.role", "role");
            if (filterDto.search) {
                query = query.andWhere("(user.fullName ILIKE :search OR user.email ILIKE :search)", { search: `%${filterDto.search}%` });
            }
            if (filterDto.roleId) {
                query = query.andWhere("user.roleId = :roleId", {
                    roleId: filterDto.roleId,
                });
            }
            if (filterDto.roleName) {
                query = query.andWhere("user.roleName = :roleName", {
                    roleName: filterDto.roleName,
                });
            }
            if (filterDto.isActive !== undefined) {
                query = query.andWhere("user.isActive = :isActive", {
                    isActive: filterDto.isActive,
                });
            }
            const sortBy = filterDto.sortBy || "createdAt";
            const sortOrder = filterDto.sortOrder || "DESC";
            query = query.orderBy(`user.${sortBy}`, sortOrder);
            query = query.skip(skip).take(limit);
            const [users, total] = await query.getManyAndCount();
            const totalPages = Math.ceil(total / limit);
            const userResponses = users.map((user) => this.mapToUserResponse(user));
            return {
                users: userResponses,
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (error) {
            throw new Error(`Error al obtener usuarios: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async toggleUserStatus(id) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                relations: ["role"],
            });
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
            user.isActive = !user.isActive;
            const updatedUser = await this.userRepository.save(user);
            return this.mapToUserResponse(updatedUser);
        }
        catch (error) {
            throw new Error(`Error al cambiar estado del usuario: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    mapToUserResponse(user, role) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName || "",
            roleId: user.roleId,
            roleName: user.roleName || "Sin rol",
            isActive: user.isActive || true,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: role || user.role
                ? {
                    id: (role || user.role)?.id || "",
                    name: (role || user.role)?.name || user.roleName || "Sin rol",
                    description: (role || user.role)?.description,
                }
                : undefined,
        };
    }
}
exports.UserService = UserService;
