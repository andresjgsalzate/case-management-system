import React from "react";
import { ActionIcon } from "../ui/ActionIcons";

export interface ActiveFilter {
  id: string;
  term: string;
  type: "search" | "refine" | "tag" | "case";
  timestamp: number;
}

interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onUndoLastFilter: () => void;
  onClearAll: () => void;
  resultCount?: number;
  canUndo: boolean;
}

/**
 * Componente que muestra los filtros de búsqueda activos como chips
 * Permite eliminar filtros individuales, deshacer el último o limpiar todos
 */
const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filters,
  onRemoveFilter,
  onUndoLastFilter,
  onClearAll,
  resultCount,
  canUndo,
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Label */}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
        <ActionIcon action="filter" size="sm" color="gray" className="mr-1" />
        Filtros:
      </span>

      {/* Filter chips */}
      {filters.map((filter) => {
        const getChipStyles = () => {
          switch (filter.type) {
            case "search":
              return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700";
            case "tag":
              return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700";
            case "case":
              return "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700";
            default: // refine
              return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700";
          }
        };

        const getIcon = () => {
          switch (filter.type) {
            case "search":
              return "🔍";
            case "tag":
              return "🏷️";
            case "case":
              return "📁";
            default:
              return "➕";
          }
        };

        const getHoverColor = () => {
          switch (filter.type) {
            case "search":
              return "hover:bg-blue-600 dark:hover:bg-blue-400";
            case "tag":
              return "hover:bg-emerald-600 dark:hover:bg-emerald-400";
            case "case":
              return "hover:bg-purple-600 dark:hover:bg-purple-400";
            default:
              return "hover:bg-green-600 dark:hover:bg-green-400";
          }
        };

        return (
          <span
            key={filter.id}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${getChipStyles()}`}
          >
            {/* Icon */}
            <span className="mr-1.5">{getIcon()}</span>

            {/* Filter term */}
            <span className="max-w-32 truncate" title={filter.term}>
              {filter.term}
            </span>

            {/* Remove button */}
            <button
              onClick={() => onRemoveFilter(filter.id)}
              className={`ml-2 p-0.5 rounded-full hover:bg-opacity-30 transition-colors ${getHoverColor()}`}
              title="Eliminar filtro"
              aria-label={`Eliminar filtro: ${filter.term}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        );
      })}

      {/* Result count */}
      {resultCount !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          ({resultCount} resultado{resultCount !== 1 ? "s" : ""})
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Undo button */}
        {canUndo && (
          <button
            onClick={onUndoLastFilter}
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
            title="Deshacer último filtro"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Deshacer
          </button>
        )}

        {/* Clear all button */}
        <button
          onClick={onClearAll}
          className="inline-flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline transition-colors"
          title="Limpiar todos los filtros"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Limpiar todo
        </button>
      </div>
    </div>
  );
};

export default ActiveFiltersBar;
