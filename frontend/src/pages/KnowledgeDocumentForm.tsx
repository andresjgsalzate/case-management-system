import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import {
  useCreateKnowledgeDocument,
  useUpdateKnowledgeDocument,
  useKnowledgeDocument,
  useDocumentTypes,
  useAllTags,
  useSearchTags,
} from "../hooks/useKnowledge";
import { useCases } from "../hooks/useCases";
import { Case } from "../services/api";
// import { getCaseStatuses } from "../services/api/caseControlApi";
// import { CaseStatus } from "../types/caseControl";
// import { useQuery } from "@tanstack/react-query";
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
  const [showAllPopular, setShowAllPopular] = useState(false); // Para mostrar/ocultar etiquetas populares
  const [associatedCases, setAssociatedCases] = useState<string[]>([]); // IDs de casos asociados
  const [caseSearchInput, setCaseSearchInput] = useState(""); // Input para buscar casos
  const [showCaseSearch, setShowCaseSearch] = useState(false); // Mostrar/ocultar búsqueda de casos

  // Notificaciones
  const { success, error: showError } = useToast();

  // Estado para controlar cuándo navegar después de guardar
  const [shouldNavigateAfterSave, setShouldNavigateAfterSave] = useState(false);

  // ✅ AUTOGUARDADO: Estados y configuración
  const AUTOSAVE_INTERVAL = 1 * 60 * 1000; // 1 minuto en milisegundos
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(""); // Para comparar si hay cambios reales

  // ✅ BACKUP LOCAL: Para proteger contra pérdida de datos por sesión expirada
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setHasLocalBackup] = useState(false);
  const LOCAL_BACKUP_KEY = `knowledge_backup_${id || "new"}`;

  // Función para guardar backup local
  const saveLocalBackup = useCallback(
    (data: any) => {
      try {
        const backupData = {
          ...data,
          backupTimestamp: new Date().toISOString(),
          documentId: id,
        };
        localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backupData));
        setHasLocalBackup(true);
        console.log(
          "💾 Backup local guardado:",
          new Date().toLocaleTimeString()
        );
      } catch (e) {
        console.error("Error guardando backup local:", e);
      }
    },
    [id, LOCAL_BACKUP_KEY]
  );

  // Función para limpiar backup local
  const clearLocalBackup = useCallback(() => {
    localStorage.removeItem(LOCAL_BACKUP_KEY);
    setHasLocalBackup(false);
  }, [LOCAL_BACKUP_KEY]);

  // Mutations
  const createMutation = useCreateKnowledgeDocument({
    onSuccess: () => {
      success("Documento creado exitosamente");
      clearLocalBackup(); // ✅ BACKUP LOCAL: Limpiar backup al guardar exitosamente
      if (shouldNavigateAfterSave) {
        navigate("/knowledge");
      }
      setShouldNavigateAfterSave(false);
    },
    onError: (error: any) => {
      showError(`Error al crear documento: ${error.message}`);
      setShouldNavigateAfterSave(false);
    },
  });
  const updateMutation = useUpdateKnowledgeDocument({
    onSuccess: () => {
      success("Documento actualizado exitosamente");
      clearLocalBackup(); // ✅ BACKUP LOCAL: Limpiar backup al guardar exitosamente
      // ✅ AUTOGUARDADO: Marcar como guardado tras guardado manual exitoso
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      if (shouldNavigateAfterSave) {
        navigate("/knowledge");
      }
      setShouldNavigateAfterSave(false);
    },
    onError: (error: any) => {
      showError(`Error al actualizar documento: ${error.message}`);
      setShouldNavigateAfterSave(false);
    },
  });

  // ✅ AUTOGUARDADO: Mutación silenciosa (sin notificaciones intrusivas)
  const autoSaveMutation = useUpdateKnowledgeDocument({
    onSuccess: () => {
      setLastAutoSave(new Date());
      setIsAutoSaving(false);
      setHasUnsavedChanges(false);
      clearLocalBackup(); // ✅ BACKUP LOCAL: Limpiar backup al autoguardar exitosamente
      // Actualizar el contenido guardado para futuras comparaciones
      lastSavedContentRef.current = JSON.stringify({
        title,
        jsonContent,
        textContent,
        documentTypeId,
        priority,
        difficultyLevel,
        isTemplate,
        isPublished,
        tags,
        associatedCases,
      });
    },
    onError: (error: any) => {
      console.error("❌ Error en autoguardado:", error);
      setIsAutoSaving(false);
      // ✅ BACKUP LOCAL: Guardar backup local si falla el autoguardado por 401
      if (error?.response?.status === 401 || error?.message?.includes("401")) {
        const documentData = {
          title,
          content: textContent,
          jsonContent,
          documentTypeId: documentTypeId || undefined,
          priority,
          difficultyLevel,
          isTemplate,
          isPublished,
          tags: tags.length > 0 ? tags : undefined,
          associatedCases,
        };
        saveLocalBackup(documentData);
      }
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
  const { data: predictiveTags } = useSearchTags(tagInput);

  // Query para obtener casos (incluyendo archivados)
  const { data: casesData } = useCases();

  // ✅ BACKUP LOCAL: Verificar si hay backup al montar el componente
  useEffect(() => {
    const backupStr = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr);
        if (backup && backup.documentId === id) {
          setHasLocalBackup(true);
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    }
  }, [id, LOCAL_BACKUP_KEY]);

  // Query para obtener estados dinámicos de casos (no necesaria con la nueva lógica simplificada)
  // const { data: caseStatuses = [] } = useQuery<CaseStatus[]>({
  //   queryKey: ["caseStatuses"],
  //   queryFn: getCaseStatuses,
  // });

  // Función para obtener el estado display de un caso
  const getCaseStatusDisplay = (caso: Case) => {
    // Verificar si el caso está archivado
    // Asumimos que un caso archivado tiene estado "cerrado", "cancelado" o algun campo isArchived
    const isArchived =
      caso.estado === "cerrado" ||
      caso.estado === "cancelado" ||
      caso.isArchived === true;

    if (isArchived) {
      return {
        name: "Archivado",
        color: "#6b7280", // gris
      };
    } else {
      return {
        name: "En Progreso",
        color: "#10b981", // verde
      };
    }
  };

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

  // Only log important errors
  React.useEffect(() => {
    if (tagsError) {
      console.error("🚨 Tags error details:", {
        message: tagsError.message,
        error: tagsError,
      });
    }
  }, [tagsError]);

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
    if (document && isEditing) {
      // ✅ BACKUP LOCAL: Verificar si hay un backup local más reciente (solo una vez)
      const backupKey = `knowledge_backup_${id || "new"}`;
      const backupStr = localStorage.getItem(backupKey);

      if (backupStr) {
        try {
          const localBackup = JSON.parse(backupStr);
          if (localBackup && localBackup.documentId === id) {
            const backupTime = new Date(localBackup.backupTimestamp);
            const useBackup = window.confirm(
              `Se encontró un backup local guardado el ${backupTime.toLocaleString()}.\n\n` +
                `Esto puede contener cambios que no se guardaron debido a una sesión expirada.\n\n` +
                `¿Deseas restaurar el backup local? (Cancelar para usar la versión del servidor)`
            );

            if (useBackup) {
              setTitle(localBackup.title || document.title);
              setJsonContent(localBackup.jsonContent || document.jsonContent);
              setTextContent(
                localBackup.content ||
                  localBackup.textContent ||
                  document.content ||
                  ""
              );
              setDocumentTypeId(
                localBackup.documentTypeId || document.documentTypeId || ""
              );
              setPriority(localBackup.priority || document.priority);
              setDifficultyLevel(
                localBackup.difficultyLevel || document.difficultyLevel
              );
              setIsTemplate(
                localBackup.isTemplate ?? document.isTemplate ?? false
              );
              setIsPublished(
                localBackup.isPublished ?? document.isPublished ?? false
              );
              const backupTags = localBackup.tags || [];
              setTags(backupTags);
              setAssociatedCases(localBackup.associatedCases || []);
              setHasUnsavedChanges(true); // Marcar que hay cambios pendientes

              // Inicializar ref con el contenido del backup
              lastSavedContentRef.current = JSON.stringify({
                title: localBackup.title || document.title,
                jsonContent: localBackup.jsonContent || document.jsonContent,
                textContent:
                  localBackup.content ||
                  localBackup.textContent ||
                  document.content ||
                  "",
                documentTypeId:
                  localBackup.documentTypeId || document.documentTypeId || "",
                priority: localBackup.priority || document.priority,
                difficultyLevel:
                  localBackup.difficultyLevel || document.difficultyLevel,
                isTemplate:
                  localBackup.isTemplate ?? document.isTemplate ?? false,
                isPublished:
                  localBackup.isPublished ?? document.isPublished ?? false,
                tags: backupTags,
                associatedCases: localBackup.associatedCases || [],
              });
              return; // No cargar datos del servidor
            } else {
              // Usuario eligió no restaurar, limpiar backup
              localStorage.removeItem(backupKey);
              setHasLocalBackup(false);
            }
          }
        } catch (e) {
          console.error("Error procesando backup local:", e);
        }
      }

      // Cargar datos normales del servidor
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
      setTags(documentTags);

      // Cargar casos asociados
      if (document.associatedCases && document.associatedCases.length > 0) {
        setAssociatedCases(document.associatedCases);
      } else {
        setAssociatedCases([]); // Limpiar casos si no hay ninguno
      }

      // ✅ AUTOGUARDADO: Inicializar el contenido guardado al cargar el documento
      lastSavedContentRef.current = JSON.stringify({
        title: document.title,
        jsonContent: document.jsonContent,
        textContent: document.content || "",
        documentTypeId: document.documentTypeId || "",
        priority: document.priority,
        difficultyLevel: document.difficultyLevel,
        isTemplate: document.isTemplate || false,
        isPublished: document.isPublished || false,
        tags: documentTags,
        associatedCases: document.associatedCases || [],
      });
    }
  }, [document, isEditing, id]); // Solo dependencias estables

  // ✅ AUTOGUARDADO: Función para ejecutar el autoguardado
  const performAutoSave = useCallback(async () => {
    // Solo autoguardar si estamos editando un documento existente
    if (!isEditing || !id) return;

    // No autoguardar si ya hay una operación de guardado en progreso
    if (isAutoSaving || updateMutation.isPending || autoSaveMutation.isPending)
      return;

    // No autoguardar si el título está vacío (documento inválido)
    if (!title.trim()) return;

    // Verificar si hay cambios reales comparando con el último contenido guardado
    const currentContent = JSON.stringify({
      title,
      jsonContent,
      textContent,
      documentTypeId,
      priority,
      difficultyLevel,
      isTemplate,
      isPublished,
      tags,
      associatedCases,
    });

    if (currentContent === lastSavedContentRef.current) {
      // No hay cambios, no es necesario guardar
      return;
    }

    setIsAutoSaving(true);

    const documentData = {
      title,
      content: textContent,
      jsonContent,
      documentTypeId: documentTypeId || undefined,
      priority,
      difficultyLevel,
      isTemplate,
      isPublished,
      tags: tags.length > 0 ? tags : undefined,
      associatedCases,
    };

    try {
      await autoSaveMutation.mutateAsync({
        id: id!,
        data: documentData as UpdateKnowledgeDocumentDto,
      });
    } catch (error) {
      console.error("❌ Error en autoguardado:", error);
      setIsAutoSaving(false);
    }
  }, [
    isEditing,
    id,
    isAutoSaving,
    updateMutation.isPending,
    autoSaveMutation,
    title,
    jsonContent,
    textContent,
    documentTypeId,
    priority,
    difficultyLevel,
    isTemplate,
    isPublished,
    tags,
    associatedCases,
  ]);

  // ✅ AUTOGUARDADO: Configurar el intervalo de autoguardado
  useEffect(() => {
    // Solo activar autoguardado en modo edición
    if (!isEditing || !id) return;

    // Limpiar timer anterior si existe
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Configurar nuevo timer
    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave();
    }, AUTOSAVE_INTERVAL);

    // Cleanup al desmontar o cuando cambian las dependencias
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isEditing, id, performAutoSave, AUTOSAVE_INTERVAL]);

  // ✅ AUTOGUARDADO: Detectar cambios no guardados (usando useMemo para evitar re-renders infinitos)
  const currentContentString = React.useMemo(() => {
    return JSON.stringify({
      title,
      jsonContent,
      textContent,
      documentTypeId,
      priority,
      difficultyLevel,
      isTemplate,
      isPublished,
      tags,
      associatedCases,
    });
  }, [
    title,
    jsonContent,
    textContent,
    documentTypeId,
    priority,
    difficultyLevel,
    isTemplate,
    isPublished,
    tags,
    associatedCases,
  ]);

  // Efecto separado para actualizar hasUnsavedChanges solo cuando cambia el string serializado
  useEffect(() => {
    if (!isEditing) return;
    const hasChanges = currentContentString !== lastSavedContentRef.current;
    // Solo actualizar si el valor realmente cambió para evitar re-renders innecesarios
    setHasUnsavedChanges((prev) => (prev !== hasChanges ? hasChanges : prev));
  }, [isEditing, currentContentString]);

  // ✅ AUTOGUARDADO: Advertencia al salir con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isEditing) {
        e.preventDefault();
        e.returnValue =
          "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isEditing]);

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

  // Handle cases
  const handleAddCase = (caseId: string) => {
    if (!associatedCases.includes(caseId)) {
      setAssociatedCases([...associatedCases, caseId]);
    }
    setCaseSearchInput("");
    setShowCaseSearch(false);
  };

  const handleRemoveCase = (caseId: string) => {
    setAssociatedCases(associatedCases.filter((id) => id !== caseId));
  };

  const getSelectedCases = () => {
    if (!casesData) return [];
    return casesData.filter((caso: Case) => associatedCases.includes(caso.id));
  };

  const getAvailableCases = () => {
    if (!casesData) return [];

    return casesData.filter(
      (caso: Case) =>
        !associatedCases.includes(caso.id) &&
        (caseSearchInput === "" ||
          caso.numeroCaso
            .toLowerCase()
            .includes(caseSearchInput.toLowerCase()) ||
          caso.descripcion
            ?.toLowerCase()
            .includes(caseSearchInput.toLowerCase()))
    );
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
      isPublished, // 🔧 AÑADIR el campo isPublished
      tags: tags.length > 0 ? tags : undefined,
      associatedCases: associatedCases, // Enviar array (vacío o con datos)
    };

    try {
      // Indicar que queremos navegar después de guardar exitosamente
      setShouldNavigateAfterSave(true);

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: id!,
          data: documentData as UpdateKnowledgeDocumentDto,
        });
        // ✅ AUTOGUARDADO: Actualizar referencia del contenido guardado
        lastSavedContentRef.current = JSON.stringify({
          title,
          jsonContent,
          textContent,
          documentTypeId,
          priority,
          difficultyLevel,
          isTemplate,
          isPublished,
          tags,
          associatedCases,
        });
      } else {
        await createMutation.mutateAsync(
          documentData as CreateKnowledgeDocumentDto
        );
      }

      // La navegación ahora se maneja en los callbacks onSuccess de las mutaciones
    } catch (error: any) {
      console.error("Error saving document:", error);
      setShouldNavigateAfterSave(false);

      // ✅ BACKUP LOCAL: Si falla por 401 (sesión expirada), guardar backup local
      if (error?.response?.status === 401 || error?.message?.includes("401")) {
        saveLocalBackup(documentData);
        showError(
          "Tu sesión ha expirado. El documento se ha guardado localmente. " +
            "Por favor, inicia sesión de nuevo y tus cambios se restaurarán automáticamente."
        );
      }
    }
  };

  // ✅ GUARDAR SIN NAVEGAR: Función para guardar y continuar editando
  const handleSaveAndContinue = async () => {
    if (!isEditing || !id) return;
    if (updateMutation.isPending) return;
    if (!title.trim()) {
      showError("El título es requerido");
      return;
    }

    const documentData = {
      title,
      content: textContent,
      jsonContent,
      documentTypeId: documentTypeId || undefined,
      priority,
      difficultyLevel,
      isTemplate,
      isPublished,
      tags: tags.length > 0 ? tags : undefined,
      associatedCases: associatedCases,
    };

    try {
      await updateMutation.mutateAsync({
        id: id!,
        data: documentData as UpdateKnowledgeDocumentDto,
      });
      // Actualizar referencia del contenido guardado
      lastSavedContentRef.current = JSON.stringify({
        title,
        jsonContent,
        textContent,
        documentTypeId,
        priority,
        difficultyLevel,
        isTemplate,
        isPublished,
        tags,
        associatedCases,
      });
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      // No navegar - el usuario continúa editando
    } catch (error: any) {
      console.error("Error saving document:", error);
      if (error?.response?.status === 401 || error?.message?.includes("401")) {
        saveLocalBackup(documentData);
        showError(
          "Tu sesión ha expirado. El documento se ha guardado localmente. " +
            "Por favor, inicia sesión de nuevo y tus cambios se restaurarán automáticamente."
        );
      }
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
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/knowledge")}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ActionIcon action="back" size="sm" className="mr-2" />
                Volver
              </button>
            </div>

            {/* ✅ AUTOGUARDADO: Indicador de estado */}
            <div className="flex items-center space-x-4">
              {isEditing && (
                <div className="flex items-center space-x-2 text-sm">
                  {isAutoSaving ? (
                    <span className="flex items-center text-blue-600 dark:text-blue-400">
                      <svg
                        className="animate-spin h-4 w-4 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : lastAutoSave ? (
                    <span
                      className="flex items-center text-green-600 dark:text-green-400"
                      title={`Último autoguardado: ${lastAutoSave.toLocaleTimeString()}`}
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Guardado{" "}
                      {lastAutoSave.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span
                      className="flex items-center text-yellow-600 dark:text-yellow-400"
                      title="Hay cambios sin guardar. Se guardarán automáticamente."
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth={2}
                          fill="none"
                        />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                      </svg>
                      Cambios pendientes
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/knowledge")}
                >
                  Cancelar
                </Button>
                {/* Botón Guardar: solo en modo edición, guarda sin navegar */}
                {isEditing && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleSaveAndContinue}
                    disabled={updateMutation.isPending}
                    className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/40"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <ActionIcon action="save" size="sm" className="mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  form="document-form"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : isEditing
                    ? "Guardar y salir"
                    : "Crear"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
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
                <ActionIcon
                  action="tag"
                  size="lg"
                  color="blue"
                  className="mr-2"
                />
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
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                          onClick={() => setShowAllPopular(!showAllPopular)}
                        >
                          <ActionIcon action="tag" size="xs" />
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
                              <ActionIcon action="tag" size="xs" />
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
                            <ActionIcon action="tag" size="xs" />
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
                              <ActionIcon action="close" size="xs" />
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

          {/* Associated Cases Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <ActionIcon action="case" size="lg" className="mr-2" />
                Casos Asociados
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Asocia este documento con casos específicos para mejor
                organización
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Case Search Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buscar y agregar casos
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar casos por título o descripción..."
                    value={caseSearchInput}
                    onChange={(e) => {
                      setCaseSearchInput(e.target.value);
                      setShowCaseSearch(e.target.value.length > 0);
                    }}
                    onFocus={() =>
                      setShowCaseSearch(caseSearchInput.length > 0)
                    }
                    className="w-full"
                  />
                  {/* Search Results */}
                  {showCaseSearch && caseSearchInput && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getAvailableCases().length > 0 ? (
                        getAvailableCases()
                          .slice(0, 10)
                          .map((caso: Case) => (
                            <button
                              key={caso.id}
                              type="button"
                              onClick={() => handleAddCase(caso.id)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {caso.numeroCaso}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {caso.descripcion}
                                  </p>
                                </div>
                                <div className="ml-2 flex flex-col items-end">
                                  {(() => {
                                    const statusDisplay =
                                      getCaseStatusDisplay(caso);
                                    return (
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                        style={{
                                          backgroundColor: statusDisplay.color,
                                        }}
                                      >
                                        {statusDisplay.name}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron casos que coincidan con la búsqueda
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Cases */}
              {getSelectedCases().length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Casos Seleccionados ({getSelectedCases().length})
                  </label>
                  <div className="space-y-2">
                    {getSelectedCases().map((caso: Case) => (
                      <div
                        key={caso.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {caso.numeroCaso}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {caso.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {(() => {
                              const statusDisplay = getCaseStatusDisplay(caso);
                              return (
                                <span
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{
                                    backgroundColor: statusDisplay.color,
                                  }}
                                >
                                  {statusDisplay.name}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCase(caso.id)}
                          className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Quitar caso"
                        >
                          <ActionIcon action="close" size="sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {getSelectedCases().length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <ActionIcon
                    action="case"
                    size="lg"
                    className="mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm">No hay casos asociados</p>
                  <p className="text-xs mt-1">
                    Busca y selecciona casos para asociar con este documento
                  </p>
                </div>
              )}
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

              <div className="document-main-content w-full max-w-none">
                <BlockNoteEditor
                  content={jsonContent}
                  onChange={handleContentChange}
                  onContentChange={handleTextContentChange}
                  documentId={id} // Pasar el ID del documento para habilitar uploads
                  className="w-full max-w-none"
                />
              </div>

              {/* Sección de archivos adjuntos - solo mostrar si estamos editando */}
              {isEditing && id && (
                <div className="mt-8 space-y-6">
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <ActionIcon
                          action="attachment"
                          size="lg"
                          className="mr-2"
                        />
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
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
                            Subir nuevos archivos
                          </h4>
                          <FileUpload
                            documentId={id}
                            onUploadComplete={() => {
                              // Refresh attachments list after upload
                            }}
                            maxFiles={10}
                            maxFileSize={50 * 1024 * 1024} // 50MB
                          />
                        </div>

                        {/* Lista de archivos adjuntos existentes */}
                        <div>
                          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
                            Archivos existentes
                          </h4>
                          <AttachmentsList
                            documentId={id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
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
