import React, { useState, useRef, useEffect } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import useSmartSearch from "../../hooks/useSmartSearch";

interface SmartSearchProps {
  onSearch: (term: string, filters?: any) => void;
  onSelectDocument?: (documentId: string) => void;
  placeholder?: string;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onSelectDocument,
  placeholder = "Buscar documentos, etiquetas, casos...",
  className = "",
}) => {
  const {
    searchTerm,
    setSearchTerm,
    suggestions,
    suggestionsLoading,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    selectSuggestion,
    clearSearch,
    hasResults,
  } = useSmartSearch();

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Manejar envío de búsqueda
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setShowSuggestions(false);
    }
  };

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || !suggestions) return;

    const totalSuggestions =
      suggestions.documents.length +
      suggestions.tags.length +
      suggestions.cases.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalSuggestions - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : totalSuggestions - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(selectedIndex);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (index: number) => {
    if (!suggestions) return;

    const allSuggestions = [
      ...suggestions.documents,
      ...suggestions.tags,
      ...suggestions.cases,
    ];

    if (index < allSuggestions.length) {
      const suggestion = allSuggestions[index];
      selectSuggestion(suggestion);

      if (suggestion.type === "document" && onSelectDocument) {
        onSelectDocument(suggestion.id);
      } else {
        onSearch(searchTerm);
      }
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Renderizar sugerencia individual
  const renderSuggestion = (
    suggestion: any,
    index: number,
    isSelected: boolean
  ) => {
    const getIcon = () => {
      switch (suggestion.type) {
        case "document":
          return "document";
        case "tag":
          return "tag";
        case "case":
          return "case";
        default:
          return "search";
      }
    };

    const getColor = () => {
      switch (suggestion.type) {
        case "document":
          return "text-blue-600 dark:text-blue-400";
        case "tag":
          return "text-green-600 dark:text-green-400";
        case "case":
          return "text-purple-600 dark:text-purple-400";
        default:
          return "text-gray-600 dark:text-gray-400";
      }
    };

    return (
      <div
        key={index}
        className={`px-4 py-2 cursor-pointer flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
        onClick={() => handleSelectSuggestion(index)}
      >
        <ActionIcon
          action={getIcon()}
          size="sm"
          color="gray"
          className={getColor()}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {suggestion.type === "document" && suggestion.title}
            {suggestion.type === "tag" && suggestion.name}
            {suggestion.type === "case" && suggestion.caseNumber}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {suggestion.type === "document" && "Documento"}
            {suggestion.type === "tag" && "Etiqueta"}
            {suggestion.type === "case" && "Caso"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
            ) : (
              <ActionIcon action="search" size="sm" color="gray" />
            )}
          </div>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
            placeholder={placeholder}
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ActionIcon action="close" size="sm" color="gray" />
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Sugerencias */}
      {showSuggestions && hasResults && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestionsLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
              Buscando...
            </div>
          ) : (
            <div>
              {/* Documentos */}
              {suggestions?.documents.map((doc: any, index: number) =>
                renderSuggestion(doc, index, selectedIndex === index)
              )}

              {/* Etiquetas */}
              {suggestions?.tags.map((tag: any, index: number) => {
                const globalIndex = suggestions.documents.length + index;
                return renderSuggestion(
                  tag,
                  globalIndex,
                  selectedIndex === globalIndex
                );
              })}

              {/* Casos */}
              {suggestions?.cases.map((case_: any, index: number) => {
                const globalIndex =
                  suggestions.documents.length +
                  suggestions.tags.length +
                  index;
                return renderSuggestion(
                  case_,
                  globalIndex,
                  selectedIndex === globalIndex
                );
              })}

              {/* Mensaje de búsqueda adicional */}
              <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Presiona Enter para buscar "{searchTerm}"</span>
                  <span className="text-xs">↑↓ navegar, Enter seleccionar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
