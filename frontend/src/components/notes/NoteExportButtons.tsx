import React from "react";
import { ExportIcon } from "../ui/ActionIcons";
import { Button } from "../ui/Button";
import { useNoteExport } from "../../hooks/useNoteExport";
import { Note } from "../../types/note.types";

interface NoteExportButtonsProps {
  filteredNotes: Note[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export const NoteExportButtons: React.FC<NoteExportButtonsProps> = ({
  filteredNotes,
  onSuccess,
  onError,
  className = "",
}) => {
  const { exportToExcel, exportToCSV, isExporting } = useNoteExport();

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToExcel(filteredNotes, {
      filename: `notas-${timestamp}.xlsx`,
      onSuccess,
      onError,
    });
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(filteredNotes, {
      filename: `notas-${timestamp}.csv`,
      onSuccess,
      onError,
    });
  };

  const hasData = filteredNotes.length > 0;
  const exportCount = filteredNotes.length;

  return (
    <div className={`flex space-x-2 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportCSV}
        disabled={!hasData || isExporting}
        title={
          hasData
            ? `Exportar ${exportCount} nota(s) a CSV`
            : "No hay notas para exportar"
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
            ? `Exportar ${exportCount} nota(s) a Excel`
            : "No hay notas para exportar"
        }
      >
        <ExportIcon size="sm" />
        {isExporting ? "Exportando..." : "Excel"}
      </Button>
    </div>
  );
};
