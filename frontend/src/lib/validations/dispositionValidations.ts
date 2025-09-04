import { z } from "zod";

// Schema para crear/editar disposiciones
export const dispositionSchema = z.object({
  date: z
    .string()
    .min(1, "La fecha es requerida")
    .refine((date: string) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin del día actual
      return selectedDate <= today;
    }, "La fecha no puede ser futura"),

  caseNumber: z
    .string()
    .min(1, "Debe ingresar un número de caso válido")
    .regex(
      /^[A-Za-z0-9-_]+$/,
      "El número de caso solo puede contener letras, números, guiones y guiones bajos"
    ),

  caseId: z.string().optional(), // Opcional: se obtiene automáticamente del número de caso

  scriptName: z
    .string()
    .min(1, "El nombre del script es requerido")
    .max(100, "El nombre del script no puede exceder 100 caracteres"),

  svnRevisionNumber: z
    .string()
    .max(50, "El número de revisión SVN no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),

  applicationId: z.string().min(1, "Debe seleccionar una aplicación"),

  observations: z
    .string()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

// Schema para filtros de disposiciones
export const dispositionFiltersSchema = z.object({
  year: z.number().optional(),
  month: z.number().min(1).max(12).optional(),
  applicationId: z.string().optional(),
  caseNumber: z.string().optional(),
  search: z.string().optional(),
});

// Tipos inferidos de los schemas
export type DispositionFormData = z.infer<typeof dispositionSchema>;
export type DispositionFiltersData = z.infer<typeof dispositionFiltersSchema>;
