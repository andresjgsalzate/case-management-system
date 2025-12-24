import React from "react";

interface RelevanceIndicatorProps {
  score: number; // 0-100
  matchedWords?: string[];
  totalWords?: number;
  hasExactPhrase?: boolean;
  matchLocations?: string[];
}

/**
 * Componente compacto que muestra un indicador visual de relevancia de búsqueda
 * Diseñado para ir al final de las tarjetas de documentos
 */
const RelevanceIndicator: React.FC<RelevanceIndicatorProps> = ({
  score,
  matchedWords = [],
  totalWords = 0,
  hasExactPhrase = false,
  matchLocations = [],
}) => {
  // Obtener el color basado en el score
  const getScoreColor = (score: number) => {
    if (score >= 90)
      return {
        text: "text-green-600 dark:text-green-400",
        bar: "bg-green-500",
      };
    if (score >= 70)
      return { text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" };
    if (score >= 50)
      return {
        text: "text-yellow-600 dark:text-yellow-400",
        bar: "bg-yellow-500",
      };
    if (score >= 30)
      return {
        text: "text-orange-600 dark:text-orange-400",
        bar: "bg-orange-500",
      };
    return { text: "text-gray-500 dark:text-gray-400", bar: "bg-gray-400" };
  };

  const colors = getScoreColor(score);

  // Verificar si una ubicación tiene coincidencia
  const hasMatch = (location: string) => matchLocations.includes(location);

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
      <div className="flex items-center justify-between gap-3">
        {/* Indicadores de ubicación de coincidencia */}
        <div className="flex items-center gap-1.5">
          {/* Título */}
          <div
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-all ${
              hasMatch("title")
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 opacity-50"
            }`}
            title={
              hasMatch("title")
                ? "✓ Coincidencia en título"
                : "✗ Sin coincidencia en título"
            }
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            {hasMatch("title") && (
              <svg
                className="w-2.5 h-2.5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Contenido */}
          <div
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-all ${
              hasMatch("content")
                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 opacity-50"
            }`}
            title={
              hasMatch("content")
                ? "✓ Coincidencia en contenido"
                : "✗ Sin coincidencia en contenido"
            }
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {hasMatch("content") && (
              <svg
                className="w-2.5 h-2.5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Etiquetas */}
          <div
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-all ${
              hasMatch("tags")
                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 opacity-50"
            }`}
            title={
              hasMatch("tags")
                ? "✓ Coincidencia en etiquetas"
                : "✗ Sin coincidencia en etiquetas"
            }
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {hasMatch("tags") && (
              <svg
                className="w-2.5 h-2.5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Score y detalles */}
        <div className="flex items-center gap-2">
          {/* Frase exacta badge */}
          {hasExactPhrase && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              <svg
                className="w-2.5 h-2.5 mr-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Exacta
            </span>
          )}

          {/* Palabras coincidentes */}
          {totalWords > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {matchedWords.length}/{totalWords}
            </span>
          )}

          {/* Barra de progreso mini */}
          <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bar} transition-all duration-300`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Porcentaje */}
          <span
            className={`text-xs font-semibold ${colors.text} min-w-[32px] text-right`}
          >
            {score}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RelevanceIndicator;
