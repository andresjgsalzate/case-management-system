import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { CaseControl, TimeEntry, ManualTimeEntry } from "../types/caseControl";
import {
  getCaseControls,
  getTimeEntries,
  getManualTimeEntries,
} from "../services/api/caseControlApi";

type NotificationFn = (message: string) => void;

/**
 * Formatea una fecha preservando el día exacto de la base de datos.
 * Evita problemas de timezone que pueden alterar el día.
 * Extrae directamente los componentes de la fecha del string ISO.
 */
function formatDatePreservingDay(dateValue: string | Date): string {
  if (!dateValue) return "N/A";

  try {
    // Si es un string ISO (ej: "2025-12-17T05:00:00.000Z" o "2025-12-17")
    const dateStr =
      typeof dateValue === "string" ? dateValue : dateValue.toISOString();

    // Extraer directamente año, mes, día del string ISO sin conversión de timezone
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      // Formato dd/mm/yyyy
      return `${day}/${month}/${year}`;
    }

    // Fallback: usar toLocaleDateString pero con UTC
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { timeZone: "UTC" });
  } catch {
    return "N/A";
  }
}

// Tipo flexible para casos que acepta diferentes estructuras
interface FlexibleCase {
  id: string;
  numeroCaso: string;
  descripcion?: string;
  fecha: string;
  historialCaso?: number;
  conocimientoModulo?: number;
  manipulacionDatos?: number;
  claridadDescripcion?: number;
  causaFallo?: number;
  puntuacion?: number;
  clasificacion?: string;
  estado?: string;
  createdAt: string;
  // Relaciones - estructura flexible
  origin?: {
    nombre?: string;
  };
  application?: {
    nombre?: string;
  };
}

/**
 * Exporta una lista de casos a un archivo Excel
 */
export const exportCasesToExcel = (
  cases: FlexibleCase[],
  filename: string = "casos.xlsx",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para el Excel
    const excelData = cases.map((caso) => ({
      "Número de Caso": caso.numeroCaso,
      Descripción: caso.descripcion || "N/A",
      Origen: caso.origin?.nombre || "No especificado",
      Aplicación: caso.application?.nombre || "No especificado",
      "Historial del Caso": getHistorialCasoText(caso.historialCaso),
      "Conocimiento del Módulo": getConocimientoModuloText(
        caso.conocimientoModulo
      ),
      "Manipulación de Datos": getManipulacionDatosText(caso.manipulacionDatos),
      "Claridad de Descripción": getClaridadDescripcionText(
        caso.claridadDescripcion
      ),
      "Causa del Fallo": getCausaFalloText(caso.causaFallo),
      "Puntuación Total": caso.puntuacion || 0,
      Clasificación: caso.clasificacion || "N/A",
      Estado: caso.estado || "N/A",
      "Fecha de Creación": formatDatePreservingDay(caso.createdAt),
    }));

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Casos");

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 15 }, // Número de Caso
      { wch: 40 }, // Descripción
      { wch: 20 }, // Origen
      { wch: 20 }, // Aplicación
      { wch: 25 }, // Historial del Caso
      { wch: 25 }, // Conocimiento del Módulo
      { wch: 25 }, // Manipulación de Datos
      { wch: 25 }, // Claridad de Descripción
      { wch: 25 }, // Causa del Fallo
      { wch: 12 }, // Puntuación Total
      { wch: 15 }, // Clasificación
      { wch: 15 }, // Estado
      { wch: 15 }, // Fecha de Creación
    ];

    worksheet["!cols"] = columnWidths;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);

    // Mostrar notificación de éxito
    if (onSuccess) {
      onSuccess(`✅ ${cases.length} casos exportados a Excel exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar casos a Excel");
    }
  }
};

/**
 * Exporta una lista de casos a un archivo CSV
 */
export const exportCasesToCSV = (
  cases: FlexibleCase[],
  filename: string = "casos.csv",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para CSV
    const csvData = cases.map((caso) => ({
      "Numero de Caso": caso.numeroCaso,
      Descripcion: (caso.descripcion || "").replace(/["\n\r]/g, " "), // Limpiar caracteres problemáticos
      Origen: caso.origin?.nombre || "No especificado",
      Aplicacion: caso.application?.nombre || "No especificado",
      "Historial del Caso": getHistorialCasoText(caso.historialCaso),
      "Conocimiento del Modulo": getConocimientoModuloText(
        caso.conocimientoModulo
      ),
      "Manipulacion de Datos": getManipulacionDatosText(caso.manipulacionDatos),
      "Claridad de Descripcion": getClaridadDescripcionText(
        caso.claridadDescripcion
      ),
      "Causa del Fallo": getCausaFalloText(caso.causaFallo),
      "Puntuacion Total": caso.puntuacion || 0,
      Clasificacion: caso.clasificacion || "N/A",
      Estado: caso.estado || "N/A",
      "Fecha de Creacion": formatDatePreservingDay(caso.createdAt),
    }));

    // Crear encabezados
    const headers = Object.keys(csvData[0] || {});

    // Convertir datos a CSV
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escapar comillas y comas
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);

    if (onSuccess) {
      onSuccess(`✅ ${cases.length} casos exportados a CSV exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar a CSV:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar casos a CSV");
    }
  }
};

