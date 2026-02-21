/**
 * Utilidades para búsqueda y filtrado de texto
 * Soporta normalización de acentos y búsquedas insensibles a diacríticos
 */

/**
 * Normaliza texto removiendo acentos y diacríticos
 * @param text - Texto a normalizar
 * @returns Texto sin acentos en minúsculas
 *
 * @example
 * normalizeText("Migración") // "migracion"
 * normalizeText("Niño")      // "nino"
 * normalizeText("Café")      // "cafe"
 */
export const normalizeText = (text: string): string => {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas
    .trim();
};

/**
 * Verifica si un texto contiene otro (ignorando acentos y mayúsculas)
 * @param text - Texto donde buscar
 * @param search - Término de búsqueda
 * @returns true si el texto contiene el término de búsqueda
 *
 * @example
 * containsNormalized("Migración de Fondos", "migracion") // true
 * containsNormalized("Café con Leche", "cafe") // true
 */
export const containsNormalized = (text: string, search: string): boolean => {
  if (!text || !search) return false;
  return normalizeText(text).includes(normalizeText(search));
};

/**
 * Verifica si un texto contiene la frase exacta completa (ignorando acentos y mayúsculas)
 * @param text - Texto donde buscar
 * @param search - Frase exacta de búsqueda
 * @returns true si el texto contiene la frase exacta
 *
 * @example
 * matchesExactNormalized("Migración de Fondos", "migracion de") // true
 * matchesExactNormalized("Migración de Fondos", "fondos migracion") // false (orden diferente)
 */
export const matchesExactNormalized = (
  text: string,
  search: string,
): boolean => {
  if (!text || !search) return false;
  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  return normalizedText.includes(normalizedSearch);
};

/**
 * Verifica si un texto contiene la frase EXACTA (respetando mayúsculas, minúsculas y acentos)
 * Esta es una coincidencia verdaderamente exacta, case-sensitive y accent-sensitive
 * @param text - Texto donde buscar
 * @param search - Frase exacta de búsqueda (debe coincidir exactamente)
 * @returns true si el texto contiene la frase exactamente como se escribió
 *
 * @example
 * matchesExact("Pruebas1", "Pruebas1") // true
 * matchesExact("Pruebas1", "pruebas1") // false (mayúsculas diferentes)
 * matchesExact("Migración", "Migracion") // false (acento diferente)
 */
export const matchesExact = (text: string, search: string): boolean => {
  if (!text || !search) return false;
  return text.includes(search);
};

/**
 * Verifica si alguna palabra del texto coincide con el término de búsqueda
 * @param text - Texto donde buscar
 * @param search - Término de búsqueda
 * @returns true si alguna palabra coincide
 */
export const matchesWord = (text: string, search: string): boolean => {
  if (!text || !search) return false;
  const normalizedSearch = normalizeText(search);
  const words = normalizeText(text).split(/\s+/);
  return words.some((word) => word.includes(normalizedSearch));
};

/**
 * Resalta coincidencias en texto para mostrar resultados
 * Devuelve el texto con las coincidencias envueltas en <mark>
 * @param text - Texto original
 * @param search - Término a resaltar
 * @returns Texto con marcas HTML para resaltar
 *
 * @example
 * highlightMatch("Migración de Fondos", "migracion")
 * // "<mark>Migración</mark> de Fondos"
 */
export const highlightMatch = (text: string, search: string): string => {
  if (!search || !text) return text;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  const index = normalizedText.indexOf(normalizedSearch);

  if (index === -1) return text;

  // Encontrar la posición en el texto original
  // Necesitamos mapear la posición del texto normalizado al original
  let originalIndex = 0;
  let normalizedIndex = 0;

  while (normalizedIndex < index && originalIndex < text.length) {
    const char = text[originalIndex];
    const normalizedChar = normalizeText(char);
    normalizedIndex += normalizedChar.length;
    originalIndex++;
  }

  const matchLength = search.length;
  const before = text.slice(0, originalIndex);
  const match = text.slice(originalIndex, originalIndex + matchLength);
  const after = text.slice(originalIndex + matchLength);

  return `${before}<mark class="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">${match}</mark>${after}`;
};

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param text - Texto a escapar
 * @returns Texto con caracteres HTML escapados
 */
export const escapeHtml = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
};

