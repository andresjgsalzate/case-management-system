import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClockIcon,
  EyeIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TimerControl } from "./TimerControl";
import { CaseControlDetailsModal } from "./CaseControlDetailsModal";
import { CaseAssignmentModal } from "./CaseAssignmentModal";
import {
  getCaseControls,
  getCaseStatuses,
  updateCaseControlStatus,
  startTimer,
  pauseTimer,
  stopTimer,
} from "../../services/api/caseControlApi";
import { CaseControl } from "../../types/caseControl";
import { generateCaseControlReport } from "../../utils/exportUtilsNew";

export const CaseControlPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedCaseControl, setSelectedCaseControl] =
    useState<CaseControl | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Queries
  const { data: caseControls = [], isLoading: loadingControls } = useQuery({
    queryKey: ["caseControls"],
    queryFn: getCaseControls,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["caseStatuses"],
    queryFn: getCaseStatuses,
  });

  // Mutations
  const startTimerMutation = useMutation({
    mutationFn: startTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
    },
  });

  const pauseTimerMutation = useMutation({
    mutationFn: pauseTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: stopTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateCaseControlStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
    },
  });

  // Filtros
  const filteredControls = caseControls.filter((control) => {
    // Filtro por estado
    if (selectedStatus && control.statusId !== selectedStatus) return false;

    // Filtro por búsqueda de número de caso
    if (searchTerm && control.case?.numeroCaso) {
      const searchLower = searchTerm.toLowerCase();
      const caseNumber = control.case.numeroCaso.toLowerCase();
      const caseDescription = control.case.descripcion?.toLowerCase() || "";

      if (
        !caseNumber.includes(searchLower) &&
        !caseDescription.includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });

  // Funciones de utilidad
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusStyle = (status: any): React.CSSProperties => {
    if (status && status.color) {
      return {
        backgroundColor: status.color,
        color: "white",
      };
    }
    return {};
  };

  const handleGenerateReport = async () => {
    try {
      const filename = `reporte-control-casos-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      await generateCaseControlReport(
        filename,
        (message) => {
          console.log("Reporte generado exitosamente:", message);
          // Aquí podrías mostrar un toast o notificación
        },
        (error) => {
          console.error("Error al generar reporte:", error);
        }
      );
    } catch (error) {
      console.error("Error al generar reporte:", error);
    }
  };

  // Handlers
  const handleStartTimer = async (control: CaseControl) => {
    try {
      await startTimerMutation.mutateAsync({ caseControlId: control.id });
    } catch (error) {
      console.error("Error al iniciar timer:", error);
    }
  };

  const handlePauseTimer = async (control: CaseControl) => {
    try {
      await pauseTimerMutation.mutateAsync({ caseControlId: control.id });
    } catch (error) {
      console.error("Error al pausar timer:", error);
    }
  };

  const handleStopTimer = async (control: CaseControl) => {
    try {
      await stopTimerMutation.mutateAsync({ caseControlId: control.id });
    } catch (error) {
      console.error("Error al detener timer:", error);
    }
  };

  const handleStatusChange = async (controlId: string, statusId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: controlId, statusId });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  if (loadingControls) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control de Casos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona el tiempo y estado de los casos asignados
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botón de reportes */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center"
            onClick={handleGenerateReport}
          >
            <DocumentChartBarIcon className="h-4 w-4 mr-2" />
            Reportes
          </Button>

          <Button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Asignar Caso
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtros:
            </span>
          </div>

          {/* Búsqueda por número de caso */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número o descripción..."
              className="pl-10 w-64"
            />
          </div>

          {/* Filtro por estado */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>

          {(selectedStatus || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStatus("");
                setSearchTerm("");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Indicador de resultados */}
      {(searchTerm || selectedStatus) && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredControls.length === 0
            ? "No se encontraron casos"
            : `Mostrando ${filteredControls.length} de ${caseControls.length} casos`}
          {searchTerm && (
            <span className="ml-2">
              • Búsqueda: "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
      )}

      {/* Lista de controles */}
      <div className="grid gap-4">
        {filteredControls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || selectedStatus
                ? "No se encontraron casos"
                : "No hay casos en control"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm && selectedStatus
                ? `No hay casos que coincidan con "${searchTerm}" en el estado seleccionado`
                : searchTerm
                ? `No hay casos que coincidan con "${searchTerm}"`
                : selectedStatus
                ? "No hay casos con el estado seleccionado"
                : "Comienza asignando casos para hacer seguimiento"}
            </p>
            {!searchTerm && !selectedStatus && (
              <Button
                variant="primary"
                onClick={() => setShowAssignModal(true)}
              >
                Asignar Primer Caso
              </Button>
            )}
          </div>
        ) : (
          filteredControls.map((control) => (
            <div
              key={control.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {control.case?.numeroCaso || "Caso sin número"}
                    </h3>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={getStatusStyle(control.status)}
                    >
                      {control.status?.name}
                    </span>
                    {control.isTimerActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        En curso
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {control.case?.descripcion || "Sin descripción"}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Total: {formatTime(control.totalTimeMinutes)}</span>
                    </div>

                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>
                        Asignado a:{" "}
                        {control.user?.fullName || "Usuario desconocido"}
                      </span>
                    </div>

                    <div>
                      Asignado:{" "}
                      {formatDistanceToNow(new Date(control.assignedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>

                    {control.isTimerActive && control.timerStartAt && (
                      <div className="text-blue-600 dark:text-blue-400 font-medium">
                        Iniciado:{" "}
                        {formatDistanceToNow(new Date(control.timerStartAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Selector de estado */}
                  <Select
                    value={control.statusId}
                    onChange={(e) =>
                      handleStatusChange(control.id, e.target.value)
                    }
                    className="w-32"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </Select>

                  {/* Control de timer mejorado */}
                  <TimerControl
                    isActive={control.isTimerActive}
                    startTime={control.timerStartAt || null}
                    onStart={() => handleStartTimer(control)}
                    onPause={() => handlePauseTimer(control)}
                    onStop={() => handleStopTimer(control)}
                    isLoading={
                      startTimerMutation.isPending ||
                      stopTimerMutation.isPending ||
                      pauseTimerMutation.isPending
                    }
                    disabled={false}
                  />

                  {/* Botón ver detalles */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCaseControl(control);
                      setShowTimeModal(true);
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>

                  {/* Botón archivar caso - solo si está terminado */}
                  {control.status?.name === "TERMINADA" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <ArchiveBoxIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalles de tiempo */}
      <CaseControlDetailsModal
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        caseControl={selectedCaseControl}
      />

      {/* Modal de asignación */}
      <CaseAssignmentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={() => {
          queryClient.invalidateQueries({ queryKey: ["caseControls"] });
        }}
      />
    </div>
  );
};

export default CaseControlPage;
