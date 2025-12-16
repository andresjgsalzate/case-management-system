import { UserProfile } from "./UserProfile";
import { RolePermission } from "./RolePermission";
export declare class Role {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userProfiles: UserProfile[];
    rolePermissions: RolePermission[];
}
