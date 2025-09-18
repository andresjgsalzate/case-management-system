import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionIcon } from "../ui/ActionIcons";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { VersionDisplay } from "./VersionDisplay";
import { DynamicNavigation } from "../navigation/DynamicNavigation";
import { useInactivityTimeout } from "../../hooks/useInactivityTimeout";
import { InactivityWarningModal } from "../InactivityWarningModal";
import { Button } from "../ui/Button";
import { UserProfileModal } from "../users/UserProfileModal";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState(new Set<string>());
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sistema de inactividad - CONFIGURACIÓN DE PRODUCCIÓN
  const { showWarning, remainingMinutes, extendSession } = useInactivityTimeout(
    {
      timeoutDuration: 30, // 30 minutos de inactividad total
      warningDuration: 3, // 3 minutos de advertencia antes del cierre
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

  const handleVersionClick = useCallback(() => {
    navigate("/system/info");
  }, [navigate]);

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

      // Para el menú de usuario, verificar si el clic fue fuera del área del usuario
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setShowUserMenu(false);
      }

      // Para otros dropdowns, verificar si el clic fue fuera del sidebar general
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenDropdowns(new Set());
      }
    };

    // Usar 'click' en lugar de 'mousedown' para evitar conflictos
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showUserMenu]);

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Sidebar */}
      <div
        ref={menuRef}
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header con logo como botón de colapso */}
          <div
            className={`flex-shrink-0 flex items-center ${
              isCollapsed ? "px-1 justify-center" : "px-4"
            } py-4 border-b border-gray-200 dark:border-gray-700 overflow-hidden`}
          >
            <Button
              onClick={toggleCollapse}
              variant="ghost"
              className={`flex items-center ${
                isCollapsed
                  ? "p-1 w-12 h-12 justify-center rounded-lg focus:ring-0 focus:ring-offset-0"
                  : "w-full px-2 py-1 rounded-lg focus:ring-0 focus:ring-offset-0"
              } transition-colors duration-200`}
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <ActionIcon
                action="dashboard"
                size="xl"
                color="blue"
                className="flex-shrink-0"
              />
              {!isCollapsed && (
                <h1 className="ml-3 text-lg font-bold text-gray-900 dark:text-white">
                  Gestión de Casos
                </h1>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <DynamicNavigation
              isCollapsed={isCollapsed}
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleDropdown}
            />
          </div>

          {/* User Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div
              ref={userMenuRef}
              className={`relative ${isCollapsed ? "p-2" : "p-4"}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu((prev) => !prev);
                }}
                className={`w-full ${
                  isCollapsed
                    ? "justify-center p-1 w-12 h-12 focus:ring-0 focus:ring-offset-0 mx-auto"
                    : "justify-between focus:ring-0 focus:ring-offset-0"
                }`}
                title={isCollapsed ? user?.fullName || "Usuario" : undefined}
              >
                <div className="flex items-center">
                  <ActionIcon
                    action="user"
                    size="md"
                    color="gray"
                    className="flex-shrink-0"
                  />
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
                  <ActionIcon
                    action="dropdown"
                    size="sm"
                    color="gray"
                    className={`transform transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                )}
              </Button>

              {/* Dropdown menu */}
              {showUserMenu && !isCollapsed && (
                <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 mb-2 z-50">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <ActionIcon action="user" size="sm" color="gray" />
                      <span className="ml-3">Mi Perfil</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // TODO: Navegar a Configuración
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <ActionIcon action="settings" size="sm" color="gray" />
                      <span className="ml-3">Configuración</span>
                    </button>
                    <Link
                      to="/system/info"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <ActionIcon action="info" size="sm" color="gray" />
                      <span className="ml-3">Información del Sistema</span>
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <ActionIcon action="logout" size="sm" color="red" />
                      <span className="ml-3">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Toggle & Version - Centradas */}
          <div
            className={`border-t border-gray-200 dark:border-gray-700 ${
              isCollapsed ? "p-2" : "p-4"
            } space-y-2 overflow-hidden`}
          >
            <div
              className={`${
                isCollapsed
                  ? "flex flex-col items-center space-y-2"
                  : "flex flex-col items-center space-y-2"
              }`}
            >
              <ThemeToggle isCollapsed={isCollapsed} />
              {!isCollapsed && <VersionDisplay onClick={handleVersionClick} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto p-6">{children}</main>
      </div>

      {/* Modal de advertencia de inactividad */}
      <InactivityWarningModal
        isOpen={showWarning}
        onExtendSession={extendSession}
        onLogout={logout}
        remainingMinutes={remainingMinutes}
      />

      {/* Modal de perfil de usuario */}
      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            // Opcional: mostrar un mensaje de éxito
          }}
        />
      )}
    </div>
  );
};
