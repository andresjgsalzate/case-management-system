import React from "react";

interface VersionDisplayProps {
  onClick?: () => void;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 px-2 py-1 rounded"
      title="Ver información de versión"
    >
      v1.1.0
    </button>
  );
};
