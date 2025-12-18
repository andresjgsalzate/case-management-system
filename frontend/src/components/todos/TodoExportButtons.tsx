import React from "react";
import { ExportIcon } from "../ui/ActionIcons";
import { Button } from "../ui/Button";
import { useTodoExport } from "../../hooks/useTodoExport";
import { Todo } from "../../types/todo.types";

interface TodoExportButtonsProps {
  filteredTodos: Todo[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export const TodoExportButtons: React.FC<TodoExportButtonsProps> = ({
  filteredTodos,
  onSuccess,
  onError,
  className = "",
}) => {
  const { exportToExcel, exportToCSV, isExporting } = useTodoExport();

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToExcel(filteredTodos, {
      filename: `todos-${timestamp}.xlsx`,
      onSuccess,
      onError,
    });
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(filteredTodos, {
      filename: `todos-${timestamp}.csv`,
      onSuccess,
      onError,
    });
  };

  const hasData = filteredTodos.length > 0;
  const exportCount = filteredTodos.length;

  return (
    <div className={`flex space-x-2 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportCSV}
        disabled={!hasData || isExporting}
        title={
          hasData
            ? `Exportar ${exportCount} TODO(s) a CSV`
            : "No hay TODOs para exportar"
        }
      >
        <ExportIcon size="sm" />
        {isExporting ? "Exportando..." : "CSV"}
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportExcel}
        disabled={!hasData || isExporting}
        title={
          hasData
            ? `Exportar ${exportCount} TODO(s) a Excel`
            : "No hay TODOs para exportar"
        }
      >
        <ExportIcon size="sm" />
        {isExporting ? "Exportando..." : "Excel"}
      </Button>
    </div>
  );
};
