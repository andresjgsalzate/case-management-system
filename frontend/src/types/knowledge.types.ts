// Tipos para el sistema de etiquetas con colores y categorías
export type TagCategory =
  | "priority"
  | "technical"
  | "type"
  | "technology"
  | "module"
  | "custom";

export interface KnowledgeDocumentTag {
  id: string;
  documentId?: string;
  tagName: string;
  description?: string;
  color: string;
  category: TagCategory;
  usageCount: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  tagName: string;
  description?: string;
  color?: string;
  category?: TagCategory;
  documentId?: string;
}

export interface UpdateTagRequest {
  tagName?: string;
  description?: string;
  color?: string;
  category?: TagCategory;
  isActive?: boolean;
}

// Paleta de colores predefinidos para etiquetas (misma del sistema antiguo)
export const TAG_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#84CC16", // Lime
  "#F472B6", // Pink-400
  "#A78BFA", // Violet-400
];

// Mapeo de categorías para determinación automática
export const CATEGORY_KEYWORDS = {
  priority: [
    "bug",
    "error",
    "fix",
    "critical",
    "urgent",
    "important",
    "high",
    "low",
  ],
  technical: [
    "backend",
    "frontend",
    "api",
    "database",
    "server",
    "client",
    "architecture",
  ],
  technology: [
    "react",
    "js",
    "javascript",
    "css",
    "html",
    "typescript",
    "node",
    "python",
    "java",
  ],
  type: [
    "feature",
    "enhancement",
    "improvement",
    "refactor",
    "documentation",
    "test",
  ],
  module: [
    "user",
    "admin",
    "auth",
    "authentication",
    "permission",
    "role",
    "system",
  ],
  custom: [], // Default fallback
};

// Helper para determinar categoría automática
export function determineCategory(tagName: string): TagCategory {
  const lowerName = tagName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      return category as TagCategory;
    }
  }

  return "custom";
}

// Helper para obtener color aleatorio evitando los últimos usados
export function getRandomColor(recentColors: string[] = []): string {
  const availableColors = TAG_COLORS.filter(
    (color) => !recentColors.includes(color)
  );
  const colorPool = availableColors.length > 0 ? availableColors : TAG_COLORS;
  return colorPool[Math.floor(Math.random() * colorPool.length)];
}
