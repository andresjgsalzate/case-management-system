import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, TagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  useCreateKnowledgeDocument,
  useUpdateKnowledgeDocument,
  useKnowledgeDocument,
  useDocumentTypes,
} from "../hooks/useKnowledge";
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  Priority,
} from "../types/knowledge";
import BlockNoteEditor from "../components/knowledge/BlockNoteEditor";

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

  // Mutations
  const createMutation = useCreateKnowledgeDocument();
  const updateMutation = useUpdateKnowledgeDocument();

  // Queries
  const { data: document, isLoading: documentLoading } = useKnowledgeDocument(
    id || ""
  );
  const { data: documentTypes } = useDocumentTypes();

  // Load document data if editing
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setJsonContent(document.jsonContent);
      setTextContent(document.content || "");
      setDocumentTypeId(document.documentTypeId || "");
      setPriority(document.priority);
      setDifficultyLevel(document.difficultyLevel);
      setIsTemplate(document.isTemplate || false);
      setIsPublished(document.isPublished || false);
      setTags(
        document.tags?.map((tag) =>
          typeof tag === "string" ? tag : tag.tagName
        ) || []
      );
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
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
              <button
                onClick={() => navigate("/knowledge")}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="document-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar"
                  : "Crear"}
              </button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Documento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ingresa el título del documento"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Document Type and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {documentTypes?.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de Dificultad (1-5)
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      {level} - {"⭐".repeat(level)}
                    </option>
                  ))}
                </select>
              </div>

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agregar Etiquetas
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Escribe una etiqueta y presiona Enter"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tag List */}
                {tags.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
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
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgeDocumentForm;
