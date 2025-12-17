import React, { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { securityService } from "../services/security.service";

export const ForceLogout: React.FC = () => {
  const { logout } = useAuthStore();

  useEffect(() => {
    const forceCleanLogout = async () => {
      console.log("🧹 Forzando limpieza completa de sesión...");

      // Limpiar todo posible storage
      localStorage.clear();
      sessionStorage.clear();

      // Usar el logout del store
      logout();

      // Limpiar security service
      securityService.clearSession();

      // Esperar un momento y redirigir a login
      setTimeout(() => {
        window.location.href = "/login?cleaned=true";
      }, 1000);
    };

    forceCleanLogout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Limpiando sesión...</p>
        </div>
      </div>
    </div>
  );
};
