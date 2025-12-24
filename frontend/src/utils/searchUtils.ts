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
  contextLength: number = 50
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

export default {
  normalizeText,
  containsNormalized,
  matchesWord,
  highlightMatch,
  escapeHtml,
  truncateText,
  extractMatchContext,
};
