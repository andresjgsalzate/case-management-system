import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../providers/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  isCollapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = true,
  isCollapsed = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 ${
        isCollapsed ? "justify-center" : ""
      } ${className}`}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <>
          <SunIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          {!isCollapsed && showLabel && (
            <span className="ml-3">Modo Claro</span>
          )}
        </>
      ) : (
        <>
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          {!isCollapsed && showLabel && (
            <span className="ml-3">Modo Oscuro</span>
          )}
        </>
      )}
    </button>
  );
};
