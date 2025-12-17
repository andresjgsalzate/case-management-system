export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors?: string[];
}
export declare function validateDto<T extends object>(dtoClass: new () => T, data: any): Promise<ValidationResult<T>>;
