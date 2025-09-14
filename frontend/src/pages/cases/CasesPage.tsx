import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AddIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  ActionIcon,
} from "../../components/ui/ActionIcons";
import {
  caseService,
  origensApi,
  applicationsApi,
  type Case,
  type Origin,
  type Application,
} from "../../services/api";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { CaseExportButtons } from "../../components/cases/CaseExportButtons";
import {
  formatDateLocal,
  getComplexityColor,
  getStatusColor,
} from "../../utils/caseUtils";

export const CasesPage: React.FC = () => {
  const location = useLocation();

  // Estados principales
  const [cases, setCases] = useState<Case[]>([]);
  const [origenes, setOrigenes] = useState<Origin[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrigen, setSelectedOrigen] = useState("");
  const [selectedAplicacion, setSelectedAplicacion] = useState("");
  const [selectedComplexity, setSelectedComplexity] = useState("");

  // Estado para modal de confirmación
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    caseId: string;
    caseNumber: string;
  }>({
    isOpen: false,
    caseId: "",
    caseNumber: "",
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Refrescar datos cuando navegues de vuelta a esta página
  useEffect(() => {
    // Solo refrescar si hay un state específico que indica refresh
    if (location.state?.refresh) {
      loadData();
    }
  }, [location.state?.refresh]);

  const loadData = async () => {
    // Evitar múltiples llamadas simultáneas
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);

      // Solo mostrar loading en la carga inicial
      if (cases.length === 0) {
        setIsLoading(true);
      }

      // Cargar casos, orígenes y aplicaciones en paralelo
      const [casesData, origenesData, aplicacionesData] = await Promise.all([
        caseService.getAllCases(),
        origensApi.getAll(),
        applicationsApi.getAll(),
      ]);

      setCases(casesData || []);
      setOrigenes(origenesData || []);
      setAplicaciones(aplicacionesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar los datos");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Filtrar casos
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    return cases.filter((caso) => {
      const matchesSearch = caso.numeroCaso
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesOrigen =
        !selectedOrigen || caso.origin?.id === selectedOrigen;
      const matchesAplicacion =
        !selectedAplicacion || caso.application?.id === selectedAplicacion;
      const matchesComplexity =
        !selectedComplexity || caso.clasificacion === selectedComplexity;

      return (
        matchesSearch && matchesOrigen && matchesAplicacion && matchesComplexity
      );
    });
  }, [
    cases,
    searchTerm,
    selectedOrigen,
    selectedAplicacion,
    selectedComplexity,
  ]);

  const handleDelete = async (caseId: string) => {
    try {
      await caseService.deleteCase(caseId);
      await loadData(); // Recargar datos después de eliminar
      setDeleteModal({ isOpen: false, caseId: "", caseNumber: "" });
    } catch (error) {
      console.error("Error deleting case:", error);
      setError("Error al eliminar el caso");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOrigen("");
    setSelectedAplicacion("");
    setSelectedComplexity("");
  };

  // Helper functions for notifications
  const showSuccess = (message: string) => {
    setNotification({ message, type: "success" });
    setTimeout(() => setNotification(null), 3000);
  };

  const showError = (message: string) => {
    setNotification({ message, type: "error" });
    setTimeout(() => setNotification(null), 3000);
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="btn-base btn-primary btn-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Casos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra y realiza seguimiento de todos los casos del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CaseExportButtons
              filteredCases={filteredCases}
              onSuccess={showSuccess}
              onError={showError}
            />
            <Link
              to="/cases/new"
              className="btn-base btn-primary btn-sm flex items-center justify-center gap-2 link-btn min-w-[140px]"
            >
              <AddIcon size="sm" />
              Nuevo Caso
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <SearchIcon size="sm" color="neutral" />
              </div>
              <input
                type="text"
                placeholder="Buscar por número de caso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filtro por Origen */}
            <select
              value={selectedOrigen}
              onChange={(e) => setSelectedOrigen(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los orígenes</option>
              {origenes.map((origen) => (
                <option key={origen.id} value={origen.id}>
                  {origen.nombre}
                </option>
              ))}
            </select>

            {/* Filtro por Aplicación */}
            <select
              value={selectedAplicacion}
              onChange={(e) => setSelectedAplicacion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las aplicaciones</option>
              {aplicaciones.map((aplicacion) => (
                <option key={aplicacion.id} value={aplicacion.id}>
                  {aplicacion.nombre}
                </option>
              ))}
            </select>

            {/* Filtro por Complejidad */}
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las complejidades</option>
              <option value="Baja Complejidad">Baja Complejidad</option>
              <option value="Complejidad Media">Complejidad Media</option>
              <option value="Alta Complejidad">Alta Complejidad</option>
              <option value="Complejidad Crítica">Complejidad Crítica</option>
            </select>

            {/* Botón limpiar filtros */}
            <Button onClick={clearFilters} variant="secondary">
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ActionIcon
                  action="document"
                  size="lg"
                  color="blue"
                  title="Total de casos"
                />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Casos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cases.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ActionIcon
                  action="check"
                  size="lg"
                  color="green"
                  title="Casos activos"
                />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Casos Activos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cases.filter((c) => c.estado !== "cerrado").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ActionIcon
                  action="warning"
                  size="lg"
                  color="yellow"
                  title="Casos de alta complejidad"
                />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Alta Complejidad
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    cases.filter((c) => c.clasificacion === "Alta Complejidad")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <ActionIcon
                  action="filter"
                  size="lg"
                  color="red"
                  title="Casos filtrados"
                />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Filtrados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredCases.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de casos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aplicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Complejidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {cases.length === 0
                        ? "No hay casos registrados"
                        : "No se encontraron casos que coincidan con los filtros"}
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((caso) => (
                    <tr
                      key={caso.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {caso.numeroCaso}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {caso.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {caso.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {caso.origin?.nombre || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {caso.application?.nombre || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDateLocal(caso.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplexityColor(
                              caso.clasificacion
                            )}`}
                          >
                            {caso.clasificacion}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {caso.puntuacion
                              ? `${Math.round(caso.puntuacion)}/15`
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            caso.estado
                          )}`}
                        >
                          {caso.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/cases/view/${caso.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                          >
                            <ViewIcon size="sm" title="Ver detalles del caso" />
                          </Link>
                          <Link
                            to={`/cases/edit/${caso.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                          >
                            <EditIcon size="sm" title="Editar caso" />
                          </Link>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                caseId: caso.id,
                                caseNumber: caso.numeroCaso,
                              })
                            }
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                          >
                            <DeleteIcon size="sm" title="Eliminar caso" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, caseId: "", caseNumber: "" })
        }
        onConfirm={() => handleDelete(deleteModal.caseId)}
        title="Eliminar Caso"
        message={`¿Estás seguro de que quieres eliminar el caso "${deleteModal.caseNumber}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Notificaciones */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}
    </PageWrapper>
  );
};
