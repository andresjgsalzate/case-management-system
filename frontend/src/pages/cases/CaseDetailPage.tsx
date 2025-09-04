import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caso, setCaso] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      // Aquí haremos la llamada a la API para cargar el caso
      setIsLoading(true);

      // Simular datos hasta que conectemos con la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Datos de ejemplo
      setCaso({
        id: id,
        numeroCaso: "CASO-2024-001",
        titulo: "Ejemplo de caso",
        descripcion: "Descripción del caso de ejemplo",
        clasificacion: "Media Complejidad",
        estado: "En Proceso",
        prioridad: "Alta",
        fechaCreacion: "2024-01-15",
        fechaVencimiento: "2024-01-30",
        solicitante: "Juan Pérez",
        correoSolicitante: "juan.perez@example.com",
        telefonoSolicitante: "555-0123",
        tipoDocumento: "Oficio",
        numeroDocumento: "OF-001-2024",
        observaciones: "Observaciones del caso",
        etiquetas: ["urgente", "sistema"],
        puntuacion: 85,
      });
    } catch (error) {
      console.error("Error al cargar el caso:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este caso?")) {
      try {
        // Aquí haremos la llamada a la API para eliminar
        console.log("Eliminando caso:", id);
        navigate("/cases");
      } catch (error) {
        console.error("Error al eliminar el caso:", error);
      }
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Asignado":
        return "bg-blue-100 text-blue-800";
      case "En Proceso":
        return "bg-yellow-100 text-yellow-800";
      case "Completado":
        return "bg-green-100 text-green-800";
      case "Cerrado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getComplexityColor = (clasificacion: string) => {
    switch (clasificacion) {
      case "Baja Complejidad":
        return "bg-green-100 text-green-800";
      case "Media Complejidad":
        return "bg-yellow-100 text-yellow-800";
      case "Alta Complejidad":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Baja":
        return "bg-gray-100 text-gray-800";
      case "Media":
        return "bg-blue-100 text-blue-800";
      case "Alta":
        return "bg-orange-100 text-orange-800";
      case "Crítica":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Cargando caso...</span>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Caso no encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          El caso que buscas no existe o no tienes permisos para verlo.
        </p>
        <div className="mt-6">
          <Link
            to="/cases"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Volver a Casos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/cases"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="-ml-1 mr-1 h-5 w-5" aria-hidden="true" />
          Volver a Casos
        </Link>
      </div>

      {/* Header */}
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {caso.numeroCaso}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon className="mr-1.5 h-5 w-5 text-gray-400" />
              Creado: {new Date(caso.fechaCreacion).toLocaleDateString()}
            </div>
            {caso.fechaVencimiento && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <ClockIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                Vence: {new Date(caso.fechaVencimiento).toLocaleDateString()}
              </div>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <UserIcon className="mr-1.5 h-5 w-5 text-gray-400" />
              {caso.solicitante || "Sin asignar"}
            </div>
          </div>
        </div>
        <div className="mt-5 flex lg:mt-0 lg:ml-4">
          <span className="hidden sm:block">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Editar
            </button>
          </span>

          <span className="ml-3 hidden sm:block">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Eliminar
            </button>
          </span>
        </div>
      </div>

      {/* Estados y métricas */}
      <div className="mt-8">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
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
              <div className="mt-1 text-sm text-gray-500">Estado</div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
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
              <div className="mt-1 text-sm text-gray-500">Complejidad</div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex px-2 text-xs font-semibold rounded-full ${getPriorityColor(
                      caso.prioridad
                    )}`}
                  >
                    {caso.prioridad}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">Prioridad</div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-lg font-medium text-gray-900">
                    {Math.round(caso.puntuacion)}/15
                  </div>
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">Puntuación</div>
            </div>
          </div>
        </dl>
      </div>

      {/* Contenido principal */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {caso.titulo}
              </h3>
              <div className="prose prose-sm text-gray-500">
                <p>{caso.descripcion}</p>
              </div>

              {caso.observaciones && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Observaciones
                  </h4>
                  <p className="text-sm text-gray-500">{caso.observaciones}</p>
                </div>
              )}

              {caso.etiquetas && caso.etiquetas.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    <TagIcon className="inline h-4 w-4 mr-1" />
                    Etiquetas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {caso.etiquetas.map((etiqueta: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {etiqueta}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información lateral */}
        <div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Detalles del Caso
              </h3>

              <dl className="space-y-3">
                {caso.tipoDocumento && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <DocumentIcon className="h-4 w-4 mr-1" />
                      Tipo de Documento
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {caso.tipoDocumento}
                    </dd>
                  </div>
                )}

                {caso.numeroDocumento && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Número de Documento
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {caso.numeroDocumento}
                    </dd>
                  </div>
                )}

                {caso.solicitante && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Solicitante
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {caso.solicitante}
                    </dd>
                  </div>
                )}

                {caso.correoSolicitante && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Correo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a
                        href={`mailto:${caso.correoSolicitante}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {caso.correoSolicitante}
                      </a>
                    </dd>
                  </div>
                )}

                {caso.telefonoSolicitante && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Teléfono
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a
                        href={`tel:${caso.telefonoSolicitante}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {caso.telefonoSolicitante}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Actividad Reciente
              </h3>
              <div className="text-sm text-gray-500">
                No hay actividad reciente registrada.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