/**
 * Funciones auxiliares para formatear los valores de los casos
 */
function getHistorialCasoText(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  const options = [
    "Nuevo caso",
    "Caso recurrente conocido",
    "Caso recurrente - nueva manifestación",
  ];
  return options[value] || "N/A";
}

function getConocimientoModuloText(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  const options = [
    "Sin conocimiento",
    "Conocimiento básico",
    "Conocimiento avanzado",
  ];
  return options[value] || "N/A";
}

function getManipulacionDatosText(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  const options = [
    "Sin manipulación",
    "Manipulación básica",
    "Manipulación compleja",
  ];
  return options[value] || "N/A";
}

function getClaridadDescripcionText(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  const options = ["Muy confusa", "Poco clara", "Clara", "Muy clara"];
  return options[value] || "N/A";
}

function getCausaFalloText(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  const options = [
    "Error de usuario",
    "Error del sistema",
    "Funcionalidad faltante",
    "Error de datos",
    "Error de configuración",
  ];
  return options[value] || "N/A";
}

/**
 * Exporta un reporte completo de control de casos con información de tiempo
 */
export const exportCaseControlReport = (
  caseControls: CaseControl[],
  timeEntries: TimeEntry[],
  manualTimeEntries: ManualTimeEntry[],
  filename: string = "reporte-control-casos.xlsx",
  onSuccess?: NotificationFn
) => {
  try {
    // Crear un mapa para agrupar por caso y día
    const reportData: { [key: string]: any } = {};

    // Función helper para crear entradas del reporte
    function createReportEntry(caseControl: CaseControl, date: string) {
      return {
        numeroCaso: caseControl.case?.numeroCaso || "N/A",
        descripcionCaso: caseControl.case?.descripcion || "Sin descripción",
        fecha: date,
        tiempoTimer: 0,
        tiempoManual: 0,
        tiempoTotal: 0,
        descripcionTimer: "", // Nueva columna para descripción de actividades timer
        descripcionManual: "", // Nueva columna para descripción de actividades manual
        estado: caseControl.status?.name || "N/A",
        usuarioAsignado: caseControl.user?.fullName || "N/A",
        aplicacion: caseControl.case?.aplicacion?.nombre || "N/A",
        fechaAsignacion: caseControl.assignedAt
          ? new Date(caseControl.assignedAt).toLocaleDateString("es-ES")
          : "N/A",
        fechaInicio: caseControl.startedAt
          ? new Date(caseControl.startedAt).toLocaleDateString("es-ES")
          : "N/A",
        fechaCompletado: caseControl.completedAt
          ? new Date(caseControl.completedAt).toLocaleDateString("es-ES")
          : "N/A",
      };
    }

    // No crear entradas base, solo procesaremos las entradas reales de tiempo

    // Procesar time entries - agrupa por caso y fecha
    timeEntries.forEach((entry) => {
      const caseControl = caseControls.find(
        (cc) => cc.id === entry.caseControlId
      );
      if (!caseControl) return;

      const date = entry.startTime
        ? new Date(entry.startTime).toISOString().split("T")[0]
        : "Sin fecha";
      const key = `${caseControl.case?.numeroCaso || "N/A"}-${
        caseControl.id
      }-${date}`;

      if (!reportData[key]) {
        reportData[key] = createReportEntry(caseControl, date);
      }

      const durationToAdd = entry.durationMinutes || 0;
      const description = entry.description || "";

      // Sumar duración al tiempo del timer
      reportData[key].tiempoTimer =
        (reportData[key].tiempoTimer || 0) + durationToAdd;

      // Agregar descripción (concatenar si hay múltiples entradas)
      if (description.trim()) {
        const existingDesc = reportData[key].descripcionTimer;
        if (existingDesc) {
          reportData[key].descripcionTimer = `${existingDesc} | ${description}`;
        } else {
          reportData[key].descripcionTimer = description;
        }
      }
    });

    // Procesar manual time entries - agrupa por caso y fecha
    manualTimeEntries.forEach((entry) => {
      const caseControl = caseControls.find(
        (cc) => cc.id === entry.caseControlId
      );
      if (!caseControl) return;

      const date = entry.date;
      const key = `${caseControl.case?.numeroCaso || "N/A"}-${
        caseControl.id
      }-${date}`;

      if (!reportData[key]) {
        reportData[key] = createReportEntry(caseControl, date);
      }

      const durationToAdd = entry.durationMinutes || 0;
      const description = entry.description || "";

      reportData[key].tiempoManual += durationToAdd;

      // Agregar descripción manual (concatenar si hay múltiples entradas)
      if (description.trim()) {
        const existingDesc = reportData[key].descripcionManual;
        if (existingDesc) {
          reportData[
            key
          ].descripcionManual = `${existingDesc} | ${description}`;
        } else {
          reportData[key].descripcionManual = description;
        }
      }
    });

    // Calcular tiempo total y convertir a formato Excel
    const excelData = Object.values(reportData).map((entry: any) => {
      entry.tiempoTotal = entry.tiempoTimer + entry.tiempoManual;

      return {
        "Número de Caso": entry.numeroCaso,
        "Descripción del Caso": entry.descripcionCaso,
        Fecha: entry.fecha,
        "Tiempo Timer (Horas)": Number((entry.tiempoTimer / 60).toFixed(2)),
        "Tiempo Manual (Horas)": Number((entry.tiempoManual / 60).toFixed(2)),
        "Tiempo Total (Horas)": Number((entry.tiempoTotal / 60).toFixed(2)),
        "Tiempo Timer (Minutos)": entry.tiempoTimer,
        "Tiempo Manual (Minutos)": entry.tiempoManual,
        "Tiempo Total (Minutos)": entry.tiempoTotal,
        "Descripción Actividades Timer":
          entry.descripcionTimer || "Sin descripción",
        "Descripción Actividades Manual":
          entry.descripcionManual || "Sin descripción",
        Estado: entry.estado,
        "Usuario Asignado": entry.usuarioAsignado,
        Aplicación: entry.aplicacion,
        "Fecha de Asignación": entry.fechaAsignacion,
        "Fecha de Inicio": entry.fechaInicio,
        "Fecha de Completado": entry.fechaCompletado,
      };
    });

    // Ordenar por número de caso y fecha
    excelData.sort((a, b) => {
      const caseCompare = a["Número de Caso"].localeCompare(
        b["Número de Caso"]
      );
      if (caseCompare !== 0) return caseCompare;
      return new Date(a["Fecha"]).getTime() - new Date(b["Fecha"]).getTime();
    });

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Control Casos");

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 15 }, // Número de Caso
      { wch: 40 }, // Descripción del Caso
      { wch: 12 }, // Fecha
      { wch: 18 }, // Tiempo Timer (Horas)
      { wch: 18 }, // Tiempo Manual (Horas)
      { wch: 18 }, // Tiempo Total (Horas)
      { wch: 18 }, // Tiempo Timer (Minutos)
      { wch: 18 }, // Tiempo Manual (Minutos)
      { wch: 18 }, // Tiempo Total (Minutos)
      { wch: 50 }, // Descripción Actividades Timer
      { wch: 50 }, // Descripción Actividades Manual
      { wch: 15 }, // Estado
      { wch: 20 }, // Usuario Asignado
      { wch: 20 }, // Aplicación
      { wch: 18 }, // Fecha de Asignación
      { wch: 18 }, // Fecha de Inicio
      { wch: 18 }, // Fecha de Completado
    ];

    worksheet["!cols"] = columnWidths;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);

    // Mostrar notificación de éxito
    if (onSuccess) {
      onSuccess("✅ Reporte de control de casos generado exitosamente");
    }
  } catch (error) {
    console.error("Error al generar reporte de control de casos:", error);
    if (onSuccess) {
      onSuccess("❌ Error al generar reporte de control de casos");
    }
  }
};

