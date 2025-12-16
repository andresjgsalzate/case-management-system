import { UserProfile } from "./UserProfile";
import { Application } from "./Application";
import { Origin } from "./Origin";
export declare enum ClasificacionCase {
    BAJA = "Baja Complejidad",
    MEDIA = "Media Complejidad",
    ALTA = "Alta Complejidad"
}
export declare enum EstadoCase {
    NUEVO = "nuevo",
    ASIGNADO = "asignado",
    EN_PROGRESO = "en_progreso",
    PENDIENTE = "pendiente",
    RESUELTO = "resuelto",
    CERRADO = "cerrado",
    CANCELADO = "cancelado",
    RESTAURADO = "restaurado"
}
export declare class Case {
    id: string;
    numeroCaso: string;
    descripcion: string;
    fecha: Date;
    historialCaso: number;
    conocimientoModulo: number;
    manipulacionDatos: number;
    claridadDescripcion: number;
    causaFallo: number;
    puntuacion: number;
    clasificacion: ClasificacionCase;
    estado: EstadoCase;
    observaciones?: string;
    fechaVencimiento?: Date;
    fechaResolucion?: Date;
    userId?: string;
    user?: UserProfile;
    assignedToId?: string;
    assignedTo?: UserProfile;
    applicationId?: string;
    application?: Application;
    originId?: string;
    origin?: Origin;
    createdAt: Date;
    updatedAt: Date;
    calculateScoring(): void;
    private calcularPuntuacion;
    private clasificarCaso;
}
