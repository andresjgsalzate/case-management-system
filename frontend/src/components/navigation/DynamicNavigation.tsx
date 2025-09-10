import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  ChartBarIcon,
  UsersIcon,
  ChevronDownIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ListBulletIcon,
  DocumentDuplicateIcon,
  CogIcon,
  BuildingOfficeIcon,
  FlagIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { useModulePermissions } from "../../hooks/usePermissions";

// Mapeo de iconos por nombre
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ListBulletIcon,
  DocumentDuplicateIcon,
  CogIcon,
  BuildingOfficeIcon,
  FlagIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  BookOpenIcon,
};

interface DynamicNavigationProps {
  isCollapsed: boolean;
  openDropdowns: Set<string>;
  onToggleDropdown: (sectionId: string) => void;
}

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  isCollapsed,
  openDropdowns,
  onToggleDropdown,
}) => {
  const location = useLocation();
  const { allowedModules, allowedAdminSections } = useModulePermissions();

  // Debug logging
  console.log("🔍 DYNAMIC NAVIGATION - Debug Info:");
  console.log(
    "  - Allowed modules:",
    allowedModules.map((m) => ({ name: m.name, href: m.href }))
  );
  console.log(
    "  - Looking for archive module:",
    allowedModules.find((m) => m.href === "/archive")
  );

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isDropdownActive = (items: any[]) => {
    return items.some((item) => isActive(item.href));
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || HomeIcon;
  };

  return (
    <nav className="px-4 py-4 space-y-2">
      {/* Navegación básica - Orden específico solicitado */}
      {[
        { name: "Dashboard", href: "/", icon: "HomeIcon" },
        { name: "Casos", href: "/cases", icon: "DocumentTextIcon" },
        { name: "Nuevo Caso", href: "/cases/new", icon: "PlusIcon" },
        { name: "Control de Casos", href: "/case-control", icon: "ClockIcon" },
        {
          name: "Disposiciones",
          href: "/dispositions",
          icon: "WrenchScrewdriverIcon",
        },
        { name: "TODOs", href: "/todos", icon: "ListBulletIcon" },
        { name: "Notas", href: "/notes", icon: "DocumentDuplicateIcon" },
        { name: "Archivo", href: "/archive", icon: "ArchiveBoxIcon" },
        {
          name: "Base de Conocimiento",
          href: "/knowledge",
          icon: "BookOpenIcon",
        },
      ]
        .filter((menuItem) => {
          // Filtrar por permisos usando allowedModules
          return allowedModules.some((module) => module.href === menuItem.href);
        })
        .map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive(item.href)
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}

      {/* Separador */}
      {allowedAdminSections.length > 0 && !isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      )}

      {/* Secciones administrativas */}
      {allowedAdminSections.map((section) => {
        const SectionIcon = getIcon(section.icon);
        const sectionActive = isDropdownActive(section.items);
        const isOpen = openDropdowns.has(section.id);

        if (isCollapsed) {
          // En modo colapsado, mostrar solo el icono principal
          return (
            <div key={section.id} className="relative group">
              <button
                className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  sectionActive
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={section.title}
              >
                <SectionIcon className="h-6 w-6" />
              </button>

              {/* Tooltip con items para modo colapsado */}
              <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const ItemIcon = getIcon(item.icon);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                        isActive(item.href)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ItemIcon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => onToggleDropdown(section.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                sectionActive
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center">
                <SectionIcon className="h-5 w-5 mr-3" />
                {section.title}
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 transform transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Submenu items */}
            {isOpen && (
              <div className="ml-6 space-y-1">
                {section.items.map((item) => {
                  const ItemIcon = getIcon(item.icon);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                        isActive(item.href)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ItemIcon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Indicador de permisos limitados si no es administrador */}
      {allowedModules.length === 0 &&
        allowedAdminSections.length === 0 &&
        !isCollapsed && (
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Sin permisos de navegación
          </div>
        )}
    </nav>
  );
};
