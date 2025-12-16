export declare class CreateUserDto {
    email: string;
    fullName: string;
    password: string;
    roleId?: string;
    roleName?: string;
    isActive?: boolean;
}
export declare class UpdateUserDto {
    email?: string;
    fullName?: string;
    roleId?: string;
    roleName?: string;
    isActive?: boolean;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdatePasswordDto {
    newPassword: string;
}
export declare class UserFilterDto {
    search?: string;
    roleId?: string;
    roleName?: string;
    isActive?: boolean;
    sortBy?: "createdAt" | "fullName" | "email" | "lastLoginAt";
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    fullName: string;
    roleId?: string;
    roleName: string;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    role?: {
        id: string;
        name: string;
        description?: string;
    };
}
export declare class UserListResponseDto {
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