/**
 * Versión async que obtiene los datos de la API y genera el reporte
 */
export const generateCaseControlReport = async (
  filename: string = "reporte-control-casos.xlsx",
  onSuccess?: NotificationFn,
  onError?: NotificationFn
) => {
  try {
    // Primero obtener todos los case controls
    const caseControls = await getCaseControls();

    // Luego obtener time entries para cada case control en paralelo
    const timeEntriesPromises = caseControls.map((caseControl) =>
      getTimeEntries(caseControl.id).catch(() => [])
    );

    const manualTimeEntriesPromises = caseControls.map((caseControl) =>
      getManualTimeEntries(caseControl.id).catch(() => [])
    );

    // Esperar a que todas las peticiones se completen
    const [timeEntriesArrays, manualTimeEntriesArrays] = await Promise.all([
      Promise.all(timeEntriesPromises),
      Promise.all(manualTimeEntriesPromises),
    ]);

    // Aplanar los arrays
    const timeEntries = timeEntriesArrays.flat();
    const manualTimeEntries = manualTimeEntriesArrays.flat();

    // Generar el reporte con los datos obtenidos
    exportCaseControlReport(
      caseControls,
      timeEntries,
      manualTimeEntries,
      filename,
      onSuccess
    );
  } catch (error) {
    console.error("Error al obtener datos para el reporte:", error);
    if (onError) {
      onError("❌ Error al obtener datos para el reporte");
    }
  }
};

