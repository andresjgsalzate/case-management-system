import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useModulePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContext";

export const SmartRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allowedModules } = useModulePermissions();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Solo ejecutar si estamos en la ruta raíz
    if (location.pathname !== "/") return;

    // Esperar a que el usuario esté autenticado y los permisos cargados
    if (!isAuthenticated || !user) {
      console.log("⏳ Esperando autenticación...");
      return;
    }

    // Dar un pequeño delay para asegurar que los permisos se han cargado
    const timer = setTimeout(() => {
      console.log("� SmartRedirect ejecutándose...");
      console.log("👤 Usuario:", user?.email, user?.roleName);
      console.log("�📊 Módulos permitidos:", allowedModules);
      console.log("📊 Total módulos permitidos:", allowedModules.length);

      // Orden de prioridad para la redirección
      const priorityOrder = [
        "/cases", // Casos
        "/todos", // TODOs
        "/notes", // Notas
        "/knowledge", // Base de Conocimiento
        "/case-control", // Control de Casos
        "/dispositions", // Disposiciones
        "/archive", // Archivo
      ];

      // Encontrar el primer módulo disponible según la prioridad
      const availableModule = priorityOrder.find((route) => {
        const hasModule = allowedModules.some(
          (module) => module.href === route
        );
        console.log(`🔍 Verificando ${route}: ${hasModule ? "✅" : "❌"}`);
        return hasModule;
      });

      if (availableModule) {
        console.log(`✅ Redirigiendo a: ${availableModule}`);
        navigate(availableModule, { replace: true });
      } else {
        // Si no tiene acceso a ningún módulo, mostrar mensaje de error
        console.log("❌ Usuario sin permisos para acceder a ningún módulo");
        console.log(
          "📋 Módulos disponibles:",
          allowedModules.map((m) => m.href)
        );
        navigate("/unauthorized", { replace: true });
      }
    }, 1000); // Aumentar a 1 segundo para dar más tiempo

    return () => clearTimeout(timer);
  }, [allowedModules, navigate, location.pathname, isAuthenticated, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Redirigiendo al módulo apropiado...
        </p>
      </div>
    </div>
  );
};
