import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Button } from "../ui/Button";
import type { DispositionMensual } from "../../services/dispositionApi";

interface DispositionMonthlyCardProps {
  monthData: DispositionMensual;
  onExport?: (year: number, month: number) => void;
  canExport?: boolean;
}

export const DispositionMonthlyCard: React.FC<DispositionMonthlyCardProps> = ({
  monthData,
  onExport,
  canExport = false,
}) => {
  const handleExport = () => {
    if (onExport) {
      onExport(monthData.year, monthData.month);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ActionIcon action="calendar" size="lg" color="primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthData.monthName} {monthData.year}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {monthData.totalDispositions} disposición
                {monthData.totalDispositions !== 1 ? "es" : ""}
              </p>
            </div>
          </div>

          {canExport && onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <ActionIcon action="download" size="sm" />
              <span>Exportar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content - Tabla */}
      {monthData.dispositions.length > 0 ? (
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Caso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aplicación
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {monthData.dispositions.map((caseDisposition, index) => (
                <tr
                  key={`${caseDisposition.caseNumber}-${caseDisposition.applicationId}-${index}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      #{caseDisposition.caseNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                      title={caseDisposition.applicationName}
                    >
                      {caseDisposition.applicationName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {caseDisposition.quantity}{" "}
                      {caseDisposition.quantity === 1 ? "vez" : "veces"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <ActionIcon
            action="calendar"
            size="xl"
            color="neutral"
            className="mx-auto"
          />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            Sin disposiciones
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No hay disposiciones registradas para este mes.
          </p>
        </div>
      )}

      {/* Footer con resumen */}
      {monthData.dispositions.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Casos únicos:{" "}
              <span className="font-medium">
                {monthData.dispositions.length}
              </span>
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              Total:{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {monthData.totalDispositions}
              </span>{" "}
              disposiciones
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
