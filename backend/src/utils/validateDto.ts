import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  data: any
): Promise<ValidationResult<T>> {
  try {
    // Convertir datos planos a instancia de clase
    const dto = plainToClass(dtoClass, data);

    // Validar
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        if (error.constraints) {
          return Object.values(error.constraints).join(", ");
        }
        return `Error en el campo ${error.property}`;
      });

      return {
        isValid: false,
        errors: errorMessages,
      };
    }

    return {
      isValid: true,
      data: dto,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ["Error de validación interno"],
    };
  }
}
