import { Case } from "./Case";
export declare class Origin {
    id: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    cases: Case[];
}
