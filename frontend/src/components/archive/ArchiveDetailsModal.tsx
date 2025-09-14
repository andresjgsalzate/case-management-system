import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Modal } from "../ui/Modal";
import { ArchivedItem } from "../../types/archive.types";

interface ArchiveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ArchivedItem | null;
}

export const ArchiveDetailsModal: React.FC<ArchiveDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Elemento Archivado"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Header con tipo de elemento */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`p-3 rounded-full ${
              item.itemType === "case"
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-green-100 dark:bg-green-900"
            }`}
          >
            {item.itemType === "case" ? (
              <ActionIcon action="report" size="lg" color="blue" />
            ) : (
              <ActionIcon action="clipboard" size="lg" color="green" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {item.itemType === "case" ? "Caso" : "TODO"}: {item.title}
            </h3>
            {item.caseNumber && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Número de caso: {item.caseNumber}
              </p>
            )}
          </div>
          <div className="ml-auto">
            {item.isRestored && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Restaurado
              </span>
            )}
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Información General
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                {item.description && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {item.description}
                    </dd>
                  </div>
                )}

                {item.itemType === "case" && item.status && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.status}
                      </span>
                    </dd>
                  </div>
                )}

                {item.itemType === "case" && item.classification && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Clasificación
                    </dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {item.classification}
                      </span>
                    </dd>
                  </div>
                )}

                {item.itemType === "todo" && item.priority && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {item.priority}
                      </span>
                    </dd>
                  </div>
                )}

                {item.archivedByUser && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Archivado por
                    </dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                      <ActionIcon
                        action="user"
                        size="sm"
                        className="mr-1"
                        color="neutral"
                      />
                      {item.archivedByUser.fullName ||
                        item.archivedByUser.email}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Información de Fechas
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha de Archivo
                  </dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                    <ActionIcon
                      action="calendar"
                      size="sm"
                      className="mr-1"
                      color="neutral"
                    />
                    {new Date(item.archivedAt).toLocaleString("es-ES")}
                  </dd>
                </div>
              </div>

              {/* Información de tiempo (solo para TODOs) */}
              {item.itemType === "todo" && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Seguimiento de Tiempo
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <ActionIcon
                        action="time"
                        size="sm"
                        className="mr-2"
                        color="neutral"
                      />
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">
                        Tiempo Total:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.totalTimeMinutes && item.totalTimeMinutes > 0
                          ? `${Math.floor(item.totalTimeMinutes / 60)}h ${
                              item.totalTimeMinutes % 60
                            }m`
                          : "0 minutos"}
                      </dd>
                    </div>
                    {/* Desglose del tiempo */}
                    {((item.timerTimeMinutes && item.timerTimeMinutes > 0) ||
                      (item.manualTimeMinutes &&
                        item.manualTimeMinutes > 0)) && (
                      <div className="ml-6 space-y-1 text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {item.timerTimeMinutes && item.timerTimeMinutes > 0 && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span>
                              Cronómetro:{" "}
                              {Math.floor(item.timerTimeMinutes / 60)}h{" "}
                              {item.timerTimeMinutes % 60}m
                            </span>
                          </div>
                        )}
                        {item.manualTimeMinutes &&
                          item.manualTimeMinutes > 0 && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span>
                                Manual:{" "}
                                {Math.floor(item.manualTimeMinutes / 60)}h{" "}
                                {item.manualTimeMinutes % 60}m
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ID del elemento */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            ID del elemento: {item.id}
          </div>
        </div>
      </div>
    </Modal>
  );
};
