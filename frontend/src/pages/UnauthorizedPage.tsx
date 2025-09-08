import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  HomeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../components/ui/Button";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Icono de advertencia */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <ShieldExclamationIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Acceso Denegado
            </h1>

            {/* Mensaje principal */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              No tienes permisos para acceder a este recurso
            </p>

            {/* Descripción detallada */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Recursos restringidos
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Esta página requiere permisos especiales que tu cuenta
                      actual no posee. Si crees que deberías tener acceso,
                      contacta con tu administrador.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 space-y-1">
              <p>Código de error: 403</p>
              <p>Si el problema persiste, contacta al soporte técnico</p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGoBack} variant="secondary">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver atrás
              </Button>

              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Ir al inicio
              </Link>
            </div>

            {/* Información de contacto */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Necesitas ayuda? Contacta al administrador del sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
