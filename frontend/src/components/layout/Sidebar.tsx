import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  UsersIcon,
  ShieldCheckIcon,
  XMarkIcon,
  Bars3Icon,
  CheckCircleIcon,
  CogIcon,
  ChevronDownIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  subItems?: { name: string; href: string }[];
  requiredPermission?: string;
  requiredModule?: string;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  {
    name: "Casos",
    href: "/cases",
    icon: DocumentTextIcon,
    requiredModule: "casos",
  },
  {
    name: "Nuevo Caso",
    href: "/cases/new",
    icon: PlusIcon,
    requiredPermission: "casos.crear.all",
  },
  {
    name: "Control de Casos",
    href: "/case-control",
    icon: ClockIcon,
    requiredModule: "casos",
  },
  {
    name: "TODOs",
    href: "/todos",
    icon: CheckCircleIcon,
    requiredModule: "todos",
  },
  { name: "Archivo", href: "/archive", icon: ArchiveBoxIcon }, // Sin restricciones de permisos por ahora
  {
    name: "Usuarios",
    href: "/users",
    icon: UsersIcon,
    requiredPermission: "usuarios.ver.all",
  },
  {
    name: "Roles",
    href: "/roles",
    icon: ShieldCheckIcon,
    requiredPermission: "roles:view:all",
  },
  {
    name: "Permisos",
    href: "/permissions",
    icon: CogIcon,
    requiredPermission: "permissions.read_all",
    subItems: [
      { name: "Gestión de Permisos", href: "/permissions" },
      { name: "Asignación por Rol", href: "/permissions/role-assignment" },
      { name: "Guía de Permisos", href: "/permissions/guide" },
    ],
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
        <item.icon
          className={classNames("h-6 w-6 shrink-0")}
          aria-hidden="true"
        />
        {item.name}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={classNames(
          "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700",
          "group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold items-center justify-between"
        )}
      >
        <div className="flex items-center gap-x-3">
          <item.icon
            className={classNames("h-6 w-6 shrink-0")}
            aria-hidden="true"
          />
          {item.name}
        </div>
        <ChevronDownIcon
          className={classNames(
            "h-4 w-4 transition-transform",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>
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
  const { hasPermission, canAccessModule, user, isAuthenticated } = useAuth();

  // Debug logging FORZADO - debe aparecer siempre
  console.log("🔍 SIDEBAR RENDERIZADO - Debug Info:");
  console.log("  - Usuario autenticado:", isAuthenticated);
  console.log("  - Usuario:", user?.email || "No user");
  console.log("  - Rol:", user?.roleName || "No role");
  console.log(
    "  - hasPermission('archive.view'):",
    hasPermission("archive.view")
  );

  // Test de permisos específicos
  console.log("📋 PERMISOS ESPECÍFICOS:");
  console.log("  - archive.view:", hasPermission("archive.view"));
  console.log("  - casos.ver.all:", hasPermission("casos.ver.all"));
  console.log("  - usuarios.ver.all:", hasPermission("usuarios.ver.all"));

  const handleItemClick = () => {
    setSidebarOpen(false);
  };

  // Función para verificar si el usuario puede ver un elemento del menú
  const canAccessNavigationItem = (item: NavigationItem): boolean => {
    console.log(`Checking access for ${item.name}:`, {
      requiredPermission: item.requiredPermission,
      requiredModule: item.requiredModule,
      hasArchiveView: hasPermission("archive.view"),
      canAccessCasos: canAccessModule("casos"),
    });

    // Dashboard siempre es accesible para usuarios autenticados
    if (item.name === "Dashboard") return true;

    // Para Archivo, verificar el permiso específico
    if (item.name === "Archivo") {
      const canAccess = hasPermission("archive.view");
      console.log(`Archive access result: ${canAccess}`);
      return canAccess;
    }

    // Verificar permiso específico
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }

    // Verificar módulo
    if (item.requiredModule) {
      return canAccessModule(item.requiredModule);
    }

    // Si no tiene restricciones, es accesible
    return true;
  };

  // Filtrar elementos de navegación basándose en permisos
  const filteredNavigation = navigation.filter(canAccessNavigationItem);
  console.log(
    "Filtered navigation:",
    filteredNavigation.map((item) => item.name)
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

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
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </>
  );
};
