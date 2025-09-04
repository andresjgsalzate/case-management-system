import React, { forwardRef } from "react";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    const baseClasses = `
      w-full px-3 py-2 border rounded-lg 
      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
      transition-all duration-200 resize-vertical
      ${
        error
          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      }
      text-gray-900 dark:text-white 
      placeholder-gray-500 dark:placeholder-gray-400
      disabled:opacity-50 disabled:cursor-not-allowed
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${baseClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
