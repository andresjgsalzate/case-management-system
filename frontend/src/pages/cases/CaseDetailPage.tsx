import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { useCases } from "../../hooks/useCases";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../hooks/useNotification";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";

export const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { data: cases, isLoading, error } = useCases();

  const { success, error: showErrorToast } = useToast();
  const { confirmDangerAction, modalState, modalHandlers } =
    useConfirmationModal();

  // Buscar el caso por ID
  const caso = cases?.find((c) => c.id === id);

  const handleDelete = async () => {
    const confirmed = await confirmDangerAction(
      "Eliminar Caso",
      "¿Estás seguro de que quieres eliminar este caso? Esta acción no se puede deshacer."
    );

    if (confirmed) {
      try {
        console.log("Eliminando caso:", caso?.id);
        success("Caso eliminado exitosamente");
        navigate("/cases");
      } catch (error) {
        console.error("Error al eliminar el caso:", error);
        showErrorToast("Error al eliminar el caso");
      }
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "nuevo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "en_progreso":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "pendiente":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "resuelto":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getComplexityColor = (clasificacion: string) => {
    switch (clasificacion) {
      case "Baja Complejidad":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Media Complejidad":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Alta Complejidad":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Error al cargar el caso
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <Button onClick={() => navigate("/cases")} variant="primary">
              <ActionIcon action="back" size="lg" className="-ml-1 mr-2" />
              Volver a Casos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Caso no encontrado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              El caso con ID "{id}" no existe.
            </p>
            <Button onClick={() => navigate("/cases")} variant="primary">
              <ActionIcon action="back" size="lg" className="-ml-1 mr-2" />
              Volver a Casos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/cases"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ActionIcon action="back" size="lg" className="-ml-1 mr-1" />
            Volver a Casos
          </Link>
        </div>

        {/* Header */}
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
              {caso.numeroCaso}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ActionIcon
                  action="calendar"
                  size="lg"
                  color="gray"
                  className="mr-1.5"
                />
                Creado: {new Date(caso.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ActionIcon
                  action="user"
                  size="lg"
                  color="gray"
                  className="mr-1.5"
                />
                {caso.assignedTo
                  ? `Asignado a: ${
                      caso.assignedTo.fullName || caso.assignedTo.email
                    }`
                  : "Sin asignar"}
              </div>
            </div>
          </div>
          <div className="mt-5 flex lg:mt-0 lg:ml-4">
            <span className="hidden sm:block">
              <Button
                variant="secondary"
                onClick={() => setIsEditing(!isEditing)}
              >
                <ActionIcon action="edit" size="lg" className="-ml-1 mr-2" />
                Editar
              </Button>
            </span>

            <span className="ml-3 hidden sm:block">
              <Button variant="danger" onClick={handleDelete}>
                <ActionIcon action="delete" size="lg" className="-ml-1 mr-2" />
                Eliminar
              </Button>
            </span>
          </div>
        </div>

        {/* Estados y métricas */}
        <div className="mt-8">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(
                        caso.estado
                      )}`}
                    >
                      {caso.estado}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Estado
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex px-2 text-xs font-semibold rounded-full ${getComplexityColor(
                        caso.clasificacion
                      )}`}
                    >
                      {caso.clasificacion}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Complejidad
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {Math.round(caso.puntuacion)}/15
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Puntuación
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {caso.origin?.nombre || "Sin origen"}
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Origen
                </div>
              </div>
            </div>
          </dl>
        </div>

        {/* Contenido principal */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Información principal */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Caso: {caso.numeroCaso}
                </h3>
                <div className="prose prose-sm text-gray-500 dark:text-gray-400">
                  <p>{caso.descripcion}</p>
                </div>

                {caso.observaciones && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Observaciones
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {caso.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información lateral */}
          <div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Detalles del Caso
                </h3>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <ActionIcon
                        action="document"
                        size="sm"
                        className="mr-1"
                      />
                      Fecha de creación
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(caso.createdAt).toLocaleDateString()}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Última actualización
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(caso.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>

                  {caso.application?.nombre && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Aplicación
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {caso.application.nombre}
                      </dd>
                    </div>
                  )}

                  {caso.userId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Creado por
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        Usuario: {caso.userId}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Métricas de evaluación */}
            <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Métricas de Evaluación
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Historial del Caso
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {caso.historialCaso}/3
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Conocimiento del Módulo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {caso.conocimientoModulo}/3
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Manipulación de Datos
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {caso.manipulacionDatos}/3
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Claridad de Descripción
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {caso.claridadDescripcion}/3
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Causa de Fallo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {caso.causaFallo}/3
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
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
    </div>
  );
};
