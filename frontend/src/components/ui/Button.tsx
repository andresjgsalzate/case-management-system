import React from "react";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm";

  const variantClasses = {
    primary:
      "bg-blue-600/90 hover:bg-blue-700/90 text-white focus:ring-blue-500 backdrop-blur-md shadow-lg",
    secondary:
      "bg-gray-600/90 hover:bg-gray-700/90 text-white focus:ring-gray-500 backdrop-blur-md shadow-lg",
    success:
      "bg-green-600/90 hover:bg-green-700/90 text-white focus:ring-green-500 backdrop-blur-md shadow-lg",
    danger:
      "bg-red-600/90 hover:bg-red-700/90 text-white focus:ring-red-500 backdrop-blur-md shadow-lg",
    warning:
      "bg-yellow-600/90 hover:bg-yellow-700/90 text-white focus:ring-yellow-500 backdrop-blur-md shadow-lg",
    ghost:
      "bg-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 focus:ring-gray-500 backdrop-blur-sm",
  };

  // Reglas optimizadas - tamaños más moderados y profesionales
  const sizeClasses = {
    xs: "px-2 py-1 text-xs", // Extra pequeño
    sm: "px-3 py-1.5 text-sm", // Pequeño - perfecto para botones secundarios
    md: "px-4 py-2 text-sm", // Mediano - tamaño estándar
    lg: "px-6 py-3 text-base", // Grande - para botones principales
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
