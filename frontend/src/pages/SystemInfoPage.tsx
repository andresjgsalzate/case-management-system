import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ActionIcon } from "../components/ui/ActionIcons";
import { Modal } from "../components/ui/Modal";
import {
  systemInfoService,
  SystemInfoService,
  type SystemInfo,
  type SystemModule,
  type SystemChangelog,
} from "../services/systemInfo.service";

interface TabProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`}
  >
    <Icon className="w-5 h-5 mr-2" />
    {label}
  </button>
);

const ModuleCard: React.FC<{
  module: SystemModule;
  onShowDetails: (module: SystemModule) => void;
}> = ({ module, onShowDetails }) => {
  const statusColor = SystemInfoService.getModuleStatusColor(module.status);
  const statusText = SystemInfoService.getModuleStatusText(module.status);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {module.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {module.description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            v{module.version}
          </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Características
          </h4>
          <ul className="space-y-1">
            {module.features.slice(0, 5).map((feature, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
              >
                <ActionIcon
                  action="verified"
                  size="sm"
                  variant="success"
                  className="mr-2 mt-0.5 flex-shrink-0"
                />
                {feature}
              </li>
            ))}
            {module.features.length > 5 && (
              <li className="text-sm text-gray-500 dark:text-gray-400 italic">
                <button
                  onClick={() => onShowDetails(module)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  +{module.features.length - 5} características más...
                </button>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endpoints ({module.endpoints.length})
          </h4>
          <div className="flex flex-wrap gap-1">
            {module.endpoints.slice(0, 3).map((endpoint, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-mono"
              >
                {endpoint}
              </span>
            ))}
            {module.endpoints.length > 3 && (
              <button
                onClick={() => onShowDetails(module)}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                +{module.endpoints.length - 3} más
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 border-l-4 border-blue-500 pl-4"
          >
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="text-xl font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3"
          >
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h4
            key={index}
            className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2"
          >
            {line.slice(5)}
          </h4>
        );
      }

      // Lists
      if (line.startsWith("- ")) {
        const listContent = line.slice(2);
        // Procesar texto en negrilla dentro de las listas
        const processedContent = listContent.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>'
        );

        return (
          <div key={index} className="flex items-start mb-2">
            <span className="text-blue-500 mr-3 mt-1">•</span>
            <span
              className="text-gray-600 dark:text-gray-400 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>
        );
      }

      // Procesar texto en negrilla para párrafos normales
      const boldText = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>'
      );

      // Empty lines - dar más espacio
      if (line.trim() === "") {
        return <div key={index} className="h-4" />;
      }

      // Regular paragraphs
      return (
        <p
          key={index}
          className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldText }}
        />
      );
    });
  };

  return (
    <div className="prose prose-sm max-w-none space-y-2">
      {renderMarkdown(content)}
    </div>
  );
};

const ModuleDetailModal: React.FC<{
  module: SystemModule | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ module, isOpen, onClose }) => {
  if (!module) return null;

  const statusColor = SystemInfoService.getModuleStatusColor(module.status);
  const statusText = SystemInfoService.getModuleStatusText(module.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={module.name} size="lg">
      <div className="space-y-6">
        {/* Header with status and version */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {module.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              v{module.version}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* All Features */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Características ({module.features.length})
          </h4>
          <div className="grid gap-2">
            {module.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <ActionIcon
                  action="verified"
                  size="sm"
                  variant="success"
                  className="mr-3 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* All Endpoints */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Endpoints ({module.endpoints.length})
          </h4>
          <div className="grid gap-2">
            {module.endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {endpoint}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const SystemInfoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [changelog, setChangelog] = useState<SystemChangelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const [infoResponse, changelogResponse] = await Promise.allSettled([
        systemInfoService.getSystemInfo(),
        systemInfoService.getChangelog(),
      ]);

      if (infoResponse.status === "fulfilled" && infoResponse.value.success) {
        setSystemInfo(infoResponse.value.data || null);
      } else {
        console.error("Error loading system info:", infoResponse);
      }

      if (
        changelogResponse.status === "fulfilled" &&
        changelogResponse.value.success
      ) {
        setChangelog(changelogResponse.value.data || null);
      } else {
        console.error("Error loading changelog:", changelogResponse);
      }
    } catch (error) {
      console.error("Error loading system data:", error);
      setError("Error al cargar la información del sistema");
      toast.error("Error al cargar la información del sistema");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModuleDetails = (module: SystemModule) => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModule(null);
  };

  const tabs = [
    {
      id: "overview",
      label: "Información General",
      icon: ({ className }: { className?: string }) => (
        <ActionIcon action="info" size="md" className={className} />
      ),
    },
    {
      id: "modules",
      label: "Módulos",
      icon: ({ className }: { className?: string }) => (
        <ActionIcon action="modules" size="md" className={className} />
      ),
    },
    {
      id: "stats",
      label: "Estadísticas",
      icon: ({ className }: { className?: string }) => (
        <ActionIcon action="dashboard" size="md" className={className} />
      ),
    },
    {
      id: "changelog",
      label: "Changelog",
      icon: ({ className }: { className?: string }) => (
        <ActionIcon action="changelog" size="md" className={className} />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Cargando información del sistema...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ActionIcon action="error" size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={loadSystemInfo}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.name || "Sistema de Gestión de Casos"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {systemInfo?.description || "Información del sistema"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              v{systemInfo?.version || "1.1.0"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {systemInfo?.environment || "production"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex space-x-2 mb-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              {...tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === "overview" && systemInfo && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ActionIcon action="modules" size="lg" variant="blue" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-blue-900">
                        {systemInfo.stats.activeModules}
                      </p>
                      <p className="text-blue-600">Módulos Activos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ActionIcon action="dashboard" size="lg" variant="green" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-green-900">
                        {systemInfo.stats.totalEndpoints}
                      </p>
                      <p className="text-green-600">Endpoints API</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ActionIcon action="time" size="lg" variant="purple" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-purple-900">
                        {SystemInfoService.formatUptime(
                          systemInfo.stats.uptime
                        )}
                      </p>
                      <p className="text-purple-600">Tiempo Activo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información del Sistema
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Versión
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {systemInfo.version}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Entorno
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white capitalize">
                        {systemInfo.environment}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Fecha de Build
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {new Date(systemInfo.buildDate).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Estadísticas Generales
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total de Módulos
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {systemInfo.stats.totalModules}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Módulos Activos
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {systemInfo.stats.activeModules}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Endpoints
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {systemInfo.stats.totalEndpoints}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === "modules" && systemInfo && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Módulos del Sistema ({systemInfo.modules.length})
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Activos ({systemInfo.stats.activeModules})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemInfo.modules.map((module, index) => (
                  <ModuleCard
                    key={index}
                    module={module}
                    onShowDetails={handleShowModuleDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "stats" && systemInfo && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estadísticas Detalladas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Módulos</p>
                      <p className="text-3xl font-bold">
                        {systemInfo.stats.totalModules}
                      </p>
                    </div>
                    <ActionIcon
                      action="modules"
                      size="xl"
                      className="text-blue-200"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Módulos Activos</p>
                      <p className="text-3xl font-bold">
                        {systemInfo.stats.activeModules}
                      </p>
                    </div>
                    <ActionIcon
                      action="verified"
                      size="xl"
                      className="text-green-200"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Total Endpoints</p>
                      <p className="text-3xl font-bold">
                        {systemInfo.stats.totalEndpoints}
                      </p>
                    </div>
                    <ActionIcon
                      action="dashboard"
                      size="xl"
                      className="text-purple-200"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Tiempo Activo</p>
                      <p className="text-lg font-bold">
                        {SystemInfoService.formatUptime(
                          systemInfo.stats.uptime
                        )}
                      </p>
                    </div>
                    <ActionIcon
                      action="time"
                      size="xl"
                      className="text-orange-200"
                    />
                  </div>
                </div>
              </div>

              {/* Análisis por módulos */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Distribución de Endpoints por Módulo
                </h4>
                <div className="space-y-3">
                  {systemInfo.modules
                    .sort((a, b) => b.endpoints.length - a.endpoints.length)
                    .map((module, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${
                              SystemInfoService.getModuleStatusColor(
                                module.status
                              ).includes("green")
                                ? "bg-green-500"
                                : SystemInfoService.getModuleStatusColor(
                                    module.status
                                  ).includes("yellow")
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {module.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                              style={{
                                width: `${
                                  (module.endpoints.length /
                                    Math.max(
                                      ...systemInfo.modules.map(
                                        (m) => m.endpoints.length
                                      )
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                            {module.endpoints.length}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "changelog" && changelog && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registro de Cambios
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Última actualización:{" "}
                  {new Date(changelog.lastUpdate).toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 h-[32rem] overflow-y-auto">
                <MarkdownRenderer content={changelog.changelog} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModule}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
