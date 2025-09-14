import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { ActionIcon } from "../ui/ActionIcons";
import { useToast } from "../../contexts/ToastContext";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { CaseControl } from "../../types/caseControl";
import {
  useTimeEntries,
  useManualTimeEntries,
  useAddManualTime,
  useDeleteManualTime,
  useDeleteTimeEntry,
} from "../../hooks/useCaseControl";
import {
  formatDate,
  formatTimeDetailed,
  formatDateLocal,
} from "../../utils/dateUtils";

interface CaseControlDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseControl: CaseControl | null;
}

interface ManualTimeForm {
  description: string;
  hours: number;
  minutes: number;
  date: string;
}

function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export const CaseControlDetailsModal: React.FC<
  CaseControlDetailsModalProps
> = ({ isOpen, onClose, caseControl }) => {
  const timeEntriesQuery = useTimeEntries(caseControl?.id || "");
  const manualTimeEntriesQuery = useManualTimeEntries(caseControl?.id || "");
  const addManualTimeMutation = useAddManualTime();
  const deleteManualTimeMutation = useDeleteManualTime();
  const deleteTimeEntryMutation = useDeleteTimeEntry();

  const { success, error: showErrorToast } = useToast();
  const { confirmDelete, modalState, modalHandlers } = useConfirmationModal();

  const [showManualTimeForm, setShowManualTimeForm] = useState(false);
  const [manualTimeForm, setManualTimeForm] = useState<ManualTimeForm>({
    description: "",
    hours: 0,
    minutes: 0,
    date: getTodayDateString(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseControl) return null;

  const timeEntries = timeEntriesQuery.data || [];
  const manualTimeEntries = manualTimeEntriesQuery.data || [];

  const totalTimerMinutes = timeEntries.reduce((total: number, entry: any) => {
    // Usar las propiedades correctas del backend: startTime y endTime en lugar de start_time y end_time
    if (entry.endTime && entry.startTime) {
      try {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return total + (end.getTime() - start.getTime()) / (1000 * 60);
        }
      } catch (error) {
        console.warn("Error calculando tiempo:", error);
      }
    }
    // Fallback para la propiedad durationMinutes si está disponible
    if (entry.durationMinutes) {
      return total + entry.durationMinutes;
    }
    return total;
  }, 0);

  const totalManualMinutes = manualTimeEntries.reduce(
    (total: number, entry: any) => {
      // El backend devuelve durationMinutes como minutos totales
      const durationMinutes = entry.durationMinutes || 0;
      return total + durationMinutes;
    },
    0
  );

  const totalMinutes = totalTimerMinutes + totalManualMinutes;

  const handleAddManualTime = async () => {
    if (!caseControl || !manualTimeForm.description.trim()) return;

    setIsSubmitting(true);
    try {
      await addManualTimeMutation.mutateAsync({
        caseControlId: caseControl.id,
        description: manualTimeForm.description,
        durationHours: manualTimeForm.hours,
        durationMinutes: manualTimeForm.minutes,
        date: manualTimeForm.date,
      });

      setManualTimeForm({
        description: "",
        hours: 0,
        minutes: 0,
        date: getTodayDateString(),
      });
      setShowManualTimeForm(false);
    } catch (error) {
      console.error("Error adding manual time:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    const confirmed = await confirmDelete("entrada de tiempo");
    if (confirmed) {
      try {
        await deleteTimeEntryMutation.mutateAsync(entryId);
        success("Entrada de tiempo eliminada exitosamente");
      } catch (error) {
        console.error("Error deleting time entry:", error);
        showErrorToast("Error al eliminar la entrada de tiempo");
      }
    }
  };

  const handleDeleteManualEntry = async (entryId: string) => {
    const confirmed = await confirmDelete("entrada manual");
    if (confirmed) {
      try {
        await deleteManualTimeMutation.mutateAsync(entryId);
        success("Entrada manual eliminada exitosamente");
      } catch (error) {
        console.error("Error deleting manual entry:", error);
        showErrorToast("Error al eliminar la entrada manual");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de Control de Caso"
    >
      <div className="space-y-6">
        {/* Información del Caso */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {caseControl.case?.numeroCaso || `Caso ${caseControl.caseId}`}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {caseControl.case?.descripcion || "Sin descripción"}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Estado: {caseControl.status?.name || "Sin estado"}</span>
            <span>
              Clasificación:{" "}
              {caseControl.case?.clasificacion || "Sin clasificación"}
            </span>
          </div>
        </div>

        {/* Resumen de Tiempo Total */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ActionIcon action="time" size="md" color="info" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Tiempo Total Registrado
            </h4>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatTimeDetailed(totalMinutes)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Tiempo por Timer:
              </span>
              <br />
              <span className="font-medium">
                {formatTimeDetailed(totalTimerMinutes)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Tiempo Manual:
              </span>
              <br />
              <span className="font-medium">
                {formatTimeDetailed(totalManualMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Botón para agregar tiempo manual */}
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Historial de Tiempo
          </h4>
          <Button
            onClick={() => setShowManualTimeForm(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <ActionIcon action="add" size="sm" />
            Agregar Tiempo Manual
          </Button>
        </div>

        {/* Formulario de tiempo manual */}
        {showManualTimeForm && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-gray-900 dark:text-white">
                Agregar Tiempo Manual
              </h5>
              <button
                onClick={() => setShowManualTimeForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <ActionIcon action="close" size="md" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Descripción"
                value={manualTimeForm.description}
                onChange={(e) =>
                  setManualTimeForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe la actividad realizada..."
                required
              />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Horas"
                  type="number"
                  min="0"
                  max="23"
                  value={manualTimeForm.hours}
                  onChange={(e) =>
                    setManualTimeForm((prev) => ({
                      ...prev,
                      hours: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <Input
                  label="Minutos"
                  type="number"
                  min="0"
                  max="59"
                  value={manualTimeForm.minutes}
                  onChange={(e) =>
                    setManualTimeForm((prev) => ({
                      ...prev,
                      minutes: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <Input
                  label="Fecha"
                  type="date"
                  value={manualTimeForm.date}
                  onChange={(e) =>
                    setManualTimeForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddManualTime}
                  disabled={!manualTimeForm.description.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Tiempo"}
                </Button>
                <Button
                  onClick={() => setShowManualTimeForm(false)}
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de entradas de tiempo */}
        <div className="space-y-4">
          {/* Entradas del Timer */}
          {timeEntries.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ActionIcon action="time" size="sm" />
                Entradas de Timer ({timeEntries.length})
              </h5>
              <div className="space-y-2">
                {timeEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <ActionIcon action="calendar" size="sm" />
                          {formatDate(entry.startTime || entry.start_time)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatDateLocal(
                              entry.startTime || entry.start_time,
                              "HH:mm"
                            )}
                          </span>
                          {(entry.endTime || entry.end_time) && (
                            <>
                              <span className="mx-2">→</span>
                              <span className="font-medium">
                                {formatDateLocal(
                                  entry.endTime || entry.end_time,
                                  "HH:mm"
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        {(entry.endTime || entry.end_time) && (
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                            Duración:{" "}
                            {(() => {
                              try {
                                const endTime = new Date(
                                  entry.endTime || entry.end_time
                                );
                                const startTime = new Date(
                                  entry.startTime || entry.start_time
                                );
                                if (
                                  isNaN(endTime.getTime()) ||
                                  isNaN(startTime.getTime())
                                ) {
                                  return "Duración no válida";
                                }
                                const minutes =
                                  (endTime.getTime() - startTime.getTime()) /
                                  (1000 * 60);
                                return formatTimeDetailed(minutes);
                              } catch (error) {
                                return "Duración no válida";
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTimeEntry(entry.id)}
                        className="text-red-400 hover:text-red-600 ml-2"
                        title="Eliminar entrada"
                      >
                        <ActionIcon action="delete" size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entradas Manuales */}
          {manualTimeEntries.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ActionIcon action="add" size="sm" />
                Entradas Manuales ({manualTimeEntries.length})
              </h5>
              <div className="space-y-2">
                {manualTimeEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <ActionIcon action="calendar" size="sm" />
                          {formatDate(entry.date)}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {entry.description}
                        </p>
                        <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Duración:{" "}
                          {formatTimeDetailed(entry.durationMinutes || 0)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteManualEntry(entry.id)}
                        className="text-red-400 hover:text-red-600 ml-2"
                        title="Eliminar entrada"
                      >
                        <ActionIcon action="delete" size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {timeEntries.length === 0 && manualTimeEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ActionIcon
                action="time"
                size="xl"
                color="neutral"
                className="mx-auto mb-3"
              />
              <p>No hay registros de tiempo para este caso.</p>
              <p className="text-sm">
                Inicia el timer o agrega tiempo manualmente.
              </p>
            </div>
          )}
        </div>
      </div>

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
    </Modal>
  );
};

export default CaseControlDetailsModal;
