import React, { useCallback, useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface BlockNoteEditorProps {
  content?: any; // BlockNote JSON content
  onChange?: (content: any) => void;
  onContentChange?: (textContent: string) => void; // For search indexing
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  content,
  onChange,
  onContentChange,
  placeholder = "Comienza a escribir...",
  editable = true,
  className = "",
}) => {
  // Create the BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: content,
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

  // Reactive theme detection
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`blocknote-editor ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={isDark ? "dark" : "light"}
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
          .dark .blocknote-editor .ProseMirror {
            background-color: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }
          
          .dark .blocknote-editor .ProseMirror:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          
          /* Toolbar styling */
          .blocknote-editor .bn-toolbar {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          .dark .blocknote-editor .bn-toolbar {
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
          
          .dark .blocknote-editor .bn-button:hover {
            background-color: #4b5563;
          }
        `,
        }}
      />
    </div>
  );
};

export default BlockNoteEditor;
