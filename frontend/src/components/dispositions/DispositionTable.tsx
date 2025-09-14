import React from "react";
import { EditIcon, DeleteIcon, ViewIcon } from "../ui/ActionIcons";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Button } from "../ui/Button";
import { formatDateLocal } from "../../utils/dateUtils";
import type { Disposition } from "../../services/dispositionApi";

interface DispositionTableProps {
  dispositions: Disposition[];
  onEdit: (disposition: Disposition) => void;
  onDelete: (id: string) => void;
  onView?: (disposition: Disposition) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isLoading?: boolean;
}

export const DispositionTable: React.FC<DispositionTableProps> = ({
  dispositions,
  onEdit,
  onDelete,
  onView,
  canEdit = true,
  canDelete = true,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (dispositions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No se encontraron disposiciones
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Caso
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Script
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Aplicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              SVN
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {dispositions.map((disposition) => (
            <tr
              key={disposition.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatDateLocal(disposition.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {disposition.caseNumber}
                  </div>
                  {disposition.case && (
                    <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {disposition.case.descripcion}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {disposition.scriptName}
                  </div>
                  {disposition.observations && (
                    <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {disposition.observations}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {disposition.application?.nombre || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {disposition.svnRevisionNumber || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {disposition.user?.fullName || disposition.user?.email || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(disposition)}
                      title="Ver detalles"
                    >
                      <ViewIcon size="sm" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(disposition)}
                      title="Editar"
                    >
                      <EditIcon size="sm" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(disposition.id)}
                      title="Eliminar"
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <DeleteIcon size="sm" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
