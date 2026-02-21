import React, { useState, useRef, useEffect } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import useSmartSearch from "../../hooks/useSmartSearch";

interface SmartSearchProps {
  onSearch: (term: string, filters?: any) => void;
  onRefineSearch?: (term: string, isExact?: boolean) => void;
  onSelectDocument?: (documentId: string) => void;
  placeholder?: string;
  className?: string;
  isRefining?: boolean;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onRefineSearch,
  onSelectDocument,
  placeholder = "Buscar documentos, etiquetas, casos...",
  className = "",
  isRefining = false,
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
  const [exactMatch, setExactMatch] = useState(false); // Estado para coincidencia exacta
  const [showHelpModal, setShowHelpModal] = useState(false); // Estado para modal de ayuda
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Manejar envío de búsqueda
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Si estamos en modo refinamiento y existe la función, refinar
      if (onRefineSearch) {
        onRefineSearch(searchTerm.trim(), exactMatch);
        setSearchTerm(""); // Limpiar el input después de refinar
        setExactMatch(false); // Resetear el toggle de coincidencia exacta
      } else {
        // Búsqueda inicial - pasar el estado de exactMatch en los filtros
        onSearch(searchTerm.trim(), { isExact: exactMatch });
        setExactMatch(false); // Resetear el toggle
      }
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
          prev < totalSuggestions - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : totalSuggestions - 1,
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
      } else if (suggestion.type === "tag") {
        // Para etiquetas, buscar el nombre en todos los campos
        onSearch(suggestion.name, { filterType: "tag" });
      } else if (suggestion.type === "case") {
        // Para casos, buscar el número en todos los campos
        onSearch(suggestion.caseNumber, { filterType: "case" });
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
    isSelected: boolean,
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

    const getMatchTypeLabel = (matchType: string) => {
      switch (matchType) {
        case "title":
          return "en título";
        case "content":
          return "en contenido";
        case "tag":
          return "en etiqueta";
        case "case":
          return "en caso asociado";
        default:
          return "";
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
            {suggestion.type === "document" && (
              <>
                Documento
                {suggestion.matchType && suggestion.matchType !== "title" && (
                  <span className="ml-1 text-blue-500 dark:text-blue-400">
                    • Coincidencia {getMatchTypeLabel(suggestion.matchType)}
                  </span>
                )}
              </>
            )}
            {suggestion.type === "tag" && "Etiqueta"}
            {suggestion.type === "case" && "Caso"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Indicador de modo refinamiento */}
      {isRefining && onRefineSearch && (
        <div className="absolute -top-5 left-0 right-0 text-xs text-green-600 dark:text-green-400 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
          Refinando búsqueda...
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              ) : onRefineSearch ? (
                <ActionIcon action="filter" size="sm" color="green" />
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
              className={`block w-full pl-10 pr-10 py-3 border rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 transition-all duration-200 ${
                onRefineSearch
                  ? "border-green-300 dark:border-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 dark:focus:border-green-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              }`}
              placeholder={placeholder}
            />
            {/* Botón de limpiar (dentro del input) */}
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

          {/* Botón de coincidencia exacta (fuera del input, siempre visible) */}
          <button
            type="button"
            onClick={() => setExactMatch(!exactMatch)}
            className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              exactMatch
                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={
              exactMatch
                ? "Coincidencia exacta activada - clic para desactivar"
                : "Activar coincidencia exacta"
            }
          >
            Exacta
          </button>

          {/* Botón de ayuda */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 flex items-center justify-center"
            title="Ayuda sobre el sistema de búsqueda"
          >
            ?
          </button>
        </div>
      </form>

      {/* Modal de ayuda */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowHelpModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  Guía del Sistema de Búsqueda
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
                {/* Búsqueda básica */}
                <section>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs">
                      1
                    </span>
                    Búsqueda Básica
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Escribe cualquier término y presiona{" "}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                      Enter
                    </kbd>
                    . El sistema buscará en:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      <strong>Títulos</strong> de documentos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <strong>Contenido</strong> completo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      <strong>Etiquetas</strong> asociadas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      <strong>Casos</strong> relacionados
                    </li>
                  </ul>
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                    💡 La búsqueda básica ignora mayúsculas y acentos.
                    "migración" encontrará "Migración" y "MIGRACION".
                  </div>
                </section>

                {/* Búsqueda encadenada */}
                <section>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs">
                      2
                    </span>
                    Búsqueda Encadenada (Refinamiento)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Después de una búsqueda inicial, puedes{" "}
                    <strong>refinar los resultados</strong> agregando más
                    términos:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs">
                        🔍 configuración
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        50 resultados
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs">
                        🔍 configuración
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                        ➕ servidor
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        12 resultados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs">
                        🔍 configuración
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                        ➕ servidor
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                        ➕ nginx
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        3 resultados
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-700 dark:text-green-300">
                    💡 Puedes deshacer filtros individualmente haciendo clic en
                    la ✕ de cada uno, o usar "Deshacer" para volver al estado
                    anterior.
                  </div>
                </section>

                {/* Coincidencia exacta */}
                <section>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">
                      3
                    </span>
                    Coincidencia Exacta
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Activa el botón{" "}
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                      Exacta
                    </span>{" "}
                    para buscar texto que coincida <strong>exactamente</strong>:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        "Pruebas1"
                      </code>
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Encuentra "Pruebas1"
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        "pruebas1"
                      </code>
                      <span className="text-red-600 dark:text-red-400">
                        ✗ NO encuentra "Pruebas1"
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        "Migracion"
                      </code>
                      <span className="text-red-600 dark:text-red-400">
                        ✗ NO encuentra "Migración"
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ La búsqueda exacta respeta mayúsculas, minúsculas y
                    acentos. Úsala cuando necesites precisión total.
                  </div>
                </section>

                {/* Indicador de relevancia */}
                <section>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs">
                      4
                    </span>
                    Indicador de Relevancia (Match %)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Cada resultado muestra un porcentaje de coincidencia basado
                    en:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4 mb-3">
                    <li>• Cantidad de palabras buscadas que coinciden</li>
                    <li>• Si la frase exacta aparece completa (+20%)</li>
                    <li>• Si coincide en el título (+10%)</li>
                  </ul>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded"></span>
                      90-100%: Excelente
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-500 rounded"></span>
                      70-89%: Muy bueno
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                      50-69%: Bueno
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-orange-500 rounded"></span>
                      30-49%: Parcial
                    </span>
                  </div>
                </section>

                {/* Tips */}
                <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    ✨ Tips para Mejores Resultados
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">→</span>
                      <span>
                        Empieza con términos generales y refina con términos
                        específicos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">→</span>
                      <span>
                        Usa la búsqueda exacta solo cuando conozcas el texto
                        preciso
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">→</span>
                      <span>
                        Los indicadores T, C, E, CA muestran dónde se encontró
                        la coincidencia (Título, Contenido, Etiquetas, Casos)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">→</span>
                      <span>
                        Puedes combinar búsqueda normal y exacta en la cadena de
                        filtros
                      </span>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  ¡Entendido!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                renderSuggestion(doc, index, selectedIndex === index),
              )}

              {/* Etiquetas */}
              {suggestions?.tags.map((tag: any, index: number) => {
                const globalIndex = suggestions.documents.length + index;
                return renderSuggestion(
                  tag,
                  globalIndex,
                  selectedIndex === globalIndex,
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
                  selectedIndex === globalIndex,
                );
              })}

              {/* Mensaje de búsqueda adicional */}
              <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>
                    {onRefineSearch
                      ? `Presiona Enter para filtrar por "${searchTerm}"${exactMatch ? " (exacta)" : ""}`
                      : `Presiona Enter para buscar "${searchTerm}"${exactMatch ? " (exacta)" : ""}`}
                  </span>
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
