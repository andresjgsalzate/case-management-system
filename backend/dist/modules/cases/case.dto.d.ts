import { ClasificacionCase, EstadoCase } from "../../entities/Case";
export declare class CreateCaseDto {
    numeroCaso: string;
    descripcion: string;
    fecha: string;
    historialCaso: number;
    conocimientoModulo: number;
    manipulacionDatos: number;
    claridadDescripcion: number;
    causaFallo: number;
    originId?: string;
    applicationId?: string;
    observaciones?: string;
}
export declare class UpdateCaseDto {
    numeroCaso?: string;
    descripcion?: string;
    fecha?: string;
    historialCaso?: number;
    conocimientoModulo?: number;
    manipulacionDatos?: number;
    claridadDescripcion?: number;
    causaFallo?: number;
    originId?: string;
    applicationId?: string;
    observaciones?: string;
    estado?: EstadoCase;
    assignedToId?: string;
}
export declare class CaseFiltersDto {
    fecha?: string;
    clasificacion?: ClasificacionCase;
    originId?: string;
    applicationId?: string;
    busqueda?: string;
    estado?: EstadoCase;
}
export interface CaseResponse {
    id: string;
    numeroCaso: string;
    descripcion: string;
    fecha: string;
    historialCaso: number;
    conocimientoModulo: number;
    manipulacionDatos: number;
    claridadDescripcion: number;
    causaFallo: number;
    puntuacion: number;
    clasificacion: ClasificacionCase;
    estado: EstadoCase;
    observaciones?: string;
    originId?: string;
    applicationId?: string;
    userId?: string;
    assignedToId?: string;
    createdAt: string;
    updatedAt: string;
    origin?: {
        id: string;
        nombre: string;
        descripcion?: string;
    };
    application?: {
        id: string;
        nombre: string;
        descripcion?: string;
    };
    user?: {
        id: string;
        email: string;
        fullName?: string;
    };
    assignedTo?: {
        id: string;
        email: string;
        fullName?: string;
    };
}