// =====================================================
// EXPORTACIÓN DE TODOS
// =====================================================

// Tipo flexible para TODOs que acepta diferentes estructuras
interface FlexibleTodo {
  id: string;
  title: string;
  description?: string;
  priorityId: string;
  assignedUserId?: string;
  createdByUserId: string;
  dueDate?: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  priority?: {
    name?: string;
    level?: number;
    color?: string;
  };
  assignedUser?: {
    fullName?: string;
    email?: string;
  };
  createdByUser?: {
    fullName?: string;
    email?: string;
  };
  control?: {
    totalTimeMinutes?: number;
    isTimerActive?: boolean;
    status?: {
      name?: string;
    };
  };
}

/**
 * Formatea minutos a formato de horas y minutos legible
 */
function formatMinutesToTime(minutes: number): string {
  if (!minutes || minutes === 0) return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Obtiene el estado del TODO basado en sus propiedades
 */
function getTodoStatus(todo: FlexibleTodo): string {
  if (todo.isCompleted) return "Completado";
  if (todo.control?.isTimerActive) return "En Progreso";
  if (todo.control?.status?.name) return todo.control.status.name;
  if (todo.dueDate && new Date(todo.dueDate) < new Date()) return "Vencido";
  return "Pendiente";
}

/**
 * Exporta una lista de TODOs a un archivo Excel
 */
export const exportTodosToExcel = (
  todos: FlexibleTodo[],
  filename: string = "todos.xlsx",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para el Excel
    const excelData = todos.map((todo) => ({
      Título: todo.title,
      Descripción: todo.description || "N/A",
      Prioridad: todo.priority?.name || "N/A",
      "Asignado a": todo.assignedUser?.fullName || "Sin asignar",
      "Creado por": todo.createdByUser?.fullName || "N/A",
      Estado: getTodoStatus(todo),
      "Fecha de Vencimiento": todo.dueDate
        ? formatDatePreservingDay(todo.dueDate)
        : "Sin fecha",
      "Tiempo Estimado": formatMinutesToTime(todo.estimatedMinutes),
      "Tiempo Trabajado": formatMinutesToTime(
        todo.control?.totalTimeMinutes || 0
      ),
      "Fecha de Creación": formatDatePreservingDay(todo.createdAt),
      "Fecha de Completado": todo.completedAt
        ? formatDatePreservingDay(todo.completedAt)
        : "N/A",
    }));

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "TODOs");

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Título
      { wch: 50 }, // Descripción
      { wch: 15 }, // Prioridad
      { wch: 25 }, // Asignado a
      { wch: 25 }, // Creado por
      { wch: 15 }, // Estado
      { wch: 18 }, // Fecha de Vencimiento
      { wch: 15 }, // Tiempo Estimado
      { wch: 15 }, // Tiempo Trabajado
      { wch: 18 }, // Fecha de Creación
      { wch: 18 }, // Fecha de Completado
    ];

    worksheet["!cols"] = columnWidths;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);

    // Mostrar notificación de éxito
    if (onSuccess) {
      onSuccess(`✅ ${todos.length} TODOs exportados a Excel exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar TODOs a Excel:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar TODOs a Excel");
    }
  }
};

/**
 * Exporta una lista de TODOs a un archivo CSV
 */
export const exportTodosToCSV = (
  todos: FlexibleTodo[],
  filename: string = "todos.csv",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para CSV
    const csvData = todos.map((todo) => ({
      Titulo: todo.title.replace(/["\n\r]/g, " "),
      Descripcion: (todo.description || "").replace(/["\n\r]/g, " "),
      Prioridad: todo.priority?.name || "N/A",
      "Asignado a": todo.assignedUser?.fullName || "Sin asignar",
      "Creado por": todo.createdByUser?.fullName || "N/A",
      Estado: getTodoStatus(todo),
      "Fecha de Vencimiento": todo.dueDate
        ? formatDatePreservingDay(todo.dueDate)
        : "Sin fecha",
      "Tiempo Estimado (min)": todo.estimatedMinutes || 0,
      "Tiempo Trabajado (min)": todo.control?.totalTimeMinutes || 0,
      "Fecha de Creacion": formatDatePreservingDay(todo.createdAt),
      "Fecha de Completado": todo.completedAt
        ? formatDatePreservingDay(todo.completedAt)
        : "N/A",
    }));

    // Crear encabezados
    const headers = Object.keys(csvData[0] || {});

    // Convertir datos a CSV
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escapar comillas y comas
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);

    if (onSuccess) {
      onSuccess(`✅ ${todos.length} TODOs exportados a CSV exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar TODOs a CSV:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar TODOs a CSV");
    }
  }
};

