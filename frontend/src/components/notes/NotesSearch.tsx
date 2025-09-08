import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { NoteFilters } from "../../types/note.types";
import { Button } from "../ui/Button";

interface NotesSearchProps {
  onSearch: (filters: NoteFilters) => void;
  onReset: () => void;
  users?: Array<{ id: string; fullName?: string; email: string }>;
  cases?: Array<{ id: string; numeroCaso: string; descripcion: string }>;
  existingTags?: string[];
  currentFilters?: NoteFilters;
}

export const NotesSearch: React.FC<NotesSearchProps> = ({
  onSearch,
  onReset,
  users = [],
  cases = [],
  existingTags = [],
  currentFilters = {},
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<NoteFilters>({
    search: "",
    tags: [],
    createdBy: "",
    assignedTo: "",
    caseId: "",
    isImportant: undefined,
    isArchived: undefined,
    hasReminder: undefined,
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters: NoteFilters = {
      search: "",
      tags: [],
      createdBy: "",
      assignedTo: "",
      caseId: "",
      isImportant: undefined,
      isArchived: undefined,
      hasReminder: undefined,
      dateFrom: "",
      dateTo: "",
    };
    setFilters(resetFilters);
    onReset();
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      (filters.tags && filters.tags.length > 0) ||
      filters.createdBy ||
      filters.assignedTo ||
      filters.caseId ||
      filters.isImportant !== undefined ||
      filters.isArchived !== undefined ||
      filters.hasReminder !== undefined ||
      filters.dateFrom ||
      filters.dateTo
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="p-4">
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Buscar en título, contenido o etiquetas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant={showAdvanced ? "primary" : "secondary"}
            size="sm"
            title="Filtros avanzados"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </Button>
          <Button type="submit" variant="primary">
            Buscar
          </Button>
          {hasActiveFilters() && (
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              title="Limpiar filtros"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Created By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Creado por
                </label>
                <select
                  value={filters.createdBy || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      createdBy: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos los usuarios</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asignado a
                </label>
                <select
                  value={filters.assignedTo || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      assignedTo: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Cualquier usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Case */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caso
                </label>
                <select
                  value={filters.caseId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      caseId: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos los casos</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.numeroCaso} - {caseItem.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateTo: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isImportant === true}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isImportant: e.target.checked ? true : undefined,
                    }))
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Solo importantes
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isArchived === true}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isArchived: e.target.checked ? true : undefined,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Solo archivadas
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasReminder === true}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      hasReminder: e.target.checked ? true : undefined,
                    }))
                  }
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Con recordatorio
                </span>
              </label>
            </div>

            {/* Tags */}
            {existingTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {existingTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={
                        filters.tags?.includes(tag) ? "primary" : "secondary"
                      }
                      size="xs"
                      onClick={() => handleTagToggle(tag)}
                      className="transition-colors"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
