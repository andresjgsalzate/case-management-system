import { RolePermission } from "./RolePermission";
export declare class Permission {
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
    scope: "own" | "team" | "all";
    isActive: boolean;
    rolePermissions: RolePermission[];
    createdAt: Date;
    updatedAt: Date;
}
