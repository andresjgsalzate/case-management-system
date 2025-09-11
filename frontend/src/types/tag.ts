export type TagCategory =
  | "priority"
  | "technical"
  | "type"
  | "technology"
  | "module"
  | "custom";

export interface Tag {
  id: string;
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
  category: TagCategory;
}

export interface UpdateTagRequest {
  tagName?: string;
  description?: string;
  color?: string;
  category?: TagCategory;
  isActive?: boolean;
}

export interface TagFilters {
  category?: TagCategory | "all";
  isActive?: boolean;
  search?: string;
}

export interface TagResponse {
  success: boolean;
  data: Tag;
  message?: string;
}

export interface TagsResponse {
  success: boolean;
  data: Tag[];
  message?: string;
}

// Constantes para las categorías de etiquetas
export const TAG_CATEGORIES = [
  {
    value: "priority" as TagCategory,
    label: "Prioridad",
    description: "Etiquetas de prioridad",
    color: "#EF4444",
  },
  {
    value: "technical" as TagCategory,
    label: "Técnico",
    description: "Etiquetas técnicas por área",
    color: "#3B82F6",
  },
  {
    value: "type" as TagCategory,
    label: "Tipo",
    description: "Tipo de trabajo realizado",
    color: "#8B5CF6",
  },
  {
    value: "technology" as TagCategory,
    label: "Tecnología",
    description: "Tecnologías específicas",
    color: "#10B981",
  },
  {
    value: "module" as TagCategory,
    label: "Módulo",
    description: "Módulos del sistema",
    color: "#F59E0B",
  },
  {
    value: "custom" as TagCategory,
    label: "Personalizado",
    description: "Etiquetas personalizadas",
    color: "#6B7280",
  },
] as const;

// Colores predefinidos para las etiquetas
export const TAG_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#6B7280", // Gray
] as const;
