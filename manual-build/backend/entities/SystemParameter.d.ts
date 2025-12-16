import { UserProfile } from "./UserProfile";
export declare enum ParameterType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    JSON = "json",
    EMAIL = "email",
    URL = "url",
    PASSWORD = "password"
}
export declare enum ParameterCategory {
    SESSION = "session",
    EMAIL = "email",
    NOTIFICATIONS = "notifications",
    SECURITY = "security",
    SYSTEM = "system",
    FILES = "files",
    DASHBOARD = "dashboard",
    REPORTS = "reports"
}
export declare class SystemParameter {
    id: number;
    parameterKey: string;
    parameterCategory: ParameterCategory;
    parameterValue: string | null;
    parameterType: ParameterType;
    parameterDescription: string | null;
    isEncrypted: boolean;
    isRequired: boolean;
    defaultValue: string | null;
    validationRules: Record<string, any> | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    creator: UserProfile | null;
    updater: UserProfile | null;
    getParsedValue(): any;
    private getDefaultParsedValue;
    setParsedValue(value: any): void;
    validateValue(value: any): string[];
}
