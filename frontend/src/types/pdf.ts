/**
 * =================================================================
 * TIPOS TYPESCRIPT - EXPORTACIÓN PDF BLOCKNOTE
 * =================================================================
 * Descripción: Tipos específicos para la exportación PDF de documentos de conocimiento
 * Versión: 1.0
 * Fecha: 11 de Septiembre, 2025
 * =================================================================
 */

// Tipos base para contenido de texto con estilos
export interface TextContent {
  text: string;
  type: "text";
  styles: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
}

// Tipos para diferentes tipos de bloques
export interface BlockBase {
  id: string;
  content: TextContent[] | string;
  children: BlockBase[];
}

export interface ParagraphBlock extends BlockBase {
  type: "paragraph";
  props: Record<string, any>;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  props: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export interface CodeBlock extends BlockBase {
  type: "codeBlock";
  props: {
    language?: string;
  };
}

export interface ListItemBlock extends BlockBase {
  type: "bulletListItem" | "numberedListItem";
  props: Record<string, any>;
}

export interface CheckListItemBlock extends BlockBase {
  type: "checkListItem";
  props: {
    checked: boolean;
  };
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  props: Record<string, any>;
}

export interface DividerBlock extends BlockBase {
  type: "divider";
  props: Record<string, any>;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  props: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    caption?: string;
  };
}

export interface TableBlock extends BlockBase {
  type: "table";
  props: {
    rows?: number;
    columns?: number;
  };
}

// Unión de todos los tipos de bloques
export type PDFContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | CodeBlock
  | ListItemBlock
  | CheckListItemBlock
  | QuoteBlock
  | DividerBlock
  | ImageBlock
  | TableBlock;

// Tipo para tag con color
export interface KnowledgeTag {
  id: string;
  tag_name: string;
  color: string;
  description?: string;
  category?: string;
}

// Tipo para attachment/adjunto
export interface KnowledgeAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type?: string;
  is_embedded?: boolean;
  created_at: string;
}

// Estructura principal del documento de conocimiento para PDF
export interface KnowledgeDocumentPDF {
  id: string;
  title: string;
  content: PDFContentBlock[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  document_type?: {
    name: string;
    code: string;
    color?: string;
  };
  tags?: KnowledgeTag[];
  priority?: string;
  difficulty_level?: number;
  is_published?: boolean;
  view_count?: number;
  version?: number;
  associated_cases?: string[]; // Array de números de caso asociados
  createdByUser?: {
    fullName: string;
    email: string;
  };
  lastEditedByUser?: {
    fullName: string;
    email: string;
  };
  attachments?: KnowledgeAttachment[];
}

// Metadatos para el PDF
export interface PDFMetadata {
  title: string;
  author?: string;
  subject?: string;
  creator: string;
  producer: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// Opciones de configuración para la exportación PDF
export interface PDFExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  pageFormat?: "A4" | "Letter" | "A3";
  margin?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Estructura para representar texto con colores en syntax highlighting
export interface ColoredTextToken {
  text: string;
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
}
