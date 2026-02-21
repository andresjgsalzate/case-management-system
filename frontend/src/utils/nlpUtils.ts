/**
 * NLP Utilities for Tag Suggestions
 *
 * Provides basic NLP functionality to extract keywords from text
 * and suggest relevant tags based on document content.
 */

// Common Spanish stop words to filter out
const SPANISH_STOP_WORDS = new Set([
  "a",
  "al",
  "algo",
  "algunas",
  "algunos",
  "ante",
  "antes",
  "como",
  "con",
  "contra",
  "cual",
  "cuando",
  "de",
  "del",
  "desde",
  "donde",
  "durante",
  "e",
  "el",
  "ella",
  "ellas",
  "ellos",
  "en",
  "entre",
  "era",
  "esa",
  "esas",
  "ese",
  "eso",
  "esos",
  "esta",
  "estas",
  "este",
  "esto",
  "estos",
  "fue",
  "fueron",
  "ha",
  "hace",
  "han",
  "hasta",
  "hay",
  "la",
  "las",
  "le",
  "les",
  "lo",
  "los",
  "mas",
  "más",
  "me",
  "mi",
  "mis",
  "muy",
  "ni",
  "no",
  "nos",
  "nuestra",
  "nuestras",
  "nuestro",
  "nuestros",
  "o",
  "os",
  "otra",
  "otras",
  "otro",
  "otros",
  "para",
  "pero",
  "poco",
  "por",
  "porque",
  "que",
  "quien",
  "se",
  "sea",
  "ser",
  "si",
  "sido",
  "sin",
  "sobre",
  "solo",
  "sólo",
  "son",
  "su",
  "sus",
  "también",
  "tan",
  "te",
  "tengo",
  "ti",
  "tiene",
  "tienen",
  "toda",
  "todas",
  "todo",
  "todos",
  "tu",
  "tus",
  "un",
  "una",
  "uno",
  "unos",
  "va",
  "vamos",
  "ya",
  "yo",
  "y",
  "es",
  "pueden",
  "puede",
  "cada",
  "así",
  "aquí",
  "ahora",
  "bien",
  "buen",
  "buena",
  "buenos",
  "cómo",
  "cuál",
  "cuándo",
  "dónde",
  "ese",
  "ése",
  "esta",
  "ésta",
  "estas",
  "estas",
  "éste",
  "esto",
  // Common English stop words
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "which",
  "what",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "not",
  "only",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
]);

// Technical terms that are good candidates for tags
const TECHNICAL_PATTERNS = [
  /\b(?:api|rest|http|https|sql|nosql|json|xml|html|css)\b/gi,
  /\b(?:configuraci[oó]n|implementaci[oó]n|integraci[oó]n|migraci[oó]n)\b/gi,
  /\b(?:seguridad|autenticaci[oó]n|autorizaci[oó]n|validaci[oó]n)\b/gi,
  /\b(?:base\s+de\s+datos|servidor|cliente|backend|frontend)\b/gi,
  /\b(?:error|soluci[oó]n|problema|bug|fix)\b/gi,
  /\b(?:documentaci[oó]n|manual|gu[ií]a|tutorial)\b/gi,
  /\b(?:proceso|procedimiento|flujo|workflow)\b/gi,
  /\b(?:usuario|rol|permiso|acceso)\b/gi,
  /\b(?:reporte|informe|an[aá]lisis|estad[ií]stica)\b/gi,
  /\b(?:prueba|test|testing|qa)\b/gi,
];

/**
 * Extract text content from BlockNote JSON structure
 */
export function extractTextFromBlockNote(jsonContent: any[]): string {
  if (!Array.isArray(jsonContent)) return "";

  const extractFromBlock = (block: any): string => {
    let text = "";

    // Extract from content array
    if (Array.isArray(block.content)) {
      for (const item of block.content) {
        if (typeof item === "string") {
          text += item + " ";
        } else if (item.type === "text" && item.text) {
          text += item.text + " ";
        } else if (item.content) {
          text += extractFromBlock(item) + " ";
        }
      }
    }

    // Extract from nested blocks (children)
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        text += extractFromBlock(child) + " ";
      }
    }

    return text;
  };

  return jsonContent.map(extractFromBlock).join(" ").trim();
}

/**
 * Tokenize text into words, filtering out stop words and short words
 */
