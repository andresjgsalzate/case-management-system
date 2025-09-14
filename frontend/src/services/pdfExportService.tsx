/**
 * =================================================================
 * SERVICIO: EXPORTACIÓN PDF PARA DOCUMENTOS DE CONOCIMIENTO
 * =================================================================
 */

import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { codeToHtml } from "shiki";
import {
  KnowledgeDocumentPDF,
  PDFContentBlock,
  PDFExportOptions,
  ColoredTextToken,
} from "../types/pdf";

// =================== FUNCIONES DE UTILIDAD ===================

/**
 * Extrae texto plano del contenido de un bloque
 */
const extractTextFromContent = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && item.text) {
          return item.text;
        }
        return "";
      })
      .join("");
  }

  if (content && typeof content === "object" && content.text) {
    return content.text;
  }

  return String(content || "");
};

/**
 * Procesa código fuente con syntax highlighting usando Shiki
 */
const processCodeWithSyntaxHighlighting = async (
  code: string,
  language: string
): Promise<ColoredTextToken[]> => {
  try {
    // Mapeo de lenguajes comunes
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      rb: "ruby",
      php: "php",
      java: "java",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      go: "go",
      rust: "rust",
      swift: "swift",
      kotlin: "kotlin",
      scala: "scala",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      powershell: "powershell",
      sql: "sql",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      toml: "toml",
      ini: "ini",
      dockerfile: "dockerfile",
      makefile: "makefile",
      r: "r",
      matlab: "matlab",
      lua: "lua",
      perl: "perl",
      dart: "dart",
      vue: "vue",
      svelte: "svelte",
      jsx: "jsx",
      tsx: "tsx",
    };

    const normalizedLanguage =
      languageMap[language.toLowerCase()] || language.toLowerCase();

    // Generar HTML con syntax highlighting usando tema claro para PDF
    const html = await codeToHtml(code, {
      lang: normalizedLanguage,
      theme: "github-light",
    });

    // Extraer los tokens del HTML generado
    const tokens = parseShikiHtmlToTokens(html);
    return tokens;
  } catch (error) {
    console.warn("⚠️ Error en syntax highlighting, usando texto plano:", error);
    // Fallback: retornar el código como texto plano
    return [{ text: code, color: "#1F2937" }];
  }
};

/**
 * Parsea el HTML generado por Shiki y extrae tokens con colores
 */
const parseShikiHtmlToTokens = (html: string): ColoredTextToken[] => {
  const tokens: ColoredTextToken[] = [];

  try {
    // Remover el wrapper HTML y extraer solo el contenido del <pre><code>
    const codeMatch = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
    if (!codeMatch) {
      return [{ text: html, color: "#1F2937" }];
    }

    const codeContent = codeMatch[1];

    // Usar regex para extraer spans con estilos
    const spanRegex = /<span[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g;
    let lastIndex = 0;
    let match;

    while ((match = spanRegex.exec(codeContent)) !== null) {
      // Agregar texto antes del span si existe
      if (match.index > lastIndex) {
        const plainText = codeContent.slice(lastIndex, match.index);
        if (plainText) {
          tokens.push({ text: cleanHtmlEntities(plainText), color: "#1F2937" });
        }
      }

      // Extraer color del estilo
      const styleAttr = match[1];
      const colorMatch = styleAttr.match(/color:\s*([^;]+)/);
      const color = colorMatch ? colorMatch[1].trim() : "#1F2937";

      // Agregar el texto del span
      const spanText = cleanHtmlEntities(match[2]);
      if (spanText) {
        tokens.push({ text: spanText, color });
      }

      lastIndex = spanRegex.lastIndex;
    }

    // Agregar texto restante
    if (lastIndex < codeContent.length) {
      const remainingText = codeContent.slice(lastIndex);
      if (remainingText) {
        tokens.push({
          text: cleanHtmlEntities(remainingText),
          color: "#1F2937",
        });
      }
    }

    return tokens.length > 0 ? tokens : [{ text: html, color: "#1F2937" }];
  } catch (error) {
    console.warn("⚠️ Error parseando HTML de Shiki:", error);
    return [{ text: html, color: "#1F2937" }];
  }
};

/**
 * Limpia entidades HTML básicas
 */
const cleanHtmlEntities = (text: string): string => {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/<[^>]*>/g, ""); // Remover cualquier tag HTML restante
};

