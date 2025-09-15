import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useModulePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContext";
import { useAuthStore } from "../stores/authStore";

export const SmartRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allowedModules } = useModulePermissions();
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const { isLoadingPermissions, permissionsLoaded } = useAuthStore();

  useEffect(() => {
    // Solo ejecutar si estamos en la ruta raíz
    if (location.pathname !== "/") return;

    // CRUCIAL: Esperar a que termine la carga Y que el usuario esté autenticado
    if (isLoading) {
      console.log("⏳ Cargando autenticación...");
      return;
    }

    // Si no está autenticado después de cargar, redirigir al login
    if (!isAuthenticated || !user) {
      console.log("❌ Usuario no autenticado, redirigiendo al login");
      navigate("/login", { replace: true });
      return;
    }

    // NUEVO: Esperar a que los permisos se carguen también
    if (isLoadingPermissions || !permissionsLoaded) {
      console.log("⏳ Esperando permisos para SmartRedirect...");
      return;
    }

    // Dar un pequeño delay para asegurar que los permisos se han cargado
    const timer = setTimeout(() => {
      console.log("🔄 SmartRedirect ejecutándose...");
      console.log("👤 Usuario:", user?.email, user?.roleName);
      console.log("� Módulos permitidos:", allowedModules);
      console.log("📊 Total módulos permitidos:", allowedModules.length);

      // Determinar la mejor ruta basándose en permisos específicos
      let targetRoute = "/unauthorized"; // Por defecto

      // Verificar acceso al dashboard (usando permisos reales de la BD)
      if (
        hasPermission("dashboard.ver.own") ||
        hasPermission("dashboard.ver.team") ||
        hasPermission("dashboard.ver.all") ||
        hasPermission("metrics.time.read.own") ||
        hasPermission("metrics.cases.read.own")
      ) {
        targetRoute = "/dashboard";
      }
      // Si no tiene acceso al dashboard, buscar otros módulos por prioridad
      else {
        const priorityOrder = [
          {
            route: "/cases",
            permissions: [
              "cases.view.own",
              "cases.view.team",
              "cases.view.all",
              "casos.ver.own",
              "casos.ver.team",
              "casos.ver.all",
            ],
          },
          {
            route: "/todos",
            permissions: [
              "todos.view.own",
              "todos.view.team",
              "todos.view.all",
              "todos.ver.own",
              "todos.ver.team",
              "todos.ver.all",
            ],
          },
          {
            route: "/notes",
            permissions: [
              "notes.view.own",
              "notes.view.team",
              "notes.view.all",
              "notas.ver.own",
              "notas.ver.team",
              "notas.ver.all",
            ],
          },
          {
            route: "/knowledge",
            permissions: [
              "knowledge.read.own",
              "knowledge.read.team",
              "knowledge.read.all",
            ],
          },
          {
            route: "/case-control",
            permissions: [
              "case_control.view.own",
              "case_control.view.team",
              "case_control.view.all",
              "control-casos.ver.own",
              "control-casos.ver.team",
              "control-casos.ver.all",
            ],
          },
          {
            route: "/dispositions",
            permissions: [
              "dispositions.view.own",
              "dispositions.view.team",
              "dispositions.view.all",
              "disposiciones.ver.own",
              "disposiciones.ver.team",
              "disposiciones.ver.all",
            ],
          },
          {
            route: "/archive",
            permissions: ["archive.view.own", "archive.view"],
          },
        ];

        // Buscar el primer módulo al que tenga acceso
        for (const moduleOption of priorityOrder) {
          const hasAccess = moduleOption.permissions.some((permission) =>
            hasPermission(permission)
          );
          if (hasAccess) {
            targetRoute = moduleOption.route;
            break;
          }
        }
      }

      console.log(`🎯 Ruta objetivo determinada: ${targetRoute}`);
      navigate(targetRoute, { replace: true });
    }, 1000); // Aumentar a 1 segundo para dar más tiempo

    return () => clearTimeout(timer);
  }, [
    allowedModules,
    navigate,
    location.pathname,
    isAuthenticated,
    isLoading,
    user,
    hasPermission,
    isLoadingPermissions,
    permissionsLoaded,
  ]);

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
