import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { useToast as useToastContext } from "../../contexts/ToastContext";
import { auditService } from "../../services/audit.service";
import {
  AuditLog,
  AuditLogFilters,
  AuditLogResponse,
  AuditAction,
  AuditModule,
  AuditEntityType,
  getActionLabel,
  getModuleLabel,
  getEntityTypeLabel,
  getActionColor,
  AUDIT_ACTION_OPTIONS,
  AUDIT_MODULE_OPTIONS,
  AUDIT_ENTITY_TYPE_OPTIONS,
  AUDIT_VALIDATION,
} from "../../types/audit";

interface AuditLogsPageProps {}

const AuditLogsPage: React.FC<AuditLogsPageProps> = () => {
  // Estados principales
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: AUDIT_VALIDATION.DEFAULT_PAGE_SIZE as number,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Estados de filtros
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: AUDIT_VALIDATION.DEFAULT_PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // Estados de UI
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { success, error: showErrorToast } = useToastContext();

  // Cargar logs al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadLogs();
  }, [filters]);

  // Cargar logs con debounce para la búsqueda
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response: AuditLogResponse = await auditService.getAuditLogs(
        filters
      );

      setLogs(response.logs || []);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
      });
    } catch (error) {
      console.error("Error al cargar logs de auditoría:", error);
      showErrorToast("Error al cargar los logs de auditoría");
      // Reset logs to empty array on error
      setLogs([]);
      setPagination({
        page: 1,
        limit: AUDIT_VALIDATION.DEFAULT_PAGE_SIZE as number,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, showErrorToast]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Resetear a la primera página cuando cambian los filtros
    }));
  };

  // Aplicar búsqueda con debounce
  const handleSearch = useCallback(() => {
    handleFilterChange("searchTerm", searchTerm);
  }, [searchTerm]);

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: AUDIT_VALIDATION.DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    setSearchTerm("");
  };

  // Ver detalles de un log
  const viewLogDetails = async (log: AuditLog) => {
    try {
      const fullLog = await auditService.getAuditLogDetails(log.id);
      setSelectedLog(fullLog);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Error al cargar detalles del log:", error);
      showErrorToast("Error al cargar los detalles del log");
    }
  };

  // Exportar logs
  const exportLogs = async (format: "JSON" | "CSV" | "XLSX") => {
    try {
      const blob = await auditService.exportAuditLogs({
        format,
        filters,
        includeChanges: true,
      });

      const filename = `audit_logs_${new Date().toISOString().split("T")[0]}`;
      auditService.downloadFile(blob, filename, format);

      success(`Logs exportados exitosamente en formato ${format}`);
    } catch (error) {
      console.error("Error al exportar logs:", error);
      showErrorToast("Error al exportar los logs");
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Auditoría
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitoreo completo de todas las operaciones del sistema
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsFiltersPanelOpen(!isFiltersPanelOpen)}
            className="flex items-center gap-2"
          >
            <ActionIcon action="filter" className="w-4 h-4" />
            Filtros
          </Button>

          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportLogs("CSV")}
              title="Exportar CSV"
              className="flex items-center gap-1"
            >
              <ActionIcon action="download" className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportLogs("XLSX")}
              title="Exportar Excel"
              className="flex items-center gap-1"
            >
              <ActionIcon action="download" className="w-4 h-4" />
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportLogs("JSON")}
              title="Exportar JSON"
              className="flex items-center gap-1"
            >
              <ActionIcon action="download" className="w-4 h-4" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {isFiltersPanelOpen && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda general */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Búsqueda general
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ActionIcon action="search" className="w-4 h-4" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Filtro por acción */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Acción</Label>
              <Select
                value={filters.action || ""}
                onChange={(e) =>
                  handleFilterChange("action", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todas las acciones</option>
                {AUDIT_ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getActionLabel(option.value as AuditAction)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por módulo */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Módulo</Label>
              <Select
                value={filters.module || ""}
                onChange={(e) =>
                  handleFilterChange("module", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos los módulos</option>
                {AUDIT_MODULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getModuleLabel(option.value as AuditModule)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por tipo de entidad */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Tipo de Entidad
              </Label>
              <Select
                value={filters.entityType || ""}
                onChange={(e) =>
                  handleFilterChange("entityType", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos los tipos</option>
                {AUDIT_ENTITY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {getEntityTypeLabel(option.value as AuditEntityType)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Filtro por fecha inicio */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Fecha desde
              </Label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filtro por fecha fin */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Fecha hasta
              </Label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  handleFilterChange("endDate", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filtro por usuario */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                Usuario
              </Label>
              <Input
                placeholder="Email del usuario"
                value={filters.userEmail || ""}
                onChange={(e) =>
                  handleFilterChange("userEmail", e.target.value || undefined)
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Filtro por éxito de operación */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Estado</Label>
              <Select
                value={filters.operationSuccess?.toString() || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "operationSuccess",
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true"
                  )
                }
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="true">Exitosos</option>
                <option value="false">Con errores</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <ActionIcon action="restore" className="w-4 h-4" />
              Limpiar Filtros
            </Button>
            <Button
              onClick={() => setIsFiltersPanelOpen(false)}
              className="flex items-center gap-1"
            >
              <ActionIcon action="close" className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </Card>
      )}

      {/* Tabla de logs */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logs de Auditoría ({pagination.total} registros)
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Usuario
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Acción
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Módulo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Entidad
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs && Array.isArray(logs) && logs.length > 0 ? (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {log.userName || log.userEmail}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {log.userRole}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={getActionColor(log.action)}
                            >
                              {getActionLabel(log.action)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {getModuleLabel(log.module as AuditModule)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {getEntityTypeLabel(
                                  log.entityType as AuditEntityType
                                )}
                              </div>
                              {log.entityName && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  {log.entityName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                log.operationSuccess ? "success" : "danger"
                              }
                            >
                              {log.operationSuccess ? "Exitoso" : "Error"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewLogDetails(log)}
                              className="flex items-center gap-1"
                            >
                              <ActionIcon action="view" className="w-4 h-4" />
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <ActionIcon
                              action="info"
                              className="w-8 h-8 text-gray-400"
                            />
                            <p className="text-gray-500 dark:text-gray-400">
                              No se encontraron logs de auditoría
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {logs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <ActionIcon
                      action="info"
                      className="w-8 h-8 text-gray-400"
                    />
                    <p className="text-gray-500 dark:text-gray-400">
                      No se encontraron logs de auditoría con los filtros
                      aplicados.
                    </p>
                  </div>
                </div>
              )}

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando{" "}
                    {Math.min(
                      (pagination.page - 1) * pagination.limit + 1,
                      pagination.total
                    )}
                    -
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} registros
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="flex items-center gap-1"
                    >
                      <ActionIcon action="back" className="w-4 h-4" />
                      Anterior
                    </Button>

                    <span className="flex items-center px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="flex items-center gap-1"
                    >
                      Siguiente
                      <ActionIcon action="arrowRight" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Modal de detalles del log */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalles del Log de Auditoría"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha y Hora
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(selectedLog.createdAt)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Usuario
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.userName || selectedLog.userEmail} (
                  {selectedLog.userRole})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Acción
                </Label>
                <Badge className={getActionColor(selectedLog.action)}>
                  {getActionLabel(selectedLog.action)}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </Label>
                <Badge
                  variant={selectedLog.operationSuccess ? "success" : "danger"}
                >
                  {selectedLog.operationSuccess ? "Exitoso" : "Error"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Módulo
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {getModuleLabel(selectedLog.module as AuditModule)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tipo de Entidad
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {getEntityTypeLabel(
                    selectedLog.entityType as AuditEntityType
                  )}
                </p>
              </div>
              {selectedLog.entityName && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre de Entidad
                  </Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.entityName}
                  </p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Dirección IP
                  </Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              )}
              {selectedLog.ipGeolocation &&
                !selectedLog.ipGeolocation.isPrivateIp && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ubicación
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {[
                        selectedLog.ipGeolocation.city,
                        selectedLog.ipGeolocation.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Desconocida"}
                    </p>
                  </div>
                )}
              {selectedLog.ipGeolocation?.isp && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ISP / Proveedor
                  </Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.ipGeolocation.isp}
                  </p>
                </div>
              )}
              {selectedLog.requestPath && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ruta de Request
                  </Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedLog.requestMethod} {selectedLog.requestPath}
                  </p>
                </div>
              )}
            </div>

            {/* Mensaje de error si existe */}
            {selectedLog.errorMessage && (
              <div>
                <Label className="text-sm font-medium text-red-500 dark:text-red-400">
                  Mensaje de Error
                </Label>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mt-1">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Cambios realizados */}
            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cambios Realizados
                </Label>
                <div className="mt-2 space-y-2">
                  {selectedLog.changes.map((change, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {change.fieldName}
                        </div>
                        <Badge variant="secondary">{change.changeType}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {change.oldValue && (
                          <div>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              Valor anterior:
                            </span>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              {change.oldValue}
                            </p>
                          </div>
                        )}
                        {change.newValue && (
                          <div>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Valor nuevo:
                            </span>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              {change.newValue}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contexto de operación */}
            {selectedLog.operationContext &&
              Object.keys(selectedLog.operationContext).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Contexto de Operación
                  </Label>
                  <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded p-3 mt-1">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.operationContext, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
