import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ActionIcon } from "../ui/ActionIcons";
import { useModulePermissions } from "../../hooks/usePermissions";

// Mapeo de iconos por nombre a actions de ActionIcon
const ICON_ACTION_MAP: Record<string, string> = {
  HomeIcon: "home",
  DocumentTextIcon: "document",
  PlusIcon: "add",
  ChartBarIcon: "dashboard",
  UsersIcon: "user",
  ClockIcon: "time",
  WrenchScrewdriverIcon: "tool",
  ListBulletIcon: "list",
  DocumentDuplicateIcon: "duplicate",
  CogIcon: "settings",
  BuildingOfficeIcon: "building",
  FlagIcon: "flag",
  ShieldCheckIcon: "shield",
  ArchiveBoxIcon: "archive",
  BookOpenIcon: "book",
  TagIcon: "tag",
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

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isDropdownActive = (items: any[]) => {
    return items.some((item) => isActive(item.href));
  };

  const getIconAction = (iconName: string) => {
    return ICON_ACTION_MAP[iconName] || "home";
  };

  return (
    <nav
      className={`py-4 space-y-2 ${
        isCollapsed ? "px-1" : "px-4"
      } overflow-hidden`}
    >
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
        {
          name: "Base de Conocimiento",
          href: "/knowledge",
          icon: "BookOpenIcon",
        },
        { name: "Archivo", href: "/archive", icon: "ArchiveBoxIcon" },
      ]
        .filter((menuItem) => {
          // Filtrar por permisos usando allowedModules
          return allowedModules.some((module) => module.href === menuItem.href);
        })
        .map((item) => {
          const iconAction = getIconAction(item.icon);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center ${
                isCollapsed
                  ? "justify-center p-2 w-12 h-12 mx-auto"
                  : "px-3 py-2"
              } text-sm font-medium rounded-md transition-colors duration-200 focus:ring-0 focus:ring-offset-0 ${
                isActive(item.href)
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <ActionIcon
                action={iconAction as any}
                size="sm"
                className="flex-shrink-0"
              />
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
        const sectionIconAction = getIconAction(section.icon);
        const sectionActive = isDropdownActive(section.items);
        const isOpen = openDropdowns.has(section.id);

        if (isCollapsed) {
          // En modo colapsado, mostrar solo el icono principal
          return (
            <div
              key={section.id}
              className="relative group flex justify-center"
            >
              <button
                className={`w-12 h-12 flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                  sectionActive
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={section.title}
              >
                <ActionIcon
                  action={sectionIconAction as any}
                  size="sm"
                  className="flex-shrink-0"
                />
              </button>

              {/* Tooltip con items para modo colapsado */}
              <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const itemIconAction = getIconAction(item.icon);
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
                      <ActionIcon
                        action={itemIconAction as any}
                        size="sm"
                        className="mr-3"
                      />
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
                <ActionIcon
                  action={sectionIconAction as any}
                  size="sm"
                  className="mr-3"
                />
                {section.title}
              </div>
              <ActionIcon
                action="dropdown"
                size="sm"
                className={`transform transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Submenu items */}
            {isOpen && (
              <div className="ml-6 space-y-1">
                {section.items.map((item) => {
                  const submenuIconAction = getIconAction(item.icon);
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
                      <ActionIcon
                        action={submenuIconAction as any}
                        size="sm"
                        className="mr-3"
                      />
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