// =====================================================
// EXPORTACIÓN DE NOTAS
// =====================================================

// Tipo flexible para Notas que acepta diferentes estructuras
interface FlexibleNote {
  id: string;
  title: string;
  content: string;
  noteType: string;
  priority: string;
  difficultyLevel: number;
  tags: string[];
  caseId?: string;
  createdBy: string;
  assignedTo?: string;
  isImportant: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  // Relaciones opcionales
  author?: {
    fullName?: string;
    email?: string;
  };
  assignedUser?: {
    fullName?: string;
    email?: string;
  };
  case?: {
    numeroCaso?: string;
  };
}

/**
 * Obtiene el texto del tipo de nota
 */
function getNoteTypeText(noteType: string): string {
  const types: Record<string, string> = {
    note: "Nota",
    solution: "Solución",
    guide: "Guía",
    faq: "FAQ",
    template: "Plantilla",
    procedure: "Procedimiento",
  };
  return types[noteType] || noteType;
}

/**
 * Obtiene el texto de la prioridad de la nota
 */
function getNotePriorityText(priority: string): string {
  const priorities: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  };
  return priorities[priority] || priority;
}

/**
 * Obtiene el texto del nivel de dificultad
 */
function getDifficultyText(level: number): string {
  const levels: Record<number, string> = {
    1: "Muy Fácil",
    2: "Fácil",
    3: "Intermedio",
    4: "Difícil",
    5: "Muy Difícil",
  };
  return levels[level] || `Nivel ${level}`;
}

/**
 * Obtiene el estado de la nota
 */
function getNoteStatus(note: FlexibleNote): string {
  if (note.isArchived) return "Archivada";
  if (!note.isPublished) return "Borrador";
  if (note.isTemplate) return "Plantilla";
  return "Publicada";
}