/**
 * Obtiene el icono correspondiente para un tipo de archivo
 */
const getAttachmentIcon = (
  fileType?: string,
  mimeType?: string,
  fileName?: string
): string => {
  const type = fileType?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";
  const extension = fileName
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";

  // Documentos de texto
  if (
    type === "document" ||
    mime.includes("word") ||
    mime.includes("doc") ||
    extension === "doc" ||
    extension === "docx"
  ) {
    return "[DOC]";
  }

  // PDFs
  if (type === "pdf" || mime.includes("pdf") || extension === "pdf") {
    return "[PDF]";
  }

  // Hojas de cálculo
  if (
    type === "spreadsheet" ||
    mime.includes("sheet") ||
    mime.includes("excel") ||
    extension === "xls" ||
    extension === "xlsx" ||
    extension === "csv"
  ) {
    return "[XLS]";
  }

  // Presentaciones
  if (
    type === "presentation" ||
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return "[PPT]";
  }

  // Archivos de texto
  if (
    type === "text" ||
    mime.includes("text") ||
    extension === "txt" ||
    extension === "md"
  ) {
    return "[TXT]";
  }

  // Imágenes
  if (
    type === "image" ||
    mime.includes("image") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)
  ) {
    return "[IMG]";
  }

  // Archivos comprimidos
  if (
    type === "archive" ||
    mime.includes("zip") ||
    mime.includes("rar") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(extension)
  ) {
    return "[ZIP]";
  }

  // Por defecto
  return "[FILE]";
};

/**
 * Formatea el tamaño de archivo de forma legible
 */
const formatAttachmentFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// =================== ESTILOS PDF ===================

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    paddingBottom: 60, // Más espacio para el footer fijo
    fontFamily: "Helvetica",
  },

  // Header del documento
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },

  title: {
    fontSize: 28,
    fontWeight: "ultrabold",
    marginBottom: 8,
    color: "#1F2937",
    letterSpacing: 0.5,
  },

  // Footer con número de página
  pageFooter: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },

  pageNumber: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "normal",
  },

  // Cuadro de información mejorado
  infoBox: {
    backgroundColor: "#F9FAFB",
    border: "1pt solid #D1D5DB",
    borderRadius: 8,
    padding: 18,
    marginBottom: 24,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1F2937",
    letterSpacing: 0.3,
  },

  metadataRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "flex-start",
    minHeight: 14,
  },

  metadataLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4B5563",
    width: 120,
    marginRight: 12,
    flexShrink: 0,
  },

  metadataValue: {
    fontSize: 11,
    color: "#111827",
    flex: 1,
    lineHeight: 1.3,
  },

  // Estilos para tags coloreados
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },

  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 3,
  },

  tagText: {
    fontSize: 10,
    fontWeight: "medium",
    color: "#FFFFFF",
  },

  // Contenido principal
  content: {
    flex: 1,
  },

  // Bloques básicos
  paragraph: {
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 8,
    color: "#000000",
  },

  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    color: "#111827",
  },

  heading2: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    color: "#111827",
  },

  heading3: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#111827",
  },

  // Listas
  listItem: {
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 4,
    marginLeft: 20,
    color: "#000000",
  },

  numberedListItem: {
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 4,
    marginLeft: 20,
    color: "#000000",
  },

  // Checkboxes mejorados
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginLeft: 20,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: "#2F80ED",
    borderColor: "#2F80ED",
  },

  checkmark: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  checkboxText: {
    fontSize: 12,
    lineHeight: 1.4,
    color: "#000000",
    flex: 1,
  },

  // Bloques de código mejorados
  codeBlock: {
    backgroundColor: "#F1F3F4",
    border: "1pt solid #D1D5DB",
    borderRadius: 6,
    padding: 16,
    marginVertical: 12,
    fontFamily: "Courier",
  },

  codeLanguage: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "bold",
  },

  codeText: {
    fontSize: 11,
    lineHeight: 1.3,
    color: "#1F2937",
    fontFamily: "Courier",
  },

  // Citas
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: "#E5E7EB",
    paddingLeft: 16,
    marginVertical: 12,
    fontStyle: "italic",
  },

  quoteText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.4,
  },

  // Divisores
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginVertical: 16,
  },

  // Tablas
  table: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  tableHeaderRow: {
    backgroundColor: "#F9FAFB",
  },

  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 11,
    color: "#374151",
  },

  tableHeaderCell: {
    fontWeight: "bold",
    color: "#111827",
  },

  // Texto con estilos específicos
  boldText: {
    fontWeight: "bold",
  },

  italicText: {
    fontStyle: "italic",
  },

  underlineText: {
    textDecoration: "underline",
  },

  strikethroughText: {
    textDecoration: "line-through",
  },

  inlineCode: {
    fontFamily: "Courier",
    backgroundColor: "#F1F3F4",
    padding: 2,
    borderRadius: 3,
    fontSize: 11,
  },

  // Sección de adjuntos
  attachmentsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  attachmentsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
  },

  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#F9FAFB",
    border: "1pt solid #E5E7EB",
    borderRadius: 4,
  },

  attachmentIcon: {
    fontSize: 12,
    marginRight: 8,
    color: "#6B7280",
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },

  attachmentDetails: {
    fontSize: 9,
    color: "#6B7280",
  },

  // Footer - más compacto y siempre presente
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
  },

  // Estilos para página de adjuntos
  attachmentPageInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  attachmentPageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
  },
});

