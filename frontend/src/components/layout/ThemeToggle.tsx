import React from "react";
import { ThemeSunIcon, ThemeMoonIcon } from "../ui/ActionIcons";
import { useTheme } from "../../providers/ThemeProvider";
import { Button } from "../ui/Button";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`w-full ${isCollapsed ? "justify-center" : ""} ${className}`}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <>
          <ThemeSunIcon size="md" color="yellow" className="flex-shrink-0" />
          {!isCollapsed && showLabel && (
            <span className="ml-3">Modo Claro</span>
          )}
        </>
      ) : (
        <>
          <ThemeMoonIcon size="md" className="flex-shrink-0" />
          {!isCollapsed && showLabel && (
            <span className="ml-3">Modo Oscuro</span>
          )}
        </>
      )}
    </Button>
  );
};
