import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { ActionIcon } from "../components/ui/ActionIcons";

export const NoAccessPage: React.FC = () => {
  const { logout, user, isAuthenticated, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Icono de información */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-6">
              <ActionIcon action="info" size="xl" color="blue" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Registro Exitoso!
            </h1>

            {/* Subtítulo */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Tu cuenta ha sido creada correctamente
            </p>

            {/* Mensaje de bienvenida personalizado */}
            {user?.fullName && (
              <p className="text-md text-gray-700 dark:text-gray-200 mb-4">
                Bienvenido/a, <strong>{user.fullName}</strong>
              </p>
            )}

            {/* Panel informativo */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-5 mb-6 text-left">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ActionIcon action="warning" size="md" color="yellow" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Acceso Pendiente de Configuración
                  </h3>
                  <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    <p>
                      Tu cuenta aún no tiene permisos asignados para acceder al
                      sistema.
                    </p>
                    <p>
                      Por favor, <strong>contacta con un administrador</strong>{" "}
                      para que configure los roles y permisos necesarios para tu
                      perfil.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pasos a seguir */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                ¿Qué debes hacer?
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                <li>Comunícate con el administrador del sistema</li>
                <li>
                  Indica tu correo electrónico:{" "}
                  <strong className="text-gray-800 dark:text-gray-200">
                    {user?.email}
                  </strong>
                </li>
                <li>Solicita que te asignen los permisos correspondientes</li>
                <li>Una vez asignados, vuelve a iniciar sesión</li>
              </ol>
            </div>

            {/* Botón de cerrar sesión */}
            <Button onClick={handleLogout} variant="primary" className="w-full">
              <ActionIcon action="logout" size="sm" className="mr-2" />
              Cerrar Sesión
            </Button>

            {/* Información adicional */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Si tienes dudas o necesitas ayuda, contacta al equipo de soporte
                técnico.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoAccessPage;