/**
 * Trunca texto y agrega elipsis si excede el límite
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con elipsis si es necesario
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Extrae un fragmento de texto alrededor de una coincidencia
 * Útil para mostrar contexto en resultados de búsqueda
 * @param text - Texto completo
 * @param search - Término de búsqueda
 * @param contextLength - Caracteres de contexto a cada lado
 * @returns Fragmento con la coincidencia y contexto
 */
export const extractMatchContext = (
  text: string,
  search: string,
  contextLength: number = 50,
): string => {
  if (!text || !search) return truncateText(text, contextLength * 2);

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  const index = normalizedText.indexOf(normalizedSearch);

  if (index === -1) return truncateText(text, contextLength * 2);

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + search.length + contextLength);

  let excerpt = text.slice(start, end);

  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";

  return excerpt;
};

/**
 * Calcula la relevancia de un documento basado en múltiples términos de búsqueda
 * Similar a calculateWordRelevance del backend pero para uso en frontend
 * @param searchTerms - Array de términos de búsqueda
 * @param document - Documento con título, contenido y tags
 * @returns Objeto con score, palabras coincidentes y ubicaciones
 */
export const calculateWordRelevance = (
  searchTerms: string[],
  document: {
    title: string;
    content?: string | null;
    tags?: Array<{ tagName: string }>;
    associatedCases?: string[];
  },
  casesMap?: Map<string, { numeroCaso?: string; descripcion?: string }>,
): {
  score: number;
  matchedWords: string[];
  totalWords: number;
  hasExactPhrase: boolean;
  matchLocations: ("title" | "content" | "tags" | "cases")[];
} => {
  // Combinar todos los términos de búsqueda en una frase
  const searchPhrase = searchTerms.join(" ");
  const normalizedSearch = normalizeText(searchPhrase);

  // Obtener todas las palabras de búsqueda (mínimo 2 caracteres)
  const searchWords = normalizedSearch
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (searchWords.length === 0) {
    return {
      score: 0,
      matchedWords: [],
      totalWords: 0,
      hasExactPhrase: false,
      matchLocations: [],
    };
  }

  const normalizedTitle = normalizeText(document.title || "");
  const normalizedContent = normalizeText(document.content || "");
  const normalizedTags = (document.tags || [])
    .map((t) => normalizeText(t.tagName))
    .join(" ");

  // Normalizar casos asociados si están disponibles
  let normalizedCases = "";
  if (document.associatedCases?.length && casesMap) {
    normalizedCases = document.associatedCases
      .map((caseId) => {
        const caseInfo = casesMap.get(caseId);
        if (caseInfo) {
          return normalizeText(
            `${caseInfo.numeroCaso || ""} ${caseInfo.descripcion || ""}`,
          );
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }

  const fullText = `${normalizedTitle} ${normalizedContent} ${normalizedTags} ${normalizedCases}`;

  // Verificar si tiene la frase exacta de búsqueda
  const hasExactPhrase = fullText.includes(normalizedSearch);

  // Contar palabras coincidentes y determinar ubicaciones
  const matchedWords: string[] = [];
  const matchLocations = new Set<"title" | "content" | "tags" | "cases">();

  for (const word of searchWords) {
    if (fullText.includes(word)) {
      matchedWords.push(word);

      // Determinar dónde coincide
      if (normalizedTitle.includes(word)) matchLocations.add("title");
      if (normalizedContent.includes(word)) matchLocations.add("content");
      if (normalizedTags.includes(word)) matchLocations.add("tags");
      if (normalizedCases.includes(word)) matchLocations.add("cases");
    }
  }

  // Calcular score base (porcentaje de palabras encontradas)
  let score = (matchedWords.length / searchWords.length) * 100;

  // Bonus por frase exacta (+20%)
  if (hasExactPhrase) {
    score = Math.min(100, score + 20);
  }

  // Bonus por coincidencia en título (+10%)
  if (matchLocations.has("title")) {
    score = Math.min(100, score + 10);
  }

  // Penalización leve si solo coincide en contenido (-5%)
  if (matchLocations.size === 1 && matchLocations.has("content")) {
    score = Math.max(0, score - 5);
  }

  return {
    score: Math.round(score),
    matchedWords,
    totalWords: searchWords.length,
    hasExactPhrase,
    matchLocations: Array.from(matchLocations),
  };
};

export default {
  normalizeText,
  containsNormalized,
  matchesExactNormalized,
  matchesExact,
  matchesWord,
  highlightMatch,
  escapeHtml,
  truncateText,
  extractMatchContext,
  calculateWordRelevance,
};
