import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { VersionDisplay } from "./VersionDisplay";
import { DynamicNavigation } from "../navigation/DynamicNavigation";
import { PermissionIndicator } from "../PermissionIndicator";
import { useInactivityTimeout } from "../../hooks/useInactivityTimeout";
import { InactivityWarningModal } from "../InactivityWarningModal";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState(new Set<string>());
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Sistema de inactividad
  const { showWarning, remainingMinutes, extendSession } = useInactivityTimeout(
    {
      timeoutDuration: 30, // 30 minutos de inactividad
      warningDuration: 5, // Advertencia 5 minutos antes
      onTimeout: logout,
    }
  );

  const toggleDropdown = useCallback((sectionId: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
    setUserManuallyToggled(true);
    // Cerrar todos los dropdowns cuando se colapsa
    if (!isCollapsed) {
      setOpenDropdowns(new Set());
    }
  }, [isCollapsed]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowUserMenu(false);
        setOpenDropdowns(new Set());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-colapsar en móviles
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        if (!userManuallyToggled) {
          setIsCollapsed(true);
        }
      } else {
        if (!userManuallyToggled) {
          setIsCollapsed(false);
        }
      }
    };

    handleResize(); // Ejecutar al montar
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [userManuallyToggled]);

  // Efecto para aplicar clases CSS basadas en el estado de colapso
  useEffect(() => {
    const width = window.innerWidth;
    if (width < 768 && !userManuallyToggled) {
      setIsCollapsed(true);
    }
  }, [isCollapsed, userManuallyToggled]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Header con logo como botón de colapso */}
          <div className="flex-shrink-0 flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleCollapse}
              className="flex items-center w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 -mx-2 px-2 py-1"
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && (
                <h1 className="ml-3 text-lg font-bold text-gray-900 dark:text-white">
                  Gestión de Casos
                </h1>
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <DynamicNavigation
              isCollapsed={isCollapsed}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleDropdown}
            />
          </div>

          {/* User Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="relative p-4">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 ${
                  isCollapsed ? "justify-center" : "justify-between"
                }`}
                title={isCollapsed ? user?.fullName || "Usuario" : undefined}
              >
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="ml-3 text-left">
                      <div className="font-medium">
                        {user?.fullName || "Usuario"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.roleName || "Usuario"}
                      </div>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transform transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Dropdown menu */}
              {showUserMenu && !isCollapsed && (
                <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 mb-2 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        console.log("Navegar a Mi Perfil");
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <UserIcon className="h-4 w-4 mr-3" />
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => {
                        console.log("Navegar a Configuración");
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Configuración
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Toggle & Version - Centradas */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div
              className={`${
                isCollapsed
                  ? "flex flex-col items-center space-y-2"
                  : "flex flex-col items-center space-y-2"
              }`}
            >
              <ThemeToggle isCollapsed={isCollapsed} />
              <VersionDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto p-6">{children}</main>
      </div>

      {/* Permission Indicator for Development */}
      {typeof window !== "undefined" &&
        window.location.hostname === "localhost" && <PermissionIndicator />}

      {/* Modal de advertencia de inactividad */}
      <InactivityWarningModal
        isOpen={showWarning}
        onExtendSession={extendSession}
        onLogout={logout}
        remainingMinutes={remainingMinutes}
      />
    </div>
  );
};
