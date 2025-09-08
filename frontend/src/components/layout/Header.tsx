import { useState, useRef, useEffect } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../providers/ThemeProvider";
import { Button } from "../ui/Button";

export const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1"></div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Theme toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="-m-2.5 p-2.5"
            >
              <span className="sr-only">Toggle theme</span>
              {isDark ? (
                <SunIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <MoonIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>

            <Button variant="ghost" size="sm" className="-m-2.5 p-2.5">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </Button>

            {/* Separator */}
            <div
              className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700"
              aria-hidden="true"
            />

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="-m-1.5 flex items-center p-1.5"
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
                    aria-hidden="true"
                  >
                    Usuario
                  </span>
                  <ChevronDownIcon
                    className={`ml-2 h-5 w-5 text-gray-400 dark:text-gray-300 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-700/10 focus:outline-none">
                  <a
                    href="#"
                    className="block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Tu perfil
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Cerrar sesión
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
