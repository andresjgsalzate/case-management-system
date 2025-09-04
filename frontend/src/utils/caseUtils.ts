import type { CaseComplexity } from "../types/case";

/**
 * Clasifica un caso según su puntuación total
 * Umbrales: 1-6 Baja, 7-11 Media, 12-15 Alta
 */
export function clasificarCaso(puntuacion: number): CaseComplexity {
  if (puntuacion >= 12) return "Alta Complejidad";
  if (puntuacion >= 7) return "Media Complejidad";
  return "Baja Complejidad";
}

/**
 * Calcula la puntuación total de un caso (suma directa, no porcentaje)
 */
export function calcularPuntuacion(
  historialCaso: number,
  conocimientoModulo: number,
  manipulacionDatos: number,
  claridadDescripcion: number,
  causaFallo: number
): number {
  return (
    historialCaso +
    conocimientoModulo +
    manipulacionDatos +
    claridadDescripcion +
    causaFallo
  );
}

/**
 * Obtiene el color de la clasificación para Tailwind
 */
export function getComplexityColor(clasificacion: CaseComplexity): string {
  switch (clasificacion) {
    case "Baja Complejidad":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Media Complejidad":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Alta Complejidad":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Formatea una fecha para mostrar (DD/MM/AAAA)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Fecha no disponible";

  // Si es un string en formato YYYY-MM-DD, formatearlo directamente sin crear Date
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }

  // Para otros formatos, usar Date (timestamps, etc.)
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return "Fecha inválida";
  }

  // Formato DD/MM/AAAA
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha en formato YYYY-MM-DD sin problemas de zona horaria
 */
export function formatDateLocal(dateString: string): string {
  if (!dateString) return "Fecha no disponible";

  // Para fechas en formato YYYY-MM-DD, crearlas como fechas locales
  const [year, month, day] = dateString.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day); // month - 1 porque los meses empiezan en 0

  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return "Fecha inválida";
  }

  // Formato DD/MM/AAAA
  return `${day.toString().padStart(2, "0")}/${month
    .toString()
    .padStart(2, "0")}/${year}`;
}

export const getStatusColor = (estado: string): string => {
  switch (estado) {
    case "nuevo":
      return "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    case "en_progreso":
      return "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
    case "pendiente":
      return "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    case "resuelto":
      return "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    case "cerrado":
      return "text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    default:
      return "text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
  }
};