// Continuará en la siguiente parte...

// =================== RENDERIZADO DE BLOQUES ===================

const renderInlineContent = (content: any): React.ReactNode => {
  if (typeof content === "string") {
    return content || null;
  }

  if (Array.isArray(content)) {
    const renderedItems = content
      .map((item, index) => {
        if (typeof item === "string") {
          return item || null;
        }

        if (item.type === "text") {
          const text = item.text || "";
          if (!text.trim()) return null;

          // Aplicar estilos según las propiedades del texto
          const textStyles: any = {
            fontSize: 12,
            color: "#000000",
            lineHeight: 1.4,
          };

          if (item.styles) {
            if (item.styles.bold) textStyles.fontWeight = "bold";
            if (item.styles.italic) textStyles.fontStyle = "italic";
            if (item.styles.underline) textStyles.textDecoration = "underline";
            if (item.styles.strikethrough)
              textStyles.textDecoration = "line-through";
            if (item.styles.code) {
              textStyles.fontFamily = "Courier";
              textStyles.backgroundColor = "#F1F3F4";
              textStyles.padding = 2;
              textStyles.borderRadius = 3;
              textStyles.fontSize = 11;
            }

            // Manejo de colores
            if (item.styles.textColor && item.styles.textColor !== "default") {
              textStyles.color = item.styles.textColor;
            }
            if (
              item.styles.backgroundColor &&
              item.styles.backgroundColor !== "default"
            ) {
              textStyles.backgroundColor = item.styles.backgroundColor;
            }
          }

          return (
            <Text key={index} style={textStyles}>
              {text}
            </Text>
          );
        }

        if (item.text) {
          const text = item.text || "";
          if (!text.trim()) return null;
          return (
            <Text
              key={index}
              style={{ fontSize: 12, color: "#000000", lineHeight: 1.4 }}
            >
              {text}
            </Text>
          );
        }

        return null;
      })
      .filter((item) => item !== null && item !== "");

    // Si solo hay un elemento y es texto simple, devolverlo directamente
    if (renderedItems.length === 1 && typeof renderedItems[0] === "string") {
      return renderedItems[0];
    }

    return renderedItems;
  }

  if (content && typeof content === "object") {
    if (content.text) {
      const text = content.text || "";
      if (!text.trim()) return null;
      return text;
    }
    if (content.content) {
      return renderInlineContent(content.content);
    }
  }

  return null;
};

