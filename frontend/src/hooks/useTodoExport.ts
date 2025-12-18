import { useState } from "react";
import { exportTodosToExcel, exportTodosToCSV } from "../utils/exportUtilsNew";

interface ExportOptions {
  filename?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useTodoExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (todos: any[], options: ExportOptions = {}) => {
    if (todos.length === 0) {
      options.onError?.("No hay TODOs para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportTodosToExcel(todos, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting TODOs to Excel:", error);
      options.onError?.("Error al exportar TODOs a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (todos: any[], options: ExportOptions = {}) => {
    if (todos.length === 0) {
      options.onError?.("No hay TODOs para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await exportTodosToCSV(todos, options.filename, options.onSuccess);
    } catch (error) {
      console.error("Error exporting TODOs to CSV:", error);
      options.onError?.("Error al exportar TODOs a CSV");
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
