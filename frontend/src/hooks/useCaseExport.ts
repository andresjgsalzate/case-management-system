import { useState } from "react";
import {
  exportCasesToExcel,
  exportCasesToCSV,
  generateCaseControlReport,
} from "../utils/exportUtilsNew";

interface ExportOptions {
  filename?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useCaseExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (cases: any[], options: ExportOptions = {}) => {
    if (cases.length === 0) {
      options.onError?.("No hay casos para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportCasesToExcel(cases, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      options.onError?.("Error al exportar casos a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (cases: any[], options: ExportOptions = {}) => {
    if (cases.length === 0) {
      options.onError?.("No hay casos para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportCasesToCSV(cases, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      options.onError?.("Error al exportar casos a CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const exportControlReport = async (
    caseControls: any[],
    options: ExportOptions = {}
  ) => {
    if (caseControls.length === 0) {
      options.onError?.("No hay controles de casos para exportar");
      return;
    }

    try {
      setIsExporting(true);
      // Usar la función async que obtiene los datos automáticamente
      await generateCaseControlReport(
        options.filename,
        options.onSuccess,
        options.onError
      );
    } catch (error) {
      console.error("Error exporting control report:", error);
      options.onError?.("Error al exportar reporte de control");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    exportToCSV,
    exportControlReport,
    isExporting,
  };
};
