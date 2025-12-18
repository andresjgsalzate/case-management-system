import { useState } from "react";
import { exportNotesToExcel, exportNotesToCSV } from "../utils/exportUtilsNew";

interface ExportOptions {
  filename?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useNoteExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (notes: any[], options: ExportOptions = {}) => {
    if (notes.length === 0) {
      options.onError?.("No hay notas para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportNotesToExcel(notes, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting notes to Excel:", error);
      options.onError?.("Error al exportar notas a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (notes: any[], options: ExportOptions = {}) => {
    if (notes.length === 0) {
      options.onError?.("No hay notas para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportNotesToCSV(notes, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting notes to CSV:", error);
      options.onError?.("Error al exportar notas a CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    exportToCSV,
    isExporting,
  };
};
