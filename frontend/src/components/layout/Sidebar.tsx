import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebarPermissions } from "../../hooks/useSidebarPermissions";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ActionIcon, ActionType } from "../ui/ActionIcons";

interface NavigationItem {
  name: string;
  href: string;
  icon: ActionType;
  subItems?: { name: string; href: string }[];
  requiredPermission?: string;
  requiredModule?: string;
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: "home",
    requiredPermission: "dashboard.view.own",
  },
  {
    name: "Casos",
    href: "/cases",
    icon: "document",
    requiredModule: "casos",
  },
  {
    name: "Nuevo Caso",
    href: "/cases/new",
    icon: "add",
    requiredPermission: "cases.create.own",
  },
  {
    name: "Control de Casos",
    href: "/case-control",
    icon: "time",
    requiredModule: "casos",
  },
  {
    name: "TODOs",
    href: "/todos",
    icon: "success",
    requiredModule: "todos",
  },
  {
    name: "Disposiciones",
    href: "/dispositions",
    icon: "view",
    requiredModule: "dispositions",
  },
  {
    name: "Notas",
    href: "/notes",
    icon: "document",
    requiredModule: "notas",
  },
  {
    name: "Base de Conocimiento",
    href: "/knowledge",
    icon: "book",
    requiredPermission: "knowledge.read.all",
  },
  { name: "Archivo", href: "/archive", icon: "archive" },
  {
    name: "Usuarios",
    href: "/users",
    icon: "users",
    requiredPermission: "users.view.all",
  },
  {
    name: "Roles",
    href: "/roles",
    icon: "activate",
    requiredPermission: "roles:view:all",
  },
  {
    name: "Equipos",
    href: "/teams",
    icon: "users",
    requiredModule: "teams",
  },
  {
    name: "Permisos",
    href: "/permissions",
    icon: "settings",
    requiredPermission: "permissions.read.all",
    subItems: [
      { name: "Gestión de Permisos", href: "/permissions" },
      { name: "Asignación por Rol", href: "/permissions/role-assignment" },
      { name: "Guía de Permisos", href: "/permissions/guide" },
    ],
  },
  {
    name: "Etiquetas",
    href: "/admin/tags",
    icon: "tag",
    requiredPermission: "tags.manage.all",
  },
  {
    name: "Auditoría",
    href: "/admin/audit",
    icon: "shield",
    requiredPermission: "audit.view.all",
  },
];

// Debug log para verificar que el archivo se está cargando
console.log("Navigation items loaded:", navigation);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface NavigationItemComponentProps {
  item: NavigationItem;
  onItemClick?: () => void;
}

const NavigationItemComponent: React.FC<NavigationItemComponentProps> = ({
  item,
  onItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.subItems) {
    return (
      <NavLink
        to={item.href}
        onClick={onItemClick}
        className={({ isActive }) =>
          classNames(
            isActive
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700",
            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
          )
        }
      >
        <ActionIcon action={item.icon} size="lg" className="shrink-0" />
        {item.name}
      </NavLink>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className={classNames(
          "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400",
          "group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold items-center justify-between"
        )}
      >
        <div className="flex items-center gap-x-3">
          <ActionIcon action={item.icon} size="lg" className="shrink-0" />
          {item.name}
        </div>
        <ActionIcon
          action="dropdown"
          size="sm"
          className={classNames(
            "transition-transform",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </Button>
      {isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subItems.map((subItem) => (
            <NavLink
              key={subItem.href}
              to={subItem.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700",
                  "block rounded-md py-2 px-3 text-sm"
                )
              }
            >
              {subItem.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { hasPermission, canAccessModule, isLoading } = useSidebarPermissions();

  const handleItemClick = () => {
    setSidebarOpen(false);
  };

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return null;
  }

  // Función para verificar si el usuario puede ver un elemento del menú
  const canAccessNavigationItem = (item: NavigationItem): boolean => {
    // Verificar permiso específico primero
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }

    // Verificar módulo
    if (item.requiredModule) {
      return canAccessModule(item.requiredModule);
    }

    // Para Dashboard, verificar el permiso específico de dashboard
    if (item.name === "Dashboard") {
      return (
        hasPermission("dashboard.view.own") ||
        hasPermission("dashboard.view.all")
      );
    }

    // Para Archivo, verificar el permiso específico
    if (item.name === "Archivo") {
      return hasPermission("archive.view.all");
    }

    // Si no tiene restricciones específicas, NO es accesible por defecto
    // Esto asegura que solo elementos con permisos explícitos sean visibles
    return false;
  };

  // Filtrar elementos de navegación basándose en permisos
  const filteredNavigation = navigation.filter(canAccessNavigationItem);

  // Mostrar indicador de carga si se están verificando permisos
  if (isLoading) {
    return (
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          🔄 Verificando permisos...
        </div>
      </div>
    );
  }

  console.log(
    "🔍 Permisos verificados - Navegación filtrada:",
    filteredNavigation.map((item) => item.name)
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Modal
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        size="sm"
      >
        <div className="flex h-full flex-col">
          {/* Close button */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Sistema de Casos
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <ActionIcon action="close" size="lg" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col mt-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <NavigationItemComponent
                        item={item}
                        onItemClick={handleItemClick}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </Modal>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Sistema de Casos
            </h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <NavigationItemComponent item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="-m-2.5 p-2.5 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <ActionIcon action="menu" size="lg" />
        </Button>
      </div>
    </>
  );
};
