import { Role } from "./Role";
import { Permission } from "./Permission";
export declare class RolePermission {
    id: string;
    roleId: string;
    permissionId: string;
    role: Role;
    permission: Permission;
    createdAt: Date;
}