const renderBlock = (
  block: PDFContentBlock,
  index: number,
  numberedListCounter?: { value: number }
): React.ReactElement => {
  switch (block.type) {
    case "paragraph":
      return (
        <Text key={index} style={styles.paragraph}>
          {renderInlineContent(block.content)}
        </Text>
      );

    case "heading":
      const headingLevel = block.props?.level || 1;
      const headingStyle =
        headingLevel === 1
          ? styles.heading1
          : headingLevel === 2
          ? styles.heading2
          : styles.heading3;
      return (
        <Text key={index} style={headingStyle}>
          {renderInlineContent(block.content)}
        </Text>
      );

    case "bulletListItem":
      return (
        <Text key={index} style={styles.listItem}>
          • {renderInlineContent(block.content)}
        </Text>
      );

    case "numberedListItem":
      const itemNumber = numberedListCounter ? numberedListCounter.value++ : 1;
      return (
        <Text key={index} style={styles.numberedListItem}>
          {itemNumber}. {renderInlineContent(block.content)}
        </Text>
      );

    case "checkListItem":
      const isChecked = block.props?.checked || false;
      return (
        <View key={index} style={styles.checklistItem}>
          <View
            style={
              isChecked
                ? [styles.checkbox, styles.checkboxChecked]
                : styles.checkbox
            }
          >
            {isChecked && <Text style={styles.checkmark}>✔</Text>}
          </View>
          <Text style={styles.checkboxText}>
            {renderInlineContent(block.content)}
          </Text>
        </View>
      );

    case "codeBlock":
      const language = (block.props as any)?.language || "";
      const blockAny = block as any;

      // Verificar si el bloque tiene tokens de syntax highlighting
      if (blockAny.syntaxTokens && blockAny.isProcessed) {
        return (
          <View key={index} style={styles.codeBlock}>
            {language && (
              <Text style={styles.codeLanguage}>{language.toUpperCase()}</Text>
            )}
            <Text style={styles.codeText}>
              {blockAny.syntaxTokens.map(
                (token: ColoredTextToken, tokenIndex: number) => (
                  <Text
                    key={tokenIndex}
                    style={[
                      styles.codeText,
                      { color: token.color || "#1F2937" },
                    ]}
                  >
                    {token.text}
                  </Text>
                )
              )}
            </Text>
          </View>
        );
      }

      // Fallback: renderizado normal sin syntax highlighting
      return (
        <View key={index} style={styles.codeBlock}>
          {language && (
            <Text style={styles.codeLanguage}>{language.toUpperCase()}</Text>
          )}
          <Text style={styles.codeText}>
            {renderInlineContent(block.content)}
          </Text>
        </View>
      );

    case "quote":
      return (
        <View key={index} style={styles.quote}>
          <Text style={styles.quoteText}>
            {renderInlineContent(block.content)}
          </Text>
        </View>
      );

    case "divider":
      return <View key={index} style={styles.divider} />;

    case "table":
      return renderTable(block, index);

    case "image":
      return renderImage(block, index);

    default:
      return (
        <Text key={index} style={styles.paragraph}>
          {renderInlineContent((block as any).content)}
        </Text>
      );
  }
};

const renderTable = (
  block: PDFContentBlock,
  index: number
): React.ReactElement => {
  if (!block.content || !Array.isArray(block.content)) {
    return <View key={index} />;
  }

  return (
    <View key={index} style={styles.table}>
      {block.content.map((row: any, rowIndex: number) => (
        <View
          key={rowIndex}
          style={
            rowIndex === 0
              ? [styles.tableRow, styles.tableHeaderRow]
              : styles.tableRow
          }
        >
          {row.content &&
            row.content.map((cell: any, cellIndex: number) => (
              <Text
                key={cellIndex}
                style={
                  rowIndex === 0
                    ? [styles.tableCell, styles.tableHeaderCell]
                    : styles.tableCell
                }
              >
                {renderInlineContent(cell)}
              </Text>
            ))}
        </View>
      ))}
    </View>
  );
};

