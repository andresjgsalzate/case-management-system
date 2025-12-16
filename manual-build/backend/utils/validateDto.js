"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = validateDto;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
async function validateDto(dtoClass, data) {
    try {
        const dto = (0, class_transformer_1.plainToClass)(dtoClass, data);
        const errors = await (0, class_validator_1.validate)(dto);
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
    }
    catch (error) {
        return {
            isValid: false,
            errors: ["Error de validación interno"],
        };
    }
}
