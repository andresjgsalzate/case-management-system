import React, { useState } from "react";
import {
  PlusIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { DispositionForm } from "../../components/dispositions/DispositionForm";
import { useToast } from "../../hooks/useNotification";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { DispositionTable } from "../../components/dispositions/DispositionTable";
import { DispositionMonthlyCard } from "../../components/dispositions/DispositionMonthlyCard";
import {
  useDispositions,
  useDispositionsByMonth,
  useCreateDisposition,
  useUpdateDisposition,
  useDeleteDisposition,
  useAvailableYears,
} from "../../hooks/useDispositions";
import { useApplications } from "../../hooks/useApplications";
import type {
  Disposition,
  DispositionFilters,
} from "../../services/dispositionApi";
import type { DispositionFormData } from "../../lib/validations/dispositionValidations";
import {
  exportAllDispositionsExcel,
  exportDisitionsExcelByMonth,
} from "../../utils/dispositionsExportUtils";

export const DispositionsPage: React.FC = () => {
  // Estados para filtros
  const [filters, setFilters] = useState<DispositionFilters>({
    year: new Date().getFullYear(),
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para vista
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Estados para formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDisposition, setSelectedDisposition] =
    useState<Disposition | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    disposition: Disposition | null;
  }>({
    isOpen: false,
    disposition: null,
  });

  // Queries
  const { data: applications = [] } = useApplications();
  const {
    data: availableYears = [],
    // isLoading: yearsLoading,
    // error: yearsError,
  } = useAvailableYears();
  const dispositionsByMonthQuery = useDispositionsByMonth(
    filters.year || new Date().getFullYear()
  );
  const dispositionsQuery = useDispositions(filters);

  // Mutations
  const createDisposition = useCreateDisposition();
  const updateDisposition = useUpdateDisposition();
  const deleteDisposition = useDeleteDisposition();

  // Toast and Modal hooks
  const { error: showErrorToast, info } = useToast();
  const { modalState, modalHandlers } = useConfirmationModal();

  // Handlers
  const handleCreateDisposition = () => {
    setSelectedDisposition(null);
    setIsEdit(false);
    setIsFormOpen(true);
  };

  const handleEditDisposition = (disposition: Disposition) => {
    setSelectedDisposition(disposition);
    setIsEdit(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: DispositionFormData) => {
    try {
      if (isEdit && selectedDisposition) {
        await updateDisposition.mutateAsync({
          id: selectedDisposition.id,
          data,
        });
      } else {
        await createDisposition.mutateAsync(data);
      }
      setIsFormOpen(false);
      setSelectedDisposition(null);
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleDeleteDisposition = (id: string) => {
    const disposition = dispositionsQuery.data?.find((d) => d.id === id);
    if (!disposition) return;

    setDeleteModal({
      isOpen: true,
      disposition: disposition,
    });
  };

  const confirmDeleteDisposition = async () => {
    if (deleteModal.disposition) {
      try {
        await deleteDisposition.mutateAsync(deleteModal.disposition.id);
        setDeleteModal({ isOpen: false, disposition: null });
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const cancelDeleteDisposition = () => {
    setDeleteModal({ isOpen: false, disposition: null });
  };

  const handleExportMonth = async (year: number, month: number) => {
    try {
      // Obtener las disposiciones del mes desde la query existente
      const monthlyDispositions = dispositionsByMonthQuery.data?.find(
        (m) => m.month === month
      );

      if (
        !monthlyDispositions ||
        monthlyDispositions.dispositions.length === 0
      ) {
        info(
          `No se encontraron disposiciones para ${year}/${month
            .toString()
            .padStart(2, "0")}`
        );
        return;
      }

      // Exportar en formato Excel
      await exportDisitionsExcelByMonth(
        year,
        monthlyDispositions,
        undefined,
        (message) => console.log("Export success:", message)
      );
    } catch (error) {
      console.error("Error al exportar mes:", error);
      showErrorToast(
        "Error al exportar los datos del mes. Por favor, intente nuevamente."
      );
    }
  };

  const handleExportAll = async () => {
    try {
      // Obtener todas las disposiciones
      const allDispositions = dispositionsQuery.data || [];

      if (allDispositions.length === 0) {
        info("No hay disposiciones para exportar");
        return;
      }

      await exportAllDispositionsExcel(allDispositions, undefined, (message) =>
        console.log("Export success:", message)
      );
    } catch (error) {
      console.error("Error al exportar todas las disposiciones:", error);
      showErrorToast(
        "Error al exportar todas las disposiciones. Por favor, intente nuevamente."
      );
    }
  };

  // Filtrar datos para la vista de tarjetas
  const filteredMonthData =
    dispositionsByMonthQuery.data?.filter((monthData) => {
      if (searchTerm) {
        return monthData.dispositions.some(
          (d) =>
            d.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.applicationName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    }) || [];

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Disposiciones de Scripts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestión de solicitudes de disposición para scripts en aplicaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botones de vista */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="flex items-center"
            >
              <Squares2X2Icon className="h-4 w-4 mr-1" />
              Tarjetas
            </Button>
            <Button
              variant={viewMode === "table" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center"
            >
              <TableCellsIcon className="h-4 w-4 mr-1" />
              Tabla
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={handleExportAll}
            className="flex items-center"
            disabled={!dispositionsQuery.data?.length}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar Todo
          </Button>

          <Button
            onClick={handleCreateDisposition}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Disposición
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filtros
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año
            </label>
            <Select
              value={filters.year?.toString() || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: parseInt(e.target.value) || undefined,
                })
              }
            >
              <option value="">Todos los años</option>
              {Array.isArray(availableYears) &&
                availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aplicación
            </label>
            <Select
              value={filters.applicationId || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  applicationId: e.target.value || undefined,
                })
              }
            >
              <option value="">Todas las aplicaciones</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Buscar por caso o aplicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {dispositionsByMonthQuery.isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : dispositionsByMonthQuery.error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            Error al cargar disposiciones:{" "}
            {(dispositionsByMonthQuery.error as Error).message}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        // Vista de tarjetas
        filteredMonthData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMonthData.map((monthData) => (
              <DispositionMonthlyCard
                key={`${monthData.year}-${monthData.month}`}
                monthData={monthData}
                onExport={handleExportMonth}
                canExport={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              {searchTerm || filters.applicationId
                ? "No se encontraron resultados"
                : "No hay disposiciones"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filters.applicationId
                ? "Intenta ajustar los filtros de búsqueda."
                : "Comienza creando una nueva disposición de scripts."}
            </p>
            {!searchTerm && !filters.applicationId && (
              <div className="mt-6">
                <Button
                  onClick={handleCreateDisposition}
                  className="flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primera Disposición
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        // Vista de tabla
        <DispositionTable
          dispositions={dispositionsQuery.data || []}
          onEdit={handleEditDisposition}
          onDelete={handleDeleteDisposition}
          isLoading={dispositionsQuery.isLoading}
        />
      )}

      {/* Formulario Modal */}
      <DispositionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDisposition(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          selectedDisposition
            ? {
                date: selectedDisposition.date,
                caseNumber: selectedDisposition.caseNumber,
                caseId: selectedDisposition.caseId || undefined,
                scriptName: selectedDisposition.scriptName,
                svnRevisionNumber: selectedDisposition.svnRevisionNumber || "",
                applicationId: selectedDisposition.applicationId,
                observations: selectedDisposition.observations || "",
              }
            : undefined
        }
        isEdit={isEdit}
        loading={createDisposition.isPending || updateDisposition.isPending}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirmar eliminación"
        message={`¿Está seguro de que desea eliminar la disposición "${deleteModal.disposition?.scriptName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteDisposition}
        onClose={cancelDeleteDisposition}
        type="danger"
      />

      {/* Modal de confirmación global */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={modalHandlers.onClose}
        onConfirm={modalHandlers.onConfirm}
        title={modalState.options?.title || ""}
        message={modalState.options?.message || ""}
        confirmText={modalState.options?.confirmText}
        cancelText={modalState.options?.cancelText}
        type={modalState.options?.type}
      />
    </PageWrapper>
  );
};
