import * as XLSX from "xlsx";
import type {
  Disposition,
  DispositionMensual,
} from "../services/dispositionApi";
import { dispositionApi } from "../services/dispositionApi";

type NotificationFn = (message: string) => void;

// Función auxiliar para formatear fechas
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("es-ES");
  } catch {
    return dateString;
  }
};

// Función auxiliar para descargar CSV
const downloadCSV = (data: string, filename: string) => {
  // Agregar BOM UTF-8 al inicio para compatibilidad con Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Función auxiliar para convertir array a CSV
const arrayToCSV = (data: (string | number)[][]): string => {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell || "");
          // Escapar comillas y encerrar en comillas si contiene comas o saltos de línea
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");
};

/**
 * Exporta disposiciones por mes en formato CSV
 */
export const exportDispositionsCSVByMonth = async (
  year: number,
  monthlyData: DispositionMensual,
  filename?: string
) => {
  try {
    // Crear encabezados
    const headers = ["Caso", "Aplicación", "Cantidad", "Observaciones"];

    // Preparar datos del mes
    const data = monthlyData.dispositions.map((d: any) => [
      d.caseNumber,
      d.applicationName,
      d.quantity,
      d.observations || "",
    ]);

    // Crear estructura del archivo con información del período
    const resumenData = [
      ["REPORTE DE DISPOSICIONES - RESUMEN MENSUAL"],
      [""],
      ["Período", `${monthlyData.monthName} ${year}`],
      ["Total de Disposiciones", monthlyData.totalDispositions],
      ["Casos Únicos", monthlyData.dispositions.length],
      ["Fecha de Generación", new Date().toLocaleDateString("es-ES")],
      [""],
      headers,
      ...data,
    ];

    const csvContent = arrayToCSV(resumenData);
    const fileName =
      filename || `Resumen_Disposiciones_${monthlyData.monthName}_${year}.csv`;

    downloadCSV(csvContent, fileName);
    return true;
  } catch (error) {
    console.error("Error al exportar disposiciones por mes:", error);
    throw new Error("Error al generar el archivo de exportación CSV");
  }
};

/**
 * Exporta disposiciones por mes en formato Excel
 */
export const exportDisitionsExcelByMonth = async (
  year: number,
  monthlyData: DispositionMensual,
  filename?: string,
  onSuccess?: NotificationFn
) => {
  try {
    console.log("Monthly data:", monthlyData); // Debug log

    // Crear datos completos directamente como array
    const excelData = [
      ["REPORTE DE DISPOSICIONES - RESUMEN MENSUAL"],
      [""],
      ["Período", `${monthlyData.monthName} ${year}`],
      ["Total de Disposiciones", monthlyData.totalDispositions],
      ["Casos Únicos", monthlyData.dispositions.length],
      ["Fecha de Generación", new Date().toLocaleDateString("es-ES")],
      [""],
      ["Caso", "Aplicación", "Cantidad", "Observaciones"], // Encabezados
      // Datos de disposiciones
      ...monthlyData.dispositions.map((d) => [
        d.caseNumber,
        d.applicationName,
        d.quantity,
        d.observations || "",
      ]),
    ];

    // Crear hoja de trabajo directamente desde el array
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Disposiciones ${monthlyData.monthName}`
    );

    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 20 }, // Caso
      { wch: 30 }, // Aplicación
      { wch: 15 }, // Cantidad
      { wch: 50 }, // Observaciones
    ];
    worksheet["!cols"] = columnWidths;

    // Generar archivo
    const fileName =
      filename || `Resumen_Disposiciones_${monthlyData.monthName}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    if (onSuccess) {
      onSuccess("✅ Reporte mensual de disposiciones generado exitosamente");
    }
  } catch (error) {
    console.error("Error al exportar disposiciones por mes:", error);
    throw new Error("Error al generar el archivo de exportación Excel");
  }
};

/**
 * Exporta todas las disposiciones en formato CSV
 */
export const exportAllDispositionsCSV = async (
  dispositions: Disposition[],
  filename?: string
) => {
  try {
    const headers = [
      "Fecha",
      "Caso",
      "Descripción del Caso",
      "Nombre del Script",
      "Número de Revisión SVN",
      "Aplicación",
      "Observaciones",
      "Usuario",
      "Fecha de Creación",
    ];

    const data = dispositions.map((d) => [
      formatDate(d.date),
      d.caseNumber || "N/A",
      d.case?.descripcion || "N/A",
      d.scriptName,
      d.svnRevisionNumber || "",
      d.application?.nombre || "N/A",
      d.observations || "",
      d.user?.fullName || d.user?.email || "N/A",
      formatDate(d.createdAt),
    ]);

    const csvData = [headers, ...data];
    const csvContent = arrayToCSV(csvData);
    const fileName =
      filename ||
      `Todas_las_Disposiciones_${new Date().toISOString().split("T")[0]}.csv`;

    downloadCSV(csvContent, fileName);
    return true;
  } catch (error) {
    console.error("Error al exportar todas las disposiciones:", error);
    throw new Error("Error al generar el archivo de exportación CSV");
  }
};

/**
 * Exporta todas las disposiciones en formato Excel
 */