export function tokenize(text: string): string[] {
  // Remove special characters and normalize
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents for comparison
    .replace(/[^a-z0-9áéíóúñü\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split into words
  const words = normalized.split(" ");

  // Filter stop words and short words
  return words.filter((word) => {
    const cleanWord = word.trim();
    return cleanWord.length >= 3 && !SPANISH_STOP_WORDS.has(cleanWord);
  });
}

/**
 * Calculate word frequency in text
 */
export function calculateWordFrequency(words: string[]): Map<string, number> {
  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  return frequency;
}

/**
 * Extract n-grams (word combinations) from text
 */
export function extractNGrams(words: string[], n: number = 2): string[] {
  const nGrams: string[] = [];

  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(" ");
    // Only keep meaningful n-grams
    if (gram.length >= 5) {
      nGrams.push(gram);
    }
  }

  return nGrams;
}

/**
 * Extract keywords from text using TF-IDF-like scoring
 * Returns top keywords suitable for tags
 */
export function extractKeywords(
  text: string,
  maxKeywords: number = 10,
): string[] {
  if (!text || text.length < 10) return [];

  const words = tokenize(text);
  const frequency = calculateWordFrequency(words);

  // Calculate scores based on frequency and position
  const scored: Array<{ word: string; score: number }> = [];

  for (const [word, count] of frequency.entries()) {
    // Base score is frequency
    let score = count;

    // Bonus for words appearing in first 100 words (likely title/headers)
    const firstPositionIndex = words.indexOf(word);
    if (firstPositionIndex < 100) {
      score *= 1.5;
    }

    // Bonus for technical terms
    for (const pattern of TECHNICAL_PATTERNS) {
      if (pattern.test(word)) {
        score *= 2;
        break;
      }
    }

    // Penalty for very common words that passed stop word filter
    if (count > words.length * 0.1) {
      score *= 0.5;
    }

    scored.push({ word, score });
  }

  // Also extract bi-grams
  const biGrams = extractNGrams(words, 2);
  const biGramFreq = calculateWordFrequency(biGrams);

  for (const [gram, count] of biGramFreq.entries()) {
    if (count >= 2) {
      // Only include repeated bi-grams
      scored.push({ word: gram, score: count * 1.5 });
    }
  }

  // Sort by score and return top keywords
  scored.sort((a, b) => b.score - a.score);

  // Format keywords for tags (capitalize first letter, limit length)
  return scored.slice(0, maxKeywords).map(({ word }) => {
    // Capitalize first letter
    const formatted = word.charAt(0).toUpperCase() + word.slice(1);
    // Limit tag length
    return formatted.length > 30 ? formatted.substring(0, 30) : formatted;
  });
}

/**
 * Find similar tags from existing tags based on content keywords
 */
export function findSimilarTags(
  keywords: string[],
  existingTags: Array<{ tagName: string; usageCount: number }>,
): Array<{ tagName: string; usageCount: number; matchScore: number }> {
  if (!keywords.length || !existingTags?.length) return [];

  const keywordSet = new Set(
    keywords.map((k) =>
      k
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    ),
  );

  const scoredTags = existingTags.map((tag) => {
    const normalizedTagName = tag.tagName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const tagWords = normalizedTagName.split(/[\s-_]+/);

    let matchScore = 0;

    // Check if any keyword matches the tag or is contained in it
    for (const keyword of keywordSet) {
      if (normalizedTagName.includes(keyword)) {
        matchScore += 3;
      }
      for (const tagWord of tagWords) {
        if (tagWord === keyword) {
          matchScore += 5;
        } else if (tagWord.includes(keyword) || keyword.includes(tagWord)) {
          matchScore += 2;
        }
      }
    }

    // Bonus based on usage count (popular tags are likely more relevant)
    if (matchScore > 0) {
      matchScore += Math.min(tag.usageCount * 0.1, 2);
    }

    return { ...tag, matchScore };
  });

  // Return tags with positive match scores, sorted by score
  return scoredTags
    .filter((tag) => tag.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get suggested tags based on document content
 * Combines keyword extraction with existing tag matching
 */
export interface TagSuggestion {
  tagName: string;
  source: "extracted" | "existing" | "combined";
  confidence: number; // 0-1
  isNew: boolean;
  color?: string;
  usageCount?: number;
}

export function getSuggestedTags(
  content: string,
  jsonContent: any[] | null,
  existingTags: Array<{ tagName: string; color: string; usageCount: number }>,
  currentTags: string[] = [],
  maxSuggestions: number = 8,
): TagSuggestion[] {
  // Extract text from all sources
  let fullText = content || "";
  if (jsonContent) {
    fullText += " " + extractTextFromBlockNote(jsonContent);
  }

  if (!fullText || fullText.length < 20) return [];

  const suggestions: TagSuggestion[] = [];
  const currentTagsLower = new Set(currentTags.map((t) => t.toLowerCase()));

  // Extract keywords from content
  const keywords = extractKeywords(fullText, 15);

  // Find matching existing tags
  const matchingTags = findSimilarTags(keywords, existingTags);

  // Add matching existing tags first (higher confidence)
  for (const match of matchingTags.slice(0, 5)) {
    if (!currentTagsLower.has(match.tagName.toLowerCase())) {
      const existingTag = existingTags.find((t) => t.tagName === match.tagName);
      suggestions.push({
        tagName: match.tagName,
        source: "existing",
        confidence: Math.min(match.matchScore / 10, 1),
        isNew: false,
        color: existingTag?.color,
        usageCount: existingTag?.usageCount,
      });
    }
  }

  // Add extracted keywords as potential new tags
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();

    // Skip if already added or in current tags
    if (
      currentTagsLower.has(keywordLower) ||
      suggestions.some((s) => s.tagName.toLowerCase() === keywordLower)
    ) {
      continue;
    }

    // Check if this keyword is close to an existing tag
    const closeMatch = existingTags.find(
      (t) =>
        t.tagName.toLowerCase().includes(keywordLower) ||
        keywordLower.includes(t.tagName.toLowerCase()),
    );

    if (
      closeMatch &&
      !suggestions.some((s) => s.tagName === closeMatch.tagName)
    ) {
      suggestions.push({
        tagName: closeMatch.tagName,
        source: "combined",
        confidence: 0.7,
        isNew: false,
        color: closeMatch.color,
        usageCount: closeMatch.usageCount,
      });
    } else if (!closeMatch) {
      suggestions.push({
        tagName: keyword,
        source: "extracted",
        confidence: 0.5,
        isNew: true,
      });
    }

    if (suggestions.length >= maxSuggestions) break;
  }

  // Sort by confidence and limit
  return suggestions
    .sort((a, b) => {
      // Prefer existing tags
      if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
      return b.confidence - a.confidence;
    })
    .slice(0, maxSuggestions);
}
