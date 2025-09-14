import React, { useEffect, useCallback, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "../../providers/ThemeProvider";
import { securityService } from "../../services/security.service";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface BlockNoteEditorProps {
  content?: any; // BlockNote JSON content
  onChange?: (content: any) => void;
  onContentChange?: (textContent: string) => void; // For search indexing
  placeholder?: string;
  editable?: boolean;
  className?: string;
  documentId?: string; // Para habilitar la carga de archivos
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  content,
  onChange,
  onContentChange,
  placeholder = "Comienza a escribir...",
  editable = true,
  className = "",
  documentId,
}) => {
  const { isDark } = useTheme();

  // Validate and prepare content
  const validContent = React.useMemo(() => {
    if (!content) return undefined;

    // If it's already a valid array of blocks, use it
    if (Array.isArray(content) && content.length > 0) {
      // Filter out invalid blocks like 'doc' type
      const validBlocks = content.filter(
        (block: any) =>
          block.type &&
          block.type !== "doc" &&
          [
            "paragraph",
            "heading",
            "bulletListItem",
            "numberedListItem",
            "codeBlock",
            "table",
            "file",
            "image",
            "video",
            "audio",
          ].includes(block.type)
      );
      return validBlocks.length > 0 ? validBlocks : undefined;
    }

    // If it's a single object that might be a block, validate it
    if (typeof content === "object" && content.type) {
      // Skip 'doc' type blocks that are not valid BlockNote blocks
      if (content.type === "doc") {
        // If it has content array, extract the blocks
        if (content.content && Array.isArray(content.content)) {
          const validBlocks = content.content.filter(
            (block: any) =>
              block.type &&
              block.type !== "doc" &&
              [
                "paragraph",
                "heading",
                "bulletListItem",
                "numberedListItem",
                "codeBlock",
                "table",
                "file",
                "image",
                "video",
                "audio",
              ].includes(block.type)
          );
          return validBlocks.length > 0 ? validBlocks : undefined;
        }
        return undefined;
      }
      return [content];
    }

    // If it's a string, create a simple paragraph block
    if (typeof content === "string" && content.trim()) {
      return [
        {
          id: "initial",
          type: "paragraph",
          content: [{ type: "text", text: content }],
        },
      ];
    }

    return undefined;
  }, [content]);

  // Create file upload handler for BlockNote - Basado en el sistema antiguo exitoso
  const handleFileUpload = useCallback(
    async (file: File): Promise<string> => {
      // Validar que tengamos un documentId válido
      if (!documentId || documentId.trim() === "") {
        console.warn("⚠️ [BlockNote] Sin documentId - creando URL temporal");
        // Crear URL temporal como fallback (igual que en el sistema antiguo)
        const tempUrl = URL.createObjectURL(file);
        return tempUrl;
      }

      try {
        // Obtener token desde SecurityService
        const tokens = securityService.getValidTokens();
        if (!tokens) {
          throw new Error("No hay sesión válida para subir archivo");
        }

        // Crear FormData para el upload
        const formData = new FormData();
        formData.append("files", file);

        // Realizar upload usando fetch directamente al API del backend
        const response = await fetch(
          `/api/files/knowledge/upload/${documentId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokens.token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Upload falló: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.uploaded && result.uploaded.length > 0) {
          const uploadedFile = result.uploaded[0];

          // Extraer el nombre del archivo físico de la URL de descarga
          // La URL viene como: /api/files/knowledge/download/hashprefijo_nombreOriginal.ext
          const downloadUrlParts = uploadedFile.downloadUrl.split("/");
          const physicalFileName =
            downloadUrlParts[downloadUrlParts.length - 1];

          // Obtener token desde SecurityService
          const tokens = securityService.getValidTokens();
          const token = tokens?.token;

          if (!token) {
            console.warn("⚠️ [BlockNote] No hay token válido disponible");
            throw new Error("No hay sesión válida para cargar archivo");
          }

          // Usar el endpoint de visualización con token como query parameter para autenticación
          const fileUrl = `${
            window.location.origin
          }/api/files/knowledge/view/${physicalFileName}?token=${encodeURIComponent(
            token
          )}`;

          // Retornar solo la URL como string (patrón del sistema antiguo)
          return fileUrl;
        } else {
          console.error(
            "❌ [BlockNote] No se encontraron archivos en la respuesta"
          );
          throw new Error("No se pudo obtener URL del archivo subido");
        }
      } catch (error) {
        console.error("❌ [BlockNote] Error en upload:", error);

        // Fallback a URL temporal en caso de error (igual que en el sistema antiguo)
        console.warn("⚠️ [BlockNote] Usando URL temporal como fallback");
        const tempUrl = URL.createObjectURL(file);
        return tempUrl;
      }
    },
    [documentId]
  );

  // Función para procesar contenido y añadir/actualizar tokens a las URLs de imágenes
  const processContentWithTokens = useCallback((content: any[]) => {
    if (!content || !Array.isArray(content)) {
      return content;
    }

    const tokens = securityService.getValidTokens();
    if (!tokens) {
      return content;
    }

    return content.map((block) => {
      if (block.type === "image" && block.props?.url) {
        // Si la URL es de nuestro sistema, actualizar o añadir el token
        if (block.props.url.includes("/api/files/knowledge/view/")) {
          let newUrl = block.props.url;

          // Si ya tiene un token, eliminarlo primero
          if (newUrl.includes("token=")) {
            const urlParts = newUrl.split("?");
            const baseUrl = urlParts[0];
            const queryParams = urlParts[1] || "";

            // Filtrar el parámetro token existente
            const params = new URLSearchParams(queryParams);
            params.delete("token");

            // Reconstruir la URL sin el token anterior
            newUrl = params.toString()
              ? `${baseUrl}?${params.toString()}`
              : baseUrl;
          }

          // Añadir el token actual válido
          const separator = newUrl.includes("?") ? "&" : "?";
          newUrl = `${newUrl}${separator}token=${encodeURIComponent(
            tokens.token
          )}`;

          return {
            ...block,
            props: {
              ...block.props,
              url: newUrl,
            },
          };
        }
      }
      return block;
    });
  }, []);

  // Procesar el contenido para añadir tokens a las imágenes existentes
  const processedContent = useMemo(() => {
    return processContentWithTokens(validContent);
  }, [
    validContent,
    processContentWithTokens,
    securityService.getValidTokens()?.token,
  ]);

  // Create the BlockNote editor with upload support - Configuración basada en el sistema antiguo
  const editor = useCreateBlockNote({
    initialContent: processedContent, // Usar contenido procesado con tokens
    uploadFile: documentId ? handleFileUpload : undefined, // Solo habilitar si hay documentId
    // Configuración de code blocks (del sistema antiguo)
    ...(editable && {
      codeBlock: {
        indentLineWithTab: true,
        defaultLanguage: "typescript",
        supportedLanguages: {
          typescript: { name: "TypeScript", aliases: ["ts"] },
          javascript: { name: "JavaScript", aliases: ["js"] },
          python: { name: "Python", aliases: ["py"] },
          java: { name: "Java" },
          sql: { name: "SQL" },
          html: { name: "HTML" },
          css: { name: "CSS" },
          json: { name: "JSON" },
          markdown: { name: "Markdown", aliases: ["md"] },
        },
      },
      // Configuración de tablas (solo en modo editable)
      tables: {
        cellBackgroundColor: true,
        cellTextColor: true,
        headers: true,
        splitCells: true,
      },
    }),
  });

  // Handle content changes
  const handleChange = useCallback(() => {
    if (!onChange && !onContentChange) return;

    // Get JSON content for storage
    const jsonContent = editor.document;

    // Get plain text content for search indexing
    const textContent = editor.document
      .map((block) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .filter((content) => content.type === "text")
            .map((content) => content.text || "")
            .join(" ");
        }
        return "";
      })
      .join(" ")
      .trim();

    onChange?.(jsonContent);
    onContentChange?.(textContent);
  }, [editor, onChange, onContentChange]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && processedContent) {
      // Only update if the content is different from current editor content
      const currentContent = editor.document;
      const contentChanged =
        JSON.stringify(currentContent) !== JSON.stringify(processedContent);

      if (contentChanged) {
        editor.replaceBlocks(editor.document, processedContent);
      }
    }
  }, [editor, processedContent, documentId]);

  // Efecto para refrescar tokens periódicamente (cada 5 minutos)
  useEffect(() => {
    if (!editor || !documentId) return;

    const refreshTokens = () => {
      const currentBlocks = editor.document;
      const updatedBlocks = processContentWithTokens(currentBlocks);

      // Solo actualizar si realmente cambió algo
      const hasChanges =
        JSON.stringify(currentBlocks) !== JSON.stringify(updatedBlocks);
      if (hasChanges) {
        editor.replaceBlocks(editor.document, updatedBlocks);
      }
    };

    // Refrescar inmediatamente y luego cada 5 minutos
    const interval = setInterval(refreshTokens, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [editor, documentId, processContentWithTokens]);

  return (
    <div
      className={`blocknote-editor ${className}`}
      data-theme={isDark ? "dark" : "light"}
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={isDark ? "dark" : "light"}
        slashMenu={true} // Habilitar el slash menu explícitamente
        formattingToolbar={true}
        linkToolbar={true}
        sideMenu={true}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .blocknote-editor .ProseMirror {
            min-height: 200px;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            transition: border-color 0.2s ease;
          }
          
          .blocknote-editor .ProseMirror:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .blocknote-editor .ProseMirror p.is-empty::before {
            content: "${placeholder}";
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
          
          /* Custom styling for dark mode */
          .dark .blocknote-editor .ProseMirror,
          .blocknote-editor[data-theme="dark"] .ProseMirror {
            background-color: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }
          
          .dark .blocknote-editor .ProseMirror:focus,
          .blocknote-editor[data-theme="dark"] .ProseMirror:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          
          .dark .blocknote-editor .ProseMirror p.is-empty::before,
          .blocknote-editor[data-theme="dark"] .ProseMirror p.is-empty::before {
            color: #6b7280;
          }
          
          /* Toolbar styling */
          .blocknote-editor .bn-toolbar {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          .dark .blocknote-editor .bn-toolbar,
          .blocknote-editor[data-theme="dark"] .bn-toolbar {
            background-color: #374151;
            border-color: #4b5563;
          }
          
          /* Menu styling */
          .blocknote-editor .bn-menu {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .dark .blocknote-editor .bn-menu {
            background-color: #374151;
            border-color: #4b5563;
          }
          
          /* Button styling */
          .blocknote-editor .bn-button {
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          
          .blocknote-editor .bn-button:hover {
            background-color: #f3f4f6;
          }
          
          .dark .blocknote-editor .bn-button:hover,
          .blocknote-editor[data-theme="dark"] .bn-button:hover {
            background-color: #4b5563;
          }
        `,
        }}
      />
    </div>
  );
};

export default BlockNoteEditor;
