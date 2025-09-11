import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  TagIcon,
  XMarkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import {
  useCreateKnowledgeDocument,
  useUpdateKnowledgeDocument,
  useKnowledgeDocument,
  useDocumentTypes,
  useAllTags,
  useSearchTags,
} from "../hooks/useKnowledge";
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  Priority,
  KnowledgeDocumentTag,
} from "../types/knowledge";
// import {
//   TAG_COLORS,
// } from "../types/knowledge.types";
import BlockNoteEditor from "../components/knowledge/BlockNoteEditor";
import FileUpload from "../components/FileUpload";
import AttachmentsList from "../components/AttachmentsList";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useToast } from "../hooks/useNotification";

const KnowledgeDocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Form state
  const [title, setTitle] = useState("");
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [textContent, setTextContent] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [difficultyLevel, setDifficultyLevel] = useState<number>(1);
  const [isTemplate, setIsTemplate] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showSuggestedTags, setShowSuggestedTags] = useState(false);
  const [userHidTags, setUserHidTags] = useState(false); // Track if user manually hid tags
  const [showPredictiveTags, setShowPredictiveTags] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false); // Para mostrar/ocultar sección de archivos

  // Notificaciones
  const { success, error: showError } = useToast();

  // Mutations
  const createMutation = useCreateKnowledgeDocument({
    onSuccess: () => {
      success("Documento creado exitosamente");
      navigate("/knowledge");
    },
    onError: (error: any) => {
      showError(`Error al crear documento: ${error.message}`);
    },
  });
  const updateMutation = useUpdateKnowledgeDocument({
    onSuccess: () => {
      success("Documento actualizado exitosamente");
      navigate("/knowledge");
    },
    onError: (error: any) => {
      showError(`Error al actualizar documento: ${error.message}`);
    },
  });
  // TODO: Implementar hooks de tags
  // const createTagMutation = useCreateTag({
  //   onSuccess: () => {
  //     success("Etiqueta creada exitosamente");
  //   },
  //   onError: () => {
  //     showError("Error al crear la etiqueta");
  //   },
  // });

  // Queries
  const { data: document, isLoading: documentLoading } = useKnowledgeDocument(
    id || ""
  );
  const { data: documentTypes } = useDocumentTypes();
  // Sistema de tags habilitado - usar todas las etiquetas en lugar de solo populares
  const {
    data: popularTags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useAllTags(); // Cambiado de usePopularTags(15) a useAllTags()

  // Sistema de predicción de tags
  const { data: predictiveTags, isLoading: searchLoading } =
    useSearchTags(tagInput);

  // Effect para cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tag-input-container")) {
        setShowPredictiveTags(false);
      }
    };

    if (typeof window !== "undefined" && window.document) {
      window.document.addEventListener("mousedown", handleClickOutside);
      return () => {
        window.document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, []);

  // Debug logs
  React.useEffect(() => {
    console.log("🏷️ Popular tags data:", popularTags);
    console.log("🏷️ Tags loading:", tagsLoading);
    console.log("🏷️ Tags error:", tagsError);
    if (tagsError) {
      console.error("🚨 Tags error details:", {
        message: tagsError.message,
        error: tagsError,
      });
    }
    console.log("🏷️ Show suggested tags:", showSuggestedTags);
    console.log("🔍 Tag input:", tagInput);
    console.log("🔍 Predictive tags:", predictiveTags);
    console.log("🔍 Search loading:", searchLoading);
  }, [
    popularTags,
    tagsLoading,
    tagsError,
    showSuggestedTags,
    tagInput,
    predictiveTags,
    searchLoading,
  ]);

  // Auto-show popular tags when they load (but respect user's choice to hide them)
  React.useEffect(() => {
    if (
      popularTags &&
      popularTags.length > 0 &&
      !showSuggestedTags &&
      !userHidTags // Only show if user hasn't manually hidden them
    ) {
      // Show suggested tags when popular tags are loaded
      setShowSuggestedTags(true);
    }
  }, [popularTags, tags.length, showSuggestedTags, userHidTags]);

  // Load document data if editing
  useEffect(() => {
    if (document) {
      console.log("📄 Loading document for editing:", document);
      console.log("📄 Document jsonContent:", document.jsonContent);
      console.log("📄 Document content:", document.content);

      setTitle(document.title);
      setJsonContent(document.jsonContent);
      setTextContent(document.content || "");
      setDocumentTypeId(document.documentTypeId || "");
      setPriority(document.priority);
      setDifficultyLevel(document.difficultyLevel);
      setIsTemplate(document.isTemplate || false);
      setIsPublished(document.isPublished || false);
      const documentTags =
        document.tags?.map((tag) =>
          typeof tag === "string" ? tag : tag.tagName
        ) || [];
      console.log("🏷️ Document tags being set:", documentTags);
      setTags(documentTags);
    }
  }, [document]);

  const handleContentChange = (content: any) => {
    setJsonContent(content);
  };

  const handleTextContentChange = (text: string) => {
    setTextContent(text);
  };

  // Handle tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowPredictiveTags(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();

      if (!tags.includes(newTag)) {
        // Add to local state immediately for better UX
        setTags([...tags, newTag]);

        // Create the tag in the database asynchronously with color system
        try {
          // TODO: Implementar lógica de colores de tags
          // const recentColors =
          //   popularTags?.slice(0, 3).map((tag: any) => tag.color) || [];
          // const availableColors = TAG_COLORS.filter(
          //   (c) => !recentColors.includes(c)
          // );
          // const colorPool =
          //   availableColors.length > 0 ? availableColors : TAG_COLORS;
          // const randomColor =
          //   colorPool[Math.floor(Math.random() * colorPool.length)];
          // TODO: Implementar creación de tags
          // await createTagMutation.mutateAsync({
          //   tagName: newTag,
          //   color: randomColor,
          //   category: determineCategory(newTag),
          //   description: `Etiqueta creada automáticamente`,
          // });
        } catch (error) {
          console.error("Error creating tag:", error);
          // If creation fails, we could optionally remove from local state
          // but for now we'll keep it as the user intended to add it
        }
      }

      setTagInput("");
      setShowPredictiveTags(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddSuggestedTag = async (tagName: string) => {
    if (!tags.includes(tagName)) {
      // Add to local state immediately for better UX
      setTags([...tags, tagName]);

      // Ensure the tag exists in the database (this will just return existing tag if it exists)
      try {
        // TODO: Implementar creación de tags
        // await createTagMutation.mutateAsync({
        //   tagName,
        //   // For suggested tags, we don't need to specify color/category as they likely already exist
        // });
      } catch (error) {
        console.error("Error ensuring tag exists:", error);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const documentData = {
      title,
      content: textContent,
      jsonContent,
      documentTypeId: documentTypeId || undefined,
      priority,
      difficultyLevel,
      isTemplate,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: id!,
          data: documentData as UpdateKnowledgeDocumentDto,
        });
      } else {
        await createMutation.mutateAsync(
          documentData as CreateKnowledgeDocumentDto
        );
      }

      navigate("/knowledge");
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  if (isEditing && documentLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/knowledge")}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Volver a Base de Conocimiento</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/knowledge")}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="document-form"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form id="document-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Document Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información del Documento
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <Input
                label="Título del Documento *"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ingresa el título del documento"
                required
              />

              {/* Document Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Documento"
                  value={documentTypeId}
                  onChange={(e) => setDocumentTypeId(e.target.value)}
                >
                  <option value="">Seleccionar tipo...</option>
                  {documentTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Prioridad"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </div>

              {/* Difficulty Level */}
              <Select
                label="Nivel de Dificultad (1-5)"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level} - {"⭐".repeat(level)}
                  </option>
                ))}
              </Select>

              {/* Options */}
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Es una plantilla
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Publicar documento
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Etiquetas
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Agregar Etiquetas
                    </label>
                    {popularTags &&
                      popularTags.length > 0 &&
                      !showSuggestedTags && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowSuggestedTags(true);
                            setUserHidTags(false); // Reset the flag when user wants to see tags again
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1"
                        >
                          <TagIcon className="w-3 h-3" />
                          Ver {popularTags.length} etiquetas disponibles
                        </button>
                      )}
                  </div>
                  <div className="relative tag-input-container">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowPredictiveTags(e.target.value.length >= 2);
                      }}
                      onKeyDown={handleAddTag}
                      onFocus={() => setShowSuggestedTags(true)}
                      placeholder="Escribe una etiqueta y presiona Enter"
                    />

                    {/* Predictive Tags Dropdown */}
                    {showPredictiveTags &&
                      tagInput.length >= 2 &&
                      predictiveTags &&
                      predictiveTags.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {predictiveTags
                            .filter(
                              (tag: KnowledgeDocumentTag) =>
                                !tags.includes(tag.tagName)
                            )
                            .slice(0, 5)
                            .map((tag: KnowledgeDocumentTag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  handleAddSuggestedTag(tag.tagName);
                                  setTagInput("");
                                  setShowPredictiveTags(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                  {tag.tagName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                  ({tag.usageCount} usos)
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Suggested Tags */}
                {((showSuggestedTags &&
                  popularTags &&
                  popularTags.length > 0) ||
                  (popularTags &&
                    popularTags.length > 0 &&
                    tags.length === 0)) && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Etiquetas Disponibles
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuggestedTags(false);
                          setUserHidTags(true); // Remember user's choice
                        }}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Ocultar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const filteredTags = popularTags
                          ?.filter(
                            (tag: KnowledgeDocumentTag) =>
                              !tags.includes(tag.tagName)
                          )
                          .slice(0, 12);

                        console.log("🔍 Current document tags:", tags);
                        console.log(
                          "🔍 All popular tags:",
                          popularTags?.map((t: any) => t.tagName)
                        );
                        console.log(
                          "🔍 Filtered tags to show:",
                          filteredTags?.map((t: any) => t.tagName)
                        );

                        return filteredTags?.map(
                          (tag: KnowledgeDocumentTag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleAddSuggestedTag(tag.tagName)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:shadow-sm"
                              style={{
                                backgroundColor: tag.color + "20",
                                color: tag.color,
                                border: `1px solid ${tag.color}40`,
                              }}
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag.tagName}
                              <span className="ml-1 text-xs opacity-70">
                                ({tag.usageCount})
                              </span>
                            </button>
                          )
                        );
                      })()}
                    </div>
                    {!tagsLoading && popularTags.length > 12 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Mostrando las 12 etiquetas más populares de{" "}
                        {popularTags.length}
                      </p>
                    )}
                  </div>
                )}

                {/* Selected Tag List */}
                {tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Etiquetas Seleccionadas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        // Find the color for this tag from popularTags or use default
                        const tagInfo = popularTags?.find(
                          (t: KnowledgeDocumentTag) => t.tagName === tag
                        );
                        const color = tagInfo?.color || "#6B7280";

                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: color + "20",
                              color: color,
                              border: `1px solid ${color}40`,
                            }}
                          >
                            <TagIcon className="w-3 h-3" />
                            {tag}
                            {tagInfo?.category && (
                              <span className="text-xs opacity-70 ml-1">
                                ({tagInfo.category})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:opacity-80 transition-opacity"
                              style={{ color: color }}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Editor Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contenido del Documento
              </h3>
            </div>
            <div className="p-6">
              <div className="document-metadata mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <strong>Tipo:</strong>{" "}
                    {documentTypes?.find((t) => t.id === documentTypeId)
                      ?.name || "Sin especificar"}
                  </div>
                  <div>
                    <strong>Dificultad:</strong> {"⭐".repeat(difficultyLevel)}
                  </div>
                  <div>
                    <strong>Estado:</strong>{" "}
                    {isPublished ? "Publicado" : "Borrador"}
                  </div>
                  <div>
                    <strong>Plantilla:</strong> {isTemplate ? "Sí" : "No"}
                  </div>
                </div>
              </div>

              <div className="document-main-content">
                <BlockNoteEditor
                  content={jsonContent}
                  onChange={handleContentChange}
                  onContentChange={handleTextContentChange}
                  documentId={id} // Pasar el ID del documento para habilitar uploads
                />
              </div>

              {/* Sección de archivos adjuntos - solo mostrar si estamos editando */}
              {isEditing && id && (
                <div className="mt-8 space-y-6">
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <PaperClipIcon className="h-5 w-5 mr-2" />
                        Archivos adjuntos
                      </h3>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAttachments(!showAttachments)}
                      >
                        {showAttachments ? "Ocultar" : "Mostrar"} archivos
                      </Button>
                    </div>

                    {showAttachments && (
                      <div className="space-y-6">
                        {/* Componente para subir archivos */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-md font-medium text-gray-800 mb-4">
                            Subir nuevos archivos
                          </h4>
                          <FileUpload
                            documentId={id}
                            onUploadComplete={() => {
                              // Podrías agregar alguna lógica adicional aquí si es necesario
                              console.log("✅ Archivo subido completado");
                            }}
                            maxFiles={10}
                            maxFileSize={50 * 1024 * 1024} // 50MB
                          />
                        </div>

                        {/* Lista de archivos adjuntos existentes */}
                        <div>
                          <h4 className="text-md font-medium text-gray-800 mb-4">
                            Archivos existentes
                          </h4>
                          <AttachmentsList
                            documentId={id}
                            className="bg-white rounded-lg border p-4"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgeDocumentForm;
