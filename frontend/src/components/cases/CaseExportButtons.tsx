import React from "react";
import { ExportIcon } from "../ui/ActionIcons";
import { Button } from "../ui/Button";
import { useCaseExport } from "../../hooks/useCaseExport";
import { Case } from "../../services/api";

interface CaseExportButtonsProps {
  filteredCases: Case[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export const CaseExportButtons: React.FC<CaseExportButtonsProps> = ({
  filteredCases,
  onSuccess,
  onError,
  className = "",
}) => {
  const { exportToExcel, exportToCSV, isExporting } = useCaseExport();

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToExcel(filteredCases, {
      filename: `casos-${timestamp}.xlsx`,
      onSuccess,
      onError,
    });
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(filteredCases, {
      filename: `casos-${timestamp}.csv`,
      onSuccess,
      onError,
    });
  };

  const hasData = filteredCases.length > 0;
  const exportCount = filteredCases.length;

  return (
    <div className={`flex space-x-2 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportCSV}
        disabled={!hasData || isExporting}
        title={
          hasData
            ? `Exportar ${exportCount} caso(s) a CSV`
            : "No hay casos para exportar"
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
            ? `Exportar ${exportCount} caso(s) a Excel`
            : "No hay casos para exportar"
        }
      >
        <ExportIcon size="sm" />
        {isExporting ? "Exportando..." : "Excel"}
      </Button>
    </div>
  );
};
