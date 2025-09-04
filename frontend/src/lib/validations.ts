import { z } from "zod";

export const caseFormSchema = z.object({
  numeroCaso: z
    .string()
    .min(1, "El número de caso es requerido")
    .max(50, "El número de caso no puede exceder 50 caracteres"),
  descripcion: z
    .string()
    .min(1, "La descripción es requerida")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  fecha: z.string().min(1, "La fecha es requerida"),
  originId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  applicationId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  historialCaso: z
    .number()
    .min(1, "Debe seleccionar una opción")
    .max(3, "Valor inválido"),
  conocimientoModulo: z
    .number()
    .min(1, "Debe seleccionar una opción")
    .max(3, "Valor inválido"),
  manipulacionDatos: z
    .number()
    .min(1, "Debe seleccionar una opción")
    .max(3, "Valor inválido"),
  claridadDescripcion: z
    .number()
    .min(1, "Debe seleccionar una opción")
    .max(3, "Valor inválido"),
  causaFallo: z
    .number()
    .min(1, "Debe seleccionar una opción")
    .max(3, "Valor inválido"),
  estado: z
    .enum([
      "nuevo",
      "en_progreso",
      "pendiente",
      "resuelto",
      "cerrado",
      "cancelado",
    ])
    .default("nuevo"),
  observaciones: z
    .string()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

export type CaseFormSchema = z.infer<typeof caseFormSchema>;