const renderImage = (
  block: PDFContentBlock,
  index: number
): React.ReactElement => {
  if (block.type !== "image") {
    return <View key={index} />;
  }

  const src = (block.props as any)?.url || "";
  const alt = (block.props as any)?.alt || "";
  const caption = (block.props as any)?.caption || "";

  if (!src) {
    return <View key={index} />;
  }

  // Verificar si es una imagen externa
  const isExternalImage = src.startsWith("http") && !src.includes("localhost");

  return (
    <View key={index} style={{ marginVertical: 12, alignItems: "center" }}>
      {isExternalImage ? (
        // Para imágenes externas, mostrar un placeholder debido a problemas de CORS
        <View
          style={{
            width: 300,
            height: 200,
            backgroundColor: "#F1F3F4",
            border: "1pt dashed #D1D5DB",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Imagen Externa
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            {src.length > 60 ? `${src.substring(0, 60)}...` : src}
          </Text>
        </View>
      ) : (
        // Para imágenes locales, intentar renderizar
        <Image
          src={src}
          style={{
            maxWidth: 500,
            maxHeight: 300,
            objectFit: "contain",
          }}
        />
      )}
      {(alt || caption) && (
        <Text
          style={{
            fontSize: 10,
            color: "#6B7280",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {caption || alt}
        </Text>
      )}
    </View>
  );
};

// =================== PREPROCESAMIENTO DE BLOQUES ===================

/**
 * Preprocesa el documento completo aplicando syntax highlighting a bloques de código
 */
const preprocessDocumentWithSyntaxHighlighting = async (
  document: KnowledgeDocumentPDF
): Promise<KnowledgeDocumentPDF> => {
  try {
    console.log(
      "🎨 [PDF] Iniciando preprocesamiento con syntax highlighting..."
    );

    if (!document.content || !Array.isArray(document.content)) {
      console.warn("⚠️ [PDF] Documento sin contenido válido");
      return document;
    }

    // Procesar todos los bloques de código
    const processedContent = await Promise.all(
      document.content.map(async (block: any) => {
        if (block.type === "codeBlock") {
          const language = block.props?.language || "";
          const codeContent = extractTextFromContent(block.content);

          if (codeContent.trim()) {
            try {
              const syntaxTokens = await processCodeWithSyntaxHighlighting(
                codeContent,
                language
              );

              // Agregar tokens al bloque
              return {
                ...block,
                syntaxTokens,
                isProcessed: true,
              };
            } catch (error) {
              console.warn(
                "⚠️ [PDF] Error procesando bloque de código:",
                error
              );
              return block;
            }
          }
        }

        return block;
      })
    );

    return {
      ...document,
      content: processedContent as PDFContentBlock[],
    };
  } catch (error) {
    console.error("❌ [PDF] Error en preprocesamiento:", error);
    return document;
  }
};

// =================== COMPONENTE PDF ===================

interface PDFDocumentProps {
  document: KnowledgeDocumentPDF;
  options?: PDFExportOptions;
}

const PDFDocumentComponent: React.FC<PDFDocumentProps> = ({
  document,
}: {
  document: KnowledgeDocumentPDF;
}) => {
  // Filtrar adjuntos para obtener solo documentos (no imágenes embebidas)
  const documentAttachments = (document.attachments || []).filter(
    (attachment: any) => {
      const mimeType = attachment.mime_type || "";
      const fileType = attachment.file_type || "";

      // Excluir imágenes y archivos embebidos
      return (
        !mimeType.startsWith("image/") &&
        fileType !== "image" &&
        !attachment.is_embedded
      );
    }
  );

  // Debug: Log de los adjuntos filtrados
  console.log(
    "📎 [PDF DEBUG] Adjuntos documentales encontrados:",
    documentAttachments.length
  );
  documentAttachments.forEach((att: any, idx: number) => {
    console.log(`Adjunto ${idx + 1}:`, {
      fileName: att.file_name || att.fileName || att.name,
      fileType: att.file_type || att.fileType,
      mimeType: att.mime_type || att.mimeType,
      fileSize: att.file_size || att.fileSize || att.size,
      allProps: Object.keys(att),
    });
  });

  // Calcular tamaño de fuente dinámico basado en cantidad de etiquetas
  const getTagFontSize = (tagCount: number) => {
    if (tagCount <= 2) return 10; // Tamaño normal
    if (tagCount <= 4) return 9; // Ligeramente más pequeño
    if (tagCount <= 6) return 8; // Más pequeño
    return 7; // Muy pequeño para muchas etiquetas
  };

  const tagFontSize = getTagFontSize((document.tags || []).length);

  return (
    <Document>
      {/* Página principal con contenido */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {document.title || "Documento Sin Título"}
          </Text>
        </View>

        {/* Cuadro de información mejorado */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Información del Documento</Text>

          {document.createdByUser && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Creado por:</Text>
              <Text style={styles.metadataValue}>
                {(
                  document.createdByUser.fullName ||
                  document.createdByUser.email ||
                  "Usuario desconocido"
                ).trim()}
              </Text>
            </View>
          )}

          {document.document_type && document.document_type.name && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Tipo:</Text>
              <Text style={styles.metadataValue}>
                {document.document_type.name.trim()}
              </Text>
            </View>
          )}

          {document.priority && document.priority.trim() && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Prioridad:</Text>
              <Text style={styles.metadataValue}>
                {document.priority.trim()}
              </Text>
            </View>
          )}

          {document.is_published !== undefined && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Estado:</Text>
              <Text style={styles.metadataValue}>
                {document.is_published ? "Publicado" : "Borrador"}
              </Text>
            </View>
          )}

          {/* Renderizado de etiquetas con colores */}
          {document.tags && document.tags.length > 0 && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Etiquetas:</Text>
              <View style={styles.tagContainer}>
                {document.tags.map((tag: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: tag.color || "#6B7280" },
                    ]}
                  >
                    <Text style={[styles.tagText, { fontSize: tagFontSize }]}>
                      {tag.tag_name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {document.created_at && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Fecha:</Text>
              <Text style={styles.metadataValue}>
                {new Date(document.created_at).toLocaleDateString("es-ES")}
              </Text>
            </View>
          )}
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {document.content &&
            Array.isArray(document.content) &&
            (() => {
              // Crear un contador para listas numeradas
              const numberedListCounter = { value: 1 };
              let isInNumberedList = false;

              return document.content.map(
                (block: PDFContentBlock, index: number) => {
                  // Resetear contador si salimos de una lista numerada
                  if (block.type !== "numberedListItem" && isInNumberedList) {
                    numberedListCounter.value = 1;
                    isInNumberedList = false;
                  }

                  // Marcar si entramos en una lista numerada
                  if (block.type === "numberedListItem") {
                    isInNumberedList = true;
                  }

                  return renderBlock(block, index, numberedListCounter);
                }
              );
            })()}
        </View>

        {/* Footer de la página principal */}
        <Text style={styles.footer}>
          Versión {document.version || 1} • Generado el{" "}
          {new Date().toLocaleDateString("es-ES")}
        </Text>
      </Page>

      {/* Página separada para adjuntos (solo si hay documentos adjuntos) */}
      {documentAttachments.length > 0 && (
        <Page size="A4" style={styles.page}>
          {/* Header de la página de adjuntos */}
          <View style={styles.header}>
            <Text style={styles.title}>Adjuntos del Documento</Text>
          </View>

          {/* Información del documento original */}
          <View style={styles.attachmentPageInfo}>
            <Text style={styles.attachmentPageTitle}>
              Documento: {document.title || "Sin título"}
            </Text>
          </View>

          {/* Lista de adjuntos */}
          <View style={styles.attachmentsSection}>
            {documentAttachments.map((attachment: any, index: number) => {
              // Debug: Log del attachment para diagnosticar

              const fileName =
                attachment.file_name ||
                attachment.fileName ||
                attachment.name ||
                `Archivo ${index + 1}`;
              const fileType =
                attachment.file_type ||
                attachment.fileType ||
                attachment.type ||
                "documento";
              const mimeType =
                attachment.mime_type ||
                attachment.mimeType ||
                "application/octet-stream";
              const fileSize =
                attachment.file_size ||
                attachment.fileSize ||
                attachment.size ||
                0;
              const createdAt =
                attachment.created_at ||
                attachment.createdAt ||
                new Date().toISOString();

              return (
                <View key={index} style={styles.attachmentItem}>
                  <Text style={styles.attachmentIcon}>
                    {getAttachmentIcon(fileType, mimeType, fileName)}
                  </Text>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName}>{fileName}</Text>
                    <Text style={styles.attachmentDetails}>
                      Tipo: {fileType} • Tamaño:{" "}
                      {formatAttachmentFileSize(fileSize)} • Subido:{" "}
                      {new Date(createdAt).toLocaleDateString("es-ES")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Footer de la página de adjuntos */}
          <Text style={styles.footer}>
            Versión {document.version || 1} • Generado el{" "}
            {new Date().toLocaleDateString("es-ES")}
          </Text>
        </Page>
      )}
    </Document>
  );
};

// =================== FUNCIONES PRINCIPALES ===================

/**
 * Función principal para descargar PDF
 */
export const downloadPDF = async (
  document: KnowledgeDocumentPDF,
  options: PDFExportOptions = {}
): Promise<void> => {
  try {
    // Preprocesar documento con syntax highlighting
    const preprocessedDocument = await preprocessDocumentWithSyntaxHighlighting(
      document
    );

    // Generar PDF
    const blob = await pdf(
      <PDFDocumentComponent document={preprocessedDocument} />
    ).toBlob();

    // Determinar nombre del archivo
    const filename =
      options.fileName ||
      (preprocessedDocument.title
        ? `${preprocessedDocument.title}.pdf`
        : "documento.pdf");

    // Descargar
    saveAs(blob, filename);
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    throw new Error(`Error al generar PDF: ${error}`);
  }
};

/**
 * Función fallback para documentos simples
 */
export const createFallbackPDF = async (
  title: string = "Documento",
  content: string = "Sin contenido disponible"
): Promise<void> => {
  try {
    const fallbackDocument: KnowledgeDocumentPDF = {
      id: "fallback-doc",
      title,
      content: [
        {
          id: "fallback-1",
          type: "paragraph",
          content: [{ text: content, type: "text", styles: {} }],
          props: {},
          children: [],
        },
      ],
      created_at: new Date().toISOString(),
    };

    await downloadPDF(fallbackDocument, { fileName: `${title}.pdf` });
  } catch (error) {
    console.error("❌ Error generando PDF fallback:", error);
    throw new Error(`Error al generar PDF fallback: ${error}`);
  }
};

/**
 * Función para obtener vista previa (opcional - para futuras implementaciones)
 */
export const getPDFPreview = async (
  document: KnowledgeDocumentPDF
): Promise<string> => {
  try {
    console.log(
      "👁️ [PDF Preview] Generando vista previa con syntax highlighting..."
    );

    // Preprocesar documento con syntax highlighting
    const preprocessedDocument = await preprocessDocumentWithSyntaxHighlighting(
      document
    );

    const blob = await pdf(
      <PDFDocumentComponent document={preprocessedDocument} />
    ).toBlob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("❌ Error generando vista previa PDF:", error);
    throw new Error(`Error al generar vista previa: ${error}`);
  }
};

// Exportación por defecto
export default {
  downloadPDF,
  createFallbackPDF,
  getPDFPreview,
};

// Exportaciones adicionales para debugging y testing
export {
  processCodeWithSyntaxHighlighting,
  preprocessDocumentWithSyntaxHighlighting,
};