export const exportAllDispositionsExcel = async (
  dispositions: Disposition[],
  filename?: string,
  onSuccess?: NotificationFn
) => {
  try {
    // Preparar datos para Excel
    const excelData = dispositions.map((d) => ({
      Fecha: formatDate(d.date),
      Caso: d.caseNumber || "N/A",
      "Descripción del Caso": d.case?.descripcion || "N/A",
      "Nombre del Script": d.scriptName,
      "Número de Revisión SVN": d.svnRevisionNumber || "",
      Aplicación: d.application?.nombre || "N/A",
      Observaciones: d.observations || "",
      Usuario: d.user?.fullName || d.user?.email || "N/A",
      "Fecha de Creación": formatDate(d.createdAt),
    }));

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Todas las Disposiciones"
    );

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 20 }, // Caso
      { wch: 40 }, // Descripción del Caso
      { wch: 30 }, // Nombre del Script
      { wch: 20 }, // Número de Revisión SVN
      { wch: 20 }, // Aplicación
      { wch: 30 }, // Observaciones
      { wch: 25 }, // Usuario
      { wch: 18 }, // Fecha de Creación
    ];
    worksheet["!cols"] = columnWidths;

    // Escribir el archivo
    const fileName =
      filename ||
      `Todas_las_Disposiciones_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    // Mostrar notificación de éxito
    if (onSuccess) {
      onSuccess("✅ Reporte completo de disposiciones generado exitosamente");
    }
  } catch (error) {
    console.error("Error al generar reporte de disposiciones:", error);
    throw new Error("Error al generar el archivo Excel de disposiciones");
  }
};

/**
 * Función principal para generar reporte completo con datos de la API
 */
export const generateCompleteDispositionsReport = async (
  dispositions: Disposition[],
  filename?: string,
  format: "excel" | "csv" = "excel",
  onSuccess?: NotificationFn,
  onError?: NotificationFn
) => {
  try {
    if (format === "excel") {
      await exportAllDispositionsExcel(dispositions, filename, onSuccess);
    } else {
      await exportAllDispositionsCSV(dispositions, filename);
      if (onSuccess) {
        onSuccess("✅ Reporte CSV de disposiciones generado exitosamente");
      }
    }
  } catch (error) {
    console.error("Error al generar reporte completo:", error);
    if (onError) {
      onError("❌ Error al generar reporte completo de disposiciones");
    }
    throw error;
  }
};

/**
 * Función para procesar disposiciones y generar datos del mes específico
 */
export const processMonthlyDispositionsData = async (
  year: number,
  month: number
): Promise<{ monthlyData: DispositionMensual | null; csvData: string }> => {
  try {
    const dispositions = await dispositionApi.getAll();

    if (!dispositions || dispositions.length === 0) {
      return { monthlyData: null, csvData: "" };
    }

    // Filtrar disposiciones del mes específico
    const monthlyDispositions = dispositions.filter((d: Disposition) => {
      const fecha = new Date(d.createdAt);
      return fecha.getFullYear() === year && fecha.getMonth() + 1 === month;
    });

    if (monthlyDispositions.length === 0) {
      return { monthlyData: null, csvData: "" };
    }

    // Agrupar por caso y contar
    const groupedData = monthlyDispositions.reduce(
      (acc: any, d: Disposition) => {
        const key = `${d.caseNumber}-${
          d.application?.nombre || "Sin aplicación"
        }`;

        if (!acc[key]) {
          acc[key] = {
            caseNumber: d.caseNumber,
            applicationName: d.application?.nombre || "Sin aplicación",
            quantity: 0,
          };
        }
        acc[key].quantity++;
        return acc;
      },
      {}
    );

    // Generar nombre del mes
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const monthlyData: DispositionMensual = {
      month: month,
      monthName: monthNames[month - 1],
      year: year,
      totalDispositions: monthlyDispositions.length,
      dispositions: Object.values(groupedData),
    };

    // Generar CSV básico (sin función externa)
    const csvData = monthlyDispositions
      .map(
        (d: Disposition) =>
          `${d.date},${d.caseNumber},${d.scriptName},${
            d.application?.nombre || "Sin aplicación"
          }`
      )
      .join("\n");

    return { monthlyData, csvData };
  } catch (error) {
    console.error("Error al generar el reporte mensual:", error);
    throw new Error("Error al procesar los datos de disposiciones");
  }
};
export const generateMonthlyDispositionsReport = async (
  year: number,
  monthlyData: DispositionMensual,
  filename?: string,
  format: "excel" | "csv" = "excel",
  onSuccess?: NotificationFn,
  onError?: NotificationFn
) => {
  try {
    if (format === "excel") {
      await exportDisitionsExcelByMonth(year, monthlyData, filename, onSuccess);
    } else {
      await exportDispositionsCSVByMonth(year, monthlyData, filename);
      if (onSuccess) {
        onSuccess(
          "✅ Reporte CSV mensual de disposiciones generado exitosamente"
        );
      }
    }
  } catch (error) {
    console.error("Error al generar reporte mensual:", error);
    if (onError) {
      onError("❌ Error al generar reporte mensual de disposiciones");
    }
    throw error;
  }
};
