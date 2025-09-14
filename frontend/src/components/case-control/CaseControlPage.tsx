import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ActionIcon } from "../ui/ActionIcons";
import { TimerControl } from "./TimerControl";
import { CaseControlDetailsModal } from "./CaseControlDetailsModal";
import { CaseAssignmentModal } from "./CaseAssignmentModal";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { archiveApi } from "../../services/archiveApi";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
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
  const { user, isAuthenticated } = useAuth();
  const { success, error: showErrorToast } = useToast();
  const { confirmDangerAction, modalState, modalHandlers } =
    useConfirmationModal();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedCaseControl, setSelectedCaseControl] =
    useState<CaseControl | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

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

  // Función para manejar el archivado de casos
  const handleArchiveCase = async (caseControl: CaseControl) => {
    if (!caseControl.case?.id) return;

    // Verificar autenticación
    if (!isAuthenticated || !user) {
      showErrorToast("Debe estar autenticado para archivar casos.");
      return;
    }

    const confirmed = await confirmDangerAction(
      "Archivar Caso",
      `¿Está seguro que desea archivar el caso ${caseControl.case.numeroCaso}? Esta acción no se puede deshacer fácilmente.`
    );

    if (confirmed) {
      setIsArchiving(true);
      try {
        console.log("Archivando caso:", {
          caseId: caseControl.case.id,
          caseNumber: caseControl.case.numeroCaso,
          user: user,
          isAuthenticated,
        });

        await archiveApi.archiveCaseById(
          caseControl.case.id, // No usar parseInt() porque es un UUID
          "Archivado desde Control de Casos"
        );
        queryClient.invalidateQueries({ queryKey: ["caseControls"] });
        success("Caso archivado exitosamente");
      } catch (error) {
        console.error("Error archivando caso:", error);

        // Mostrar más detalles del error
        if (error instanceof Error) {
          if (
            error.message.includes("Session expired") ||
            error.message.includes("401")
          ) {
            showErrorToast(
              "Su sesión ha expirado. Por favor inicie sesión nuevamente."
            );
            // Aquí podrías redirigir al login
          } else {
            showErrorToast(`Error archivando el caso: ${error.message}`);
          }
        } else {
          showErrorToast(
            "Error archivando el caso. Por favor intente nuevamente."
          );
        }
      } finally {
        setIsArchiving(false);
      }
    }
  };

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
          success("Reporte generado exitosamente");
        },
        (error) => {
          console.error("Error al generar reporte:", error);
          showErrorToast("Error al generar el reporte");
        }
      );
    } catch (error) {
      console.error("Error al generar reporte:", error);
      showErrorToast("Error al generar el reporte");
    }
  };

  // Handlers
  const handleStartTimer = async (control: CaseControl) => {
    try {
      // Iniciar el timer
      await startTimerMutation.mutateAsync({ caseControlId: control.id });

      // Buscar dinámicamente el estado "EN CURSO"
      const enCursoStatus = statuses.find(
        (status) => status.name === "EN CURSO"
      );

      // Cambiar automáticamente el estado a "EN CURSO" si existe y no está ya en ese estado
      if (enCursoStatus && control.statusId !== enCursoStatus.id) {
        try {
          await updateCaseControlStatus({
            id: control.id,
            statusId: enCursoStatus.id,
          });

          // Actualizar la cache para reflejar ambos cambios (timer + estado)
          queryClient.invalidateQueries({ queryKey: ["caseControls"] });

          success(
            "Timer iniciado y caso cambiado a estado 'En Curso' automáticamente"
          );
        } catch (statusError) {
          console.error("Error al cambiar estado:", statusError);
          success(
            "Timer iniciado correctamente (pero no se pudo cambiar el estado automáticamente)"
          );
        }
      } else if (!enCursoStatus) {
        console.warn("No se encontró el estado 'EN CURSO' en la base de datos");
        success(
          "Timer iniciado correctamente (estado 'EN CURSO' no encontrado)"
        );
      } else {
        success("Timer iniciado correctamente");
      }
    } catch (error) {
      console.error("Error al iniciar timer:", error);
      if (error instanceof Error && error.message.includes("404")) {
        showErrorToast(
          "Endpoint no encontrado. El backend no está configurado para timers."
        );
      } else {
        showErrorToast(
          "Error al iniciar el timer. Verifique la conexión con el servidor."
        );
      }
    }
  };

  const handlePauseTimer = async (control: CaseControl) => {
    try {
      await pauseTimerMutation.mutateAsync({ caseControlId: control.id });
      success("Timer pausado correctamente");
    } catch (error) {
      console.error("Error al pausar timer:", error);
      if (error instanceof Error && error.message.includes("404")) {
        showErrorToast(
          "Endpoint no encontrado. El backend no está configurado para timers."
        );
      } else {
        showErrorToast(
          "Error al pausar el timer. Verifique la conexión con el servidor."
        );
      }
    }
  };

  const handleStopTimer = async (control: CaseControl) => {
    try {
      await stopTimerMutation.mutateAsync({ caseControlId: control.id });
      success("Timer detenido correctamente");
    } catch (error) {
      console.error("Error al detener timer:", error);
      if (error instanceof Error && error.message.includes("404")) {
        showErrorToast(
          "Endpoint no encontrado. El backend no está configurado para timers."
        );
      } else {
        showErrorToast(
          "Error al detener el timer. Verifique la conexión con el servidor."
        );
      }
    }
  };

  const handleStatusChange = async (controlId: string, statusId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: controlId, statusId });
      success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showErrorToast(
        "Error al actualizar el estado. Verifique que el endpoint esté disponible."
      );
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
            <ActionIcon action="report" size="sm" className="mr-2" />
            Reportes
          </Button>

          <Button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2"
          >
            <ActionIcon action="add" size="sm" />
            Asignar Caso
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <ActionIcon
              action="settings"
              size="md"
              color="neutral"
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtros:
            </span>
          </div>

          {/* Búsqueda por número de caso */}
          <div className="relative">
            <ActionIcon
              action="search"
              size="md"
              color="neutral"
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            />
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
            <ActionIcon
              action="time"
              size="xl"
              color="neutral"
              className="mx-auto mb-4"
            />
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
                      <ActionIcon action="time" size="sm" className="mr-1" />
                      <span>Total: {formatTime(control.totalTimeMinutes)}</span>
                    </div>

                    <div className="flex items-center">
                      <ActionIcon action="user" size="sm" className="mr-1" />
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
                    <ActionIcon action="view" size="sm" />
                  </Button>

                  {/* Botón archivar caso - solo si está terminado */}
                  {control.status?.name === "TERMINADA" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-700"
                      onClick={() => handleArchiveCase(control)}
                      disabled={isArchiving}
                      title="Archivar caso"
                    >
                      <ActionIcon action="archive" size="sm" />
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

      {/* Modal de confirmación */}
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
    </div>
  );
};

export default CaseControlPage;
