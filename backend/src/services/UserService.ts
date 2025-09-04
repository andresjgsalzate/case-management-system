import { AppDataSource } from "../config/database";
import { UserProfile } from "../entities/UserProfile";
import { Role } from "../entities/Role";
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdatePasswordDto,
  UserFilterDto,
  UserResponseDto,
  UserListResponseDto,
} from "../dto/user.dto";
import * as bcrypt from "bcryptjs";
import { Repository, SelectQueryBuilder } from "typeorm";

export class UserService {
  private userRepository: Repository<UserProfile>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserProfile);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new Error("El email ya está en uso");
      }

      // Verificar que el rol existe si se proporciona
      let role: Role | null = null;
      if (createUserDto.roleId) {
        role = await this.roleRepository.findOne({
          where: { id: createUserDto.roleId },
        });
        if (!role) {
          throw new Error("El rol especificado no existe");
        }
      } else if (createUserDto.roleName) {
        role = await this.roleRepository.findOne({
          where: { name: createUserDto.roleName },
        });
        if (!role) {
          throw new Error("El rol especificado no existe");
        }
      } else {
        // Asignar rol por defecto (Usuario)
        role = await this.roleRepository.findOne({
          where: { name: "Usuario" },
        });
        if (!role) {
          throw new Error("Rol por defecto no encontrado");
        }
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Crear usuario
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
    } catch (error) {
      throw new Error(
        `Error al crear usuario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["role"],
      });

      if (!user) {
        return null;
      }

      return this.mapToUserResponse(user);
    } catch (error) {
      throw new Error(
        `Error al obtener usuario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["role"],
      });

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Verificar email único si se está actualizando
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (existingUser) {
          throw new Error("El email ya está en uso");
        }
      }

      // Verificar rol si se está actualizando
      let role: Role | null = null;
      if (updateUserDto.roleId) {
        role = await this.roleRepository.findOne({
          where: { id: updateUserDto.roleId },
        });
        if (!role) {
          throw new Error("El rol especificado no existe");
        }
      } else if (updateUserDto.roleName) {
        role = await this.roleRepository.findOne({
          where: { name: updateUserDto.roleName },
        });
        if (!role) {
          throw new Error("El rol especificado no existe");
        }
      }

      // Actualizar campos
      if (updateUserDto.email) user.email = updateUserDto.email;
      if (updateUserDto.fullName) user.fullName = updateUserDto.fullName;
      if (updateUserDto.isActive !== undefined)
        user.isActive = updateUserDto.isActive;

      if (role) {
        user.roleId = role.id;
        user.roleName = role.name;
      }

      const updatedUser = await this.userRepository.save(user);
      return this.mapToUserResponse(updatedUser, role || user.role);
    } catch (error) {
      throw new Error(
        `Error al actualizar usuario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      await this.userRepository.remove(user);
      return true;
    } catch (error) {
      throw new Error(
        `Error al eliminar usuario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      if (!user.password) {
        throw new Error("Usuario no tiene contraseña configurada");
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Contraseña actual incorrecta");
      }

      // Encriptar nueva contraseña
      const hashedNewPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10
      );
      user.password = hashedNewPassword;

      await this.userRepository.save(user);
      return true;
    } catch (error) {
      throw new Error(
        `Error al cambiar contraseña: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Encriptar nueva contraseña
      const hashedNewPassword = await bcrypt.hash(
        updatePasswordDto.newPassword,
        10
      );
      user.password = hashedNewPassword;

      await this.userRepository.save(user);
      return true;
    } catch (error) {
      throw new Error(
        `Error al actualizar contraseña: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async getUsers(filterDto: UserFilterDto): Promise<UserListResponseDto> {
    try {
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 10;
      const skip = (page - 1) * limit;

      let query: SelectQueryBuilder<UserProfile> = this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.role", "role");

      // Aplicar filtros
      if (filterDto.search) {
        query = query.andWhere(
          "(user.fullName ILIKE :search OR user.email ILIKE :search)",
          { search: `%${filterDto.search}%` }
        );
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

      // Aplicar ordenamiento
      const sortBy = filterDto.sortBy || "createdAt";
      const sortOrder = filterDto.sortOrder || "DESC";
      query = query.orderBy(`user.${sortBy}`, sortOrder);

      // Aplicar paginación
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
    } catch (error) {
      throw new Error(
        `Error al obtener usuarios: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  async toggleUserStatus(id: string): Promise<UserResponseDto> {
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
    } catch (error) {
      throw new Error(
        `Error al cambiar estado del usuario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  private mapToUserResponse(user: UserProfile, role?: Role): UserResponseDto {
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
      role:
        role || user.role
          ? {
              id: (role || user.role)?.id || "",
              name: (role || user.role)?.name || user.roleName || "Sin rol",
              description: (role || user.role)?.description,
            }
          : undefined,
    };
  }
}
