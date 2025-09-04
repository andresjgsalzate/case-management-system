import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sistema de Gestión de Casos
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{user?.fullName}</span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                ({user?.roleName})
              </span>
            </div>

            <Button variant="secondary" size="sm" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
