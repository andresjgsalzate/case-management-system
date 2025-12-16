import { Case } from "./Case";
export declare class Application {
    id: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    cases: Case[];
}
