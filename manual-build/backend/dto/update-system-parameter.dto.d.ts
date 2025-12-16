import { ParameterCategory, ParameterType } from "../entities/SystemParameter";
export declare class UpdateSystemParameterDto {
    parameterKey?: string;
    parameterCategory?: ParameterCategory;
    parameterValue?: string;
    parameterType?: ParameterType;
    parameterDescription?: string;
    isEncrypted?: boolean;
    isRequired?: boolean;
    defaultValue?: string;
    validationRules?: Record<string, any>;
    isActive?: boolean;
}
