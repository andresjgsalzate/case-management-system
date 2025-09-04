import { format } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "Fecha no válida";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Fecha no válida";
    return format(dateObj, "dd/MM/yyyy", { locale: es });
  } catch (error) {
    return "Fecha no válida";
  }
};

export const formatDateLocal = (
  date: Date | string | null | undefined,
  formatStr: string = "dd/MM/yyyy"
): string => {
  if (!date) return "Hora no válida";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Hora no válida";
    return format(dateObj, formatStr, { locale: es });
  } catch (error) {
    return "Hora no válida";
  }
};

export const formatTimeDetailed = (minutes: number): string => {
  if (minutes === 0 || isNaN(minutes)) return "0 min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "Fecha no válida";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Fecha no válida";
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: es });
  } catch (error) {
    return "Fecha no válida";
  }
};

export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return "Hora no válida";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Hora no válida";
    return format(dateObj, "HH:mm", { locale: es });
  } catch (error) {
    return "Hora no válida";
  }
};
