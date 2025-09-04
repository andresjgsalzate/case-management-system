// Tipos para el sistema de casos mejorado
export interface Case {
  id: string;
  numeroCaso: string;
  descripcion: string;
  fecha: string;
  originId?: string;
  applicationId?: string;
  historialCaso: number;
  conocimientoModulo: number;
  manipulacionDatos: number;
  claridadDescripcion: number;
  causaFallo: number;
  puntuacion: number;
  clasificacion: CaseComplexity;
  estado: CaseStatus;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  assignedToId?: string;
  // Relaciones pobladas
  origin?: Origin;
  application?: Application;
}

export interface Origin {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Application {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export type CaseComplexity =
  | "Baja Complejidad"
  | "Media Complejidad"
  | "Alta Complejidad";

export type CaseStatus =
  | "nuevo"
  | "en_progreso"
  | "pendiente"
  | "resuelto"
  | "cerrado"
  | "cancelado";

// Opciones para el formulario de casos
export interface SelectOption {
  value: number;
  label: string;
}

export const HISTORIAL_CASO_OPTIONS: SelectOption[] = [
  { value: 1, label: "Error conocido y solucionado previamente" },
  { value: 2, label: "Error recurrente, no solucionado" },
  { value: 3, label: "Error desconocido, no solucionado" },
];

export const CONOCIMIENTO_MODULO_OPTIONS: SelectOption[] = [
  { value: 1, label: "Conoce módulo y función puntual" },
  { value: 2, label: "Conoce módulo, requiere capacitación" },
  { value: 3, label: "Desconoce módulo, requiere capacitación" },
];

export const MANIPULACION_DATOS_OPTIONS: SelectOption[] = [
  { value: 1, label: "Mínima o no necesaria" },
  { value: 2, label: "Intensiva, sin replicar lógica" },
  { value: 3, label: "Extremadamente compleja, replicar lógica" },
];

export const CLARIDAD_DESCRIPCION_OPTIONS: SelectOption[] = [
  { value: 1, label: "Descripción clara y precisa" },
  { value: 2, label: "Descripción ambigua o poco clara" },
  { value: 3, label: "Descripción confusa o inexacta" },
];

export const CAUSA_FALLO_OPTIONS: SelectOption[] = [
  { value: 1, label: "Error operativo, fácil solución" },
  { value: 2, label: "Falla puntual, requiere pruebas" },
  { value: 3, label: "Falla compleja, pruebas adicionales" },
];

export const ESTADO_CASO_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "pendiente", label: "Pendiente" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
  { value: "cancelado", label: "Cancelado" },
];