/**
 * Exporta una lista de Notas a un archivo Excel
 */
export const exportNotesToExcel = (
  notes: FlexibleNote[],
  filename: string = "notas.xlsx",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para el Excel
    const excelData = notes.map((note) => ({
      Título: note.title,
      Contenido:
        note.content.substring(0, 500) +
        (note.content.length > 500 ? "..." : ""),
      Tipo: getNoteTypeText(note.noteType),
      Prioridad: getNotePriorityText(note.priority),
      Dificultad: getDifficultyText(note.difficultyLevel),
      Etiquetas: note.tags?.join(", ") || "Sin etiquetas",
      "Caso Asociado": note.case?.numeroCaso || "Sin caso",
      Autor: note.author?.fullName || "N/A",
      "Asignado a": note.assignedUser?.fullName || "Sin asignar",
      Estado: getNoteStatus(note),
      Importante: note.isImportant ? "Sí" : "No",
      Vistas: note.viewCount || 0,
      "Votos Positivos": note.helpfulCount || 0,
      "Votos Negativos": note.notHelpfulCount || 0,
      Versión: note.version || 1,
      "Fecha de Creación": formatDatePreservingDay(note.createdAt),
      "Última Actualización": formatDatePreservingDay(note.updatedAt),
    }));

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Título
      { wch: 60 }, // Contenido
      { wch: 15 }, // Tipo
      { wch: 12 }, // Prioridad
      { wch: 15 }, // Dificultad
      { wch: 30 }, // Etiquetas
      { wch: 15 }, // Caso Asociado
      { wch: 20 }, // Autor
      { wch: 20 }, // Asignado a
      { wch: 12 }, // Estado
      { wch: 12 }, // Importante
      { wch: 10 }, // Vistas
      { wch: 15 }, // Votos Positivos
      { wch: 15 }, // Votos Negativos
      { wch: 10 }, // Versión
      { wch: 18 }, // Fecha de Creación
      { wch: 18 }, // Última Actualización
    ];

    worksheet["!cols"] = columnWidths;

    // Escribir el archivo
    XLSX.writeFile(workbook, filename);

    // Mostrar notificación de éxito
    if (onSuccess) {
      onSuccess(`✅ ${notes.length} notas exportadas a Excel exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar notas a Excel:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar notas a Excel");
    }
  }
};

/**
 * Exporta una lista de Notas a un archivo CSV
 */
export const exportNotesToCSV = (
  notes: FlexibleNote[],
  filename: string = "notas.csv",
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar los datos para CSV
    const csvData = notes.map((note) => ({
      Titulo: note.title.replace(/["\n\r]/g, " "),
      Contenido:
        note.content.substring(0, 500).replace(/["\n\r]/g, " ") +
        (note.content.length > 500 ? "..." : ""),
      Tipo: getNoteTypeText(note.noteType),
      Prioridad: getNotePriorityText(note.priority),
      Dificultad: getDifficultyText(note.difficultyLevel),
      Etiquetas: note.tags?.join("; ") || "Sin etiquetas",
      "Caso Asociado": note.case?.numeroCaso || "Sin caso",
      Autor: note.author?.fullName || "N/A",
      "Asignado a": note.assignedUser?.fullName || "Sin asignar",
      Estado: getNoteStatus(note),
      Importante: note.isImportant ? "Si" : "No",
      Vistas: note.viewCount || 0,
      "Votos Positivos": note.helpfulCount || 0,
      "Votos Negativos": note.notHelpfulCount || 0,
      Version: note.version || 1,
      "Fecha de Creacion": formatDatePreservingDay(note.createdAt),
      "Ultima Actualizacion": formatDatePreservingDay(note.updatedAt),
    }));

    // Crear encabezados
    const headers = Object.keys(csvData[0] || {});

    // Convertir datos a CSV
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escapar comillas y comas
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);

    if (onSuccess) {
      onSuccess(`✅ ${notes.length} notas exportadas a CSV exitosamente`);
    }
  } catch (error) {
    console.error("Error al exportar notas a CSV:", error);
    if (onSuccess) {
      onSuccess("❌ Error al exportar notas a CSV");
    }
  }
};
