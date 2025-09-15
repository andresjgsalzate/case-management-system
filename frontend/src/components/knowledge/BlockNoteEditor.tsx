import React, { useEffect, useCallback, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "../../providers/ThemeProvider";
import { securityService } from "../../services/security.service";
import { createHighlighter } from "../../lib/shiki.bundle";
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
    const result = processContentWithTokens(validContent);
    console.log("🔍 [BlockNote] Contenido procesado:", {
      original: content,
      valid: validContent,
      processed: result,
      editable,
    });
    return result;
  }, [
    validContent,
    processContentWithTokens,
    securityService.getValidTokens()?.token,
  ]);

  // Create the BlockNote editor with upload support - Configuración basada en el sistema antiguo
  const editor = useCreateBlockNote({
    initialContent: processedContent, // Usar contenido procesado con tokens
    uploadFile: documentId && editable ? handleFileUpload : undefined, // Solo habilitar si hay documentId Y es editable
    // CONFIGURACIÓN RADICAL: COMPLETAMENTE DIFERENTE para editable vs read-only
    ...(editable
      ? {
          // MODO EDITABLE: Configuración completa con selector
          codeBlock: {
            indentLineWithTab: true,
            defaultLanguage: "typescript",
            supportedLanguages: {
              // Lista completa de lenguajes soportados
              typescript: { name: "TypeScript", aliases: ["ts"] },
              javascript: { name: "JavaScript", aliases: ["js"] },
              python: { name: "Python", aliases: ["py"] },
              java: { name: "Java" },
              csharp: { name: "C#", aliases: ["cs"] },
              cpp: { name: "C++", aliases: ["c++"] },
              c: { name: "C" },
              go: { name: "Go" },
              rust: { name: "Rust", aliases: ["rs"] },
              php: { name: "PHP" },
              ruby: { name: "Ruby", aliases: ["rb"] },
              swift: { name: "Swift" },
              kotlin: { name: "Kotlin", aliases: ["kt"] },
              scala: { name: "Scala" },
              dart: { name: "Dart" },
              bash: { name: "Bash", aliases: ["sh", "shell"] },
              powershell: { name: "PowerShell", aliases: ["ps1"] },
              perl: { name: "Perl", aliases: ["pl"] },
              lua: { name: "Lua" },
              sql: { name: "SQL" },
              plsql: { name: "PL/SQL" },
              mysql: { name: "MySQL" },
              postgresql: { name: "PostgreSQL", aliases: ["postgres"] },
              html: { name: "HTML" },
              css: { name: "CSS" },
              scss: { name: "SCSS", aliases: ["sass"] },
              less: { name: "Less" },
              json: { name: "JSON" },
              yaml: { name: "YAML", aliases: ["yml"] },
              toml: { name: "TOML" },
              xml: { name: "XML" },
              ini: { name: "INI" },
              markdown: { name: "Markdown", aliases: ["md"] },
              latex: { name: "LaTeX", aliases: ["tex"] },
              vue: { name: "Vue" },
              svelte: { name: "Svelte" },
              jsx: { name: "JSX" },
              tsx: { name: "TSX" },
              dockerfile: { name: "Dockerfile", aliases: ["docker"] },
              makefile: { name: "Makefile", aliases: ["make"] },
              r: { name: "R" },
              matlab: { name: "MATLAB", aliases: ["m"] },
              text: { name: "Plain Text", aliases: ["txt"] },
              diff: { name: "Diff" },
              apache: { name: "Apache Config" },
              nginx: { name: "Nginx Config" },
            },
            createHighlighter: () => createHighlighter(),
          },
        }
      : {
          // MODO READ-ONLY: Configuración COMPLETA para mantener syntax highlighting
          codeBlock: {
            indentLineWithTab: false,
            defaultLanguage: "typescript",
            // INCLUIR TODOS los lenguajes para que el highlighting funcione
            supportedLanguages: {
              typescript: { name: "TypeScript", aliases: ["ts"] },
              javascript: { name: "JavaScript", aliases: ["js"] },
              python: { name: "Python", aliases: ["py"] },
              java: { name: "Java" },
              csharp: { name: "C#", aliases: ["cs"] },
              cpp: { name: "C++", aliases: ["c++"] },
              c: { name: "C" },
              go: { name: "Go" },
              rust: { name: "Rust", aliases: ["rs"] },
              php: { name: "PHP" },
              ruby: { name: "Ruby", aliases: ["rb"] },
              swift: { name: "Swift" },
              kotlin: { name: "Kotlin", aliases: ["kt"] },
              scala: { name: "Scala" },
              dart: { name: "Dart" },
              bash: { name: "Bash", aliases: ["sh", "shell"] },
              powershell: { name: "PowerShell", aliases: ["ps1"] },
              perl: { name: "Perl", aliases: ["pl"] },
              lua: { name: "Lua" },
              sql: { name: "SQL" },
              plsql: { name: "PL/SQL" },
              mysql: { name: "MySQL" },
              postgresql: { name: "PostgreSQL", aliases: ["postgres"] },
              html: { name: "HTML" },
              css: { name: "CSS" },
              scss: { name: "SCSS", aliases: ["sass"] },
              less: { name: "Less" },
              json: { name: "JSON" },
              yaml: { name: "YAML", aliases: ["yml"] },
              toml: { name: "TOML" },
              xml: { name: "XML" },
              ini: { name: "INI" },
              markdown: { name: "Markdown", aliases: ["md"] },
              latex: { name: "LaTeX", aliases: ["tex"] },
              vue: { name: "Vue" },
              svelte: { name: "Svelte" },
              jsx: { name: "JSX" },
              tsx: { name: "TSX" },
              dockerfile: { name: "Dockerfile", aliases: ["docker"] },
              makefile: { name: "Makefile", aliases: ["make"] },
              r: { name: "R" },
              matlab: { name: "MATLAB", aliases: ["m"] },
              text: { name: "Plain Text", aliases: ["txt"] },
              diff: { name: "Diff" },
              apache: { name: "Apache Config" },
              nginx: { name: "Nginx Config" },
            },
            // MANTENER createHighlighter para que funcione el syntax highlighting
            createHighlighter: () => createHighlighter(),
          },
        }),
    // Configuración de tablas (solo en modo editable)
    ...(editable && {
      tables: {
        cellBackgroundColor: true,
        cellTextColor: true,
        headers: true,
        splitCells: true,
      },
    }),
  });

  // Debug del editor
  console.log("🔧 [BlockNote] Editor creado:", {
    editor,
    editable,
    hasContent: !!processedContent,
    contentLength: processedContent?.length || 0,
  });

  // Configurar tema para BlockNote (funciona tanto en editable como read-only)
  useEffect(() => {
    const editorElement = document.querySelector(".blocknote-editor");
    if (editorElement) {
      editorElement.setAttribute("data-theme", isDark ? "dark" : "light");
      editorElement.setAttribute("data-editable", editable.toString());
    }
  }, [isDark, editor, editable]);

  // FORZAR ocultación del selector usando JavaScript directo
  useEffect(() => {
    if (!editable && editor) {
      const forceHideSelector = () => {
        // Buscar TODOS los posibles selectores en code blocks
        const selectors = document.querySelectorAll(`
          .blocknote-editor .bn-code-block .mantine-Select-root,
          .blocknote-editor .bn-code-block .mantine-Select-wrapper,
          .blocknote-editor .bn-code-block .mantine-Input-wrapper,
          .blocknote-editor .bn-code-block .mantine-ComboboxTarget,
          .blocknote-editor .bn-code-block .mantine-Combobox,
          .blocknote-editor .bn-code-block button,
          .blocknote-editor .bn-code-block select,
          .blocknote-editor .bn-code-block input,
          .blocknote-editor .bn-code-block [role="combobox"],
          .blocknote-editor .bn-code-block [aria-haspopup],
          .mantine-Select-dropdown,
          .mantine-Popover-dropdown,
          .mantine-Combobox-dropdown,
          div[role="listbox"]
        `);

        selectors.forEach((element) => {
          if (element instanceof HTMLElement) {
            // FUERZA BRUTAL: Eliminar visualmente pero mantener en DOM
            element.style.setProperty("display", "none", "important");
            element.style.setProperty("opacity", "0", "important");
            element.style.setProperty("pointer-events", "none", "important");
            element.style.setProperty("visibility", "hidden", "important");
            element.style.setProperty("position", "absolute", "important");
            element.style.setProperty("top", "-99999px", "important");
            element.style.setProperty("left", "-99999px", "important");
            element.style.setProperty("width", "0", "important");
            element.style.setProperty("height", "0", "important");
            element.style.setProperty("max-width", "0", "important");
            element.style.setProperty("max-height", "0", "important");
            element.style.setProperty("overflow", "hidden", "important");
            element.style.setProperty("z-index", "-99999", "important");
            element.style.setProperty("transform", "scale(0)", "important");

            // Remover eventos
            element.removeAttribute("tabindex");
            element.setAttribute("tabindex", "-1");
            element.setAttribute("aria-hidden", "true");

            // Deshabilitar completamente
            if (element.tagName === "BUTTON") {
              (element as HTMLButtonElement).disabled = true;
            }
            if (element.tagName === "INPUT") {
              (element as HTMLInputElement).disabled = true;
            }
            if (element.tagName === "SELECT") {
              (element as HTMLSelectElement).disabled = true;
            }
          }
        });

        // EXTRA: Ocultar cualquier dropdown que pueda estar abierto
        const dropdowns = document.querySelectorAll(`
          .mantine-Select-dropdown,
          .mantine-Popover-dropdown,
          .mantine-Combobox-dropdown,
          [data-mantine-color-scheme] [role="listbox"],
          [role="option"]
        `);

        dropdowns.forEach((dropdown) => {
          if (dropdown instanceof HTMLElement) {
            dropdown.style.setProperty("display", "none", "important");
            dropdown.remove(); // Eliminar completamente los dropdowns
          }
        });
      };

      // Aplicar inmediatamente y repetidamente
      const timeouts = [
        setTimeout(forceHideSelector, 0),
        setTimeout(forceHideSelector, 50),
        setTimeout(forceHideSelector, 100),
        setTimeout(forceHideSelector, 200),
        setTimeout(forceHideSelector, 500),
        setTimeout(forceHideSelector, 1000),
      ];

      // Observer más agresivo
      const observer = new MutationObserver(() => {
        setTimeout(forceHideSelector, 10);
        setTimeout(forceHideSelector, 50);
      });

      const editorElement = document.querySelector(".blocknote-editor");
      if (editorElement) {
        observer.observe(editorElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true,
        });
      }

      // También observar el body para dropdowns que aparecen fuera
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // INTERCEPTAR clicks y eventos para prevenir interacción
      const preventInteraction = (e: Event) => {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.closest(".mantine-Select-root") ||
            target.closest(".mantine-Select-dropdown") ||
            target.closest(".mantine-Combobox") ||
            target.closest('[role="combobox"]') ||
            target.closest('[role="listbox"]') ||
            target.closest("[aria-haspopup]"))
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };

      // Añadir listeners para interceptar interacciones
      document.addEventListener("click", preventInteraction, true);
      document.addEventListener("mousedown", preventInteraction, true);
      document.addEventListener("keydown", preventInteraction, true);
      document.addEventListener("focus", preventInteraction, true);

      return () => {
        timeouts.forEach(clearTimeout);
        observer.disconnect();
        document.removeEventListener("click", preventInteraction, true);
        document.removeEventListener("mousedown", preventInteraction, true);
        document.removeEventListener("keydown", preventInteraction, true);
        document.removeEventListener("focus", preventInteraction, true);
      };
    }
  }, [editable, editor]);

  // SOLUCIÓN DEFINITIVA: CSS suave para ocultar selector sin romper el DOM
  useEffect(() => {
    if (!editable) {
      const globalStyle =
        document.getElementById("blocknote-readonly-override") ||
        document.createElement("style");
      globalStyle.id = "blocknote-readonly-override";
      globalStyle.innerHTML = `
        /* OCULTAR COMPLETAMENTE el selector de lenguaje manteniendo el DOM */
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Select-root,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Select-wrapper,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Select-input,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Input-wrapper,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Input-root,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-ComboboxTarget,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-Combobox,
        .blocknote-editor[data-editable="false"] .bn-code-block .mantine-UnstyledButton-root,
        .blocknote-editor[data-editable="false"] .bn-code-block button,
        .blocknote-editor[data-editable="false"] .bn-code-block select,
        .blocknote-editor[data-editable="false"] .bn-code-block input,
        .blocknote-editor[data-editable="false"] .bn-code-block [role="combobox"],
        .blocknote-editor[data-editable="false"] .bn-code-block [aria-haspopup],
        .blocknote-editor[data-editable="false"] .bn-code-block [aria-expanded] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          position: absolute !important;
          top: -99999px !important;
          left: -99999px !important;
          width: 0 !important;
          height: 0 !important;
          max-width: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          z-index: -99999 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          transform: scale(0) !important;
        }
        
        /* Ocultar CUALQUIER dropdown globalmente */
        .mantine-Select-dropdown,
        .mantine-Popover-dropdown,
        .mantine-Combobox-dropdown,
        div[role="listbox"],
        div[role="option"],
        ul[role="listbox"],
        li[role="option"],
        [data-mantine-color-scheme] [role="listbox"],
        [data-mantine-color-scheme] [role="option"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          position: absolute !important;
          top: -99999px !important;
          left: -99999px !important;
        }
        
        /* Asegurar que el contenido de código se vea correctamente */
        .blocknote-editor[data-editable="false"] .bn-code-block {
          position: relative !important;
        }
        
        .blocknote-editor[data-editable="false"] .bn-code-block .bn-code-block-content {
          padding-top: 4px !important;
          margin-top: 0 !important;
          width: 100% !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* Forzar que solo el pre sea visible */
        .blocknote-editor[data-editable="false"] .bn-code-block pre {
          position: relative !important;
          z-index: 2 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Ajuste sutil para más ancho en lectura - SOLO el contenido interno */
        .blocknote-editor[data-editable="false"] .ProseMirror {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
          max-width: 100% !important;
        }

        /* Asegurar que las imágenes usen el espacio disponible */
        .blocknote-editor[data-editable="false"] .ProseMirror img {
          max-width: 100% !important;
          width: auto !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }

        /* Optimizar también el modo edición para mejor uso del espacio */
        .blocknote-editor[data-editable="true"] .ProseMirror {
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
          max-width: 100% !important;
        }

        /* Imágenes en modo edición también más anchas */
        .blocknote-editor[data-editable="true"] .ProseMirror img {
          max-width: 100% !important;
          width: auto !important;
          height: auto !important;
        }
      `;

      // Inyectar el CSS con máxima prioridad
      if (!document.head.contains(globalStyle)) {
        document.head.insertBefore(globalStyle, document.head.firstChild);
      }

      return () => {
        const styleElement = document.getElementById(
          "blocknote-readonly-override"
        );
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [editable]);

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

  // Efecto para aplicar syntax highlighting cuando el contenido cambia
  useEffect(() => {
    // BlockNote maneja el syntax highlighting automáticamente
    // Solo necesitamos asegurar que el tema esté configurado correctamente
    if (editor) {
      const editorElement = document.querySelector(".blocknote-editor");
      if (editorElement) {
        editorElement.setAttribute("data-theme", isDark ? "dark" : "light");
      }
    }
  }, [editor, processedContent, isDark]);

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
      data-editable={editable}
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={isDark ? "dark" : "light"}
        slashMenu={editable} // Solo habilitar si es editable
        formattingToolbar={editable} // Solo habilitar si es editable
        linkToolbar={editable} // Solo habilitar si es editable
        sideMenu={editable} // Solo habilitar si es editable
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
          
          /* CSS simplificado para modo de solo lectura */
          ${
            !editable
              ? `
          /* El CSS de ocultación se maneja dinámicamente con JavaScript */
          .blocknote-editor[data-editable="false"] .bn-code-block .bn-code-block-content {
            pointer-events: none !important;
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
          }
          `
              : ""
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
