import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  TagIcon,
  FolderIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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

  // Load document data for editing
  useEffect(() => {
    if (document && isEditing) {
      setTitle(document.title);
      setJsonContent(document.jsonContent);
      setTextContent(document.content || "");
      setDocumentTypeId(document.documentTypeId || "");
      setPriority(document.priority);
      setDifficultyLevel(document.difficultyLevel);
      setIsTemplate(document.isTemplate);
      setIsPublished(document.isPublished);
      setTags(document.tags?.map((tag) => tag.tagName) || []);
    }
  }, [document, isEditing]);

  // Handle content change from BlockNote editor
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

  // Handle publish/unpublish
  const handlePublishToggle = async () => {
    if (!isEditing) {
      setIsPublished(!isPublished);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: id!,
        data: { isPublished: !isPublished },
      });
      setIsPublished(!isPublished);
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const hasUnsavedChanges = title.trim() !== "" || jsonContent !== null;

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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/knowledge")}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? "Editar Documento" : "Nuevo Documento"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {isEditing
                      ? "Modifica la información del documento"
                      : "Crea un nuevo documento de conocimiento"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={handlePublishToggle}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isPublished
                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                  }`}
                >
                  {isPublished ? "Publicado" : "Borrador"}
                </button>
              )}

              <button
                onClick={() => navigate("/knowledge")}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="document-form"
                disabled={isLoading || !title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <form id="document-form" onSubmit={handleSubmit} className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Sidebar - Basic Information */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
              <div className="p-6 h-full overflow-y-auto">
                {/* Basic Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <FolderIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Información Básica
                  </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Título *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="Ingresa el título del documento"
                    required
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label
                    htmlFor="documentType"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    <FolderIcon className="h-4 w-4 inline mr-1" />
                    Tipo de Documento
                  </label>
                  <select
                    id="documentType"
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {documentTypes?.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Prioridad
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Nivel de Dificultad (1-5)
                  </label>
                  <input
                    type="number"
                    id="difficulty"
                    min="1"
                    max="5"
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  />
                </div>

                {/* Template Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label
                    htmlFor="isTemplate"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Usar como plantilla
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <TagIcon className="h-4 w-4 inline mr-1" />
                    Etiquetas
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      placeholder="Presiona Enter para agregar etiquetas"
                    />
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 min-h-screen">
              <div className="p-6 h-full">
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Contenido del Documento
                  </h2>
                </div>

                <div className="h-full">
                  <BlockNoteEditor
                    content={jsonContent}
                    onChange={handleContentChange}
                    onContentChange={handleTextContentChange}
                    placeholder="Comienza a escribir el contenido de tu documento..."
                    className="min-h-[calc(100vh-250px)] w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400 dark:text-yellow-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                Tienes cambios sin guardar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeDocumentForm;
