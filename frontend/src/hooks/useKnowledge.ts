import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { knowledgeApi } from "../services/knowledge.service";
import {
  KnowledgeDocument,
  KnowledgeDocumentListResponse,
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  CreateDocumentFeedbackDto,
  UpdateDocumentFeedbackDto,
} from "../types/knowledge";

// Query Keys
export const knowledgeKeys = {
  all: ["knowledge"] as const,
  documents: () => [...knowledgeKeys.all, "documents"] as const,
  document: (id: string) => [...knowledgeKeys.documents(), id] as const,
  documentVersions: (id: string) =>
    [...knowledgeKeys.document(id), "versions"] as const,
  documentStats: (id: string) =>
    [...knowledgeKeys.document(id), "stats"] as const,
  documentFeedback: (id: string) =>
    [...knowledgeKeys.document(id), "feedback"] as const,
  types: () => [...knowledgeKeys.all, "types"] as const,
  type: (id: string) => [...knowledgeKeys.types(), id] as const,
  typeStats: (id: string) => [...knowledgeKeys.type(id), "stats"] as const,
  search: (query: string) => [...knowledgeKeys.all, "search", query] as const,
  myFeedback: () => [...knowledgeKeys.all, "feedback", "my"] as const,
};

// Knowledge Documents Hooks
export const useKnowledgeDocuments = (
  query?: KnowledgeDocumentQueryDto,
  options?: UseQueryOptions<KnowledgeDocumentListResponse>
) => {
  return useQuery({
    queryKey: [...knowledgeKeys.documents(), query],
    queryFn: () => knowledgeApi.documents.findAll(query),
    ...options,
  });
};

export const useKnowledgeDocument = (
  id: string,
  options?: UseQueryOptions<KnowledgeDocument>
) => {
  return useQuery({
    queryKey: knowledgeKeys.document(id),
    queryFn: () => knowledgeApi.documents.findOne(id),
    enabled: !!id,
    ...options,
  });
};

export const useKnowledgeDocumentVersions = (id: string) => {
  return useQuery({
    queryKey: knowledgeKeys.documentVersions(id),
    queryFn: () => knowledgeApi.documents.getVersions(id),
    enabled: !!id,
  });
};

export const useKnowledgeDocumentStats = (id: string) => {
  return useQuery({
    queryKey: knowledgeKeys.documentStats(id),
    queryFn: () => knowledgeApi.documents.getStats(id),
    enabled: !!id,
  });
};

export const useKnowledgeDocumentFeedback = (id: string) => {
  return useQuery({
    queryKey: knowledgeKeys.documentFeedback(id),
    queryFn: () => knowledgeApi.documents.getFeedback(id),
    enabled: !!id,
  });
};

export const useSearchKnowledgeDocuments = (query: string, limit?: number) => {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: () => knowledgeApi.documents.search(query, limit),
    enabled: query.length > 2, // Only search with more than 2 characters
    staleTime: 30000, // Cache for 30 seconds
  });
};

// Knowledge Document Mutations
export const useCreateKnowledgeDocument = (
  options?: UseMutationOptions<
    KnowledgeDocument,
    Error,
    CreateKnowledgeDocumentDto
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.documents.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      toast.success("Documento creado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al crear documento: ${error.message}`);
    },
    ...options,
  });
};

export const useUpdateKnowledgeDocument = (
  options?: UseMutationOptions<
    KnowledgeDocument,
    Error,
    { id: string; data: UpdateKnowledgeDocumentDto }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => knowledgeApi.documents.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentVersions(variables.id),
      });
      toast.success("Documento actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al actualizar documento: ${error.message}`);
    },
    ...options,
  });
};

export const usePublishKnowledgeDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isPublished,
      changeSummary,
    }: {
      id: string;
      isPublished: boolean;
      changeSummary?: string;
    }) => knowledgeApi.documents.publish(id, isPublished, changeSummary),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      toast.success(
        variables.isPublished ? "Documento publicado" : "Documento despublicado"
      );
    },
    onError: (error) => {
      toast.error(`Error al publicar/despublicar documento: ${error.message}`);
    },
  });
};

export const useArchiveKnowledgeDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isArchived,
      reason,
      replacementDocumentId,
    }: {
      id: string;
      isArchived: boolean;
      reason?: string;
      replacementDocumentId?: string;
    }) =>
      knowledgeApi.documents.archive(
        id,
        isArchived,
        reason,
        replacementDocumentId
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      toast.success(
        variables.isArchived ? "Documento archivado" : "Documento desarchivado"
      );
    },
    onError: (error) => {
      toast.error(`Error al archivar documento: ${error.message}`);
    },
  });
};

export const useDeleteKnowledgeDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.documents.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      queryClient.removeQueries({ queryKey: knowledgeKeys.document(id) });
      toast.success("Documento eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar documento: ${error.message}`);
    },
  });
};

// Document Types Hooks
export const useDocumentTypes = (activeOnly?: boolean) => {
  return useQuery({
    queryKey: [...knowledgeKeys.types(), activeOnly],
    queryFn: () => knowledgeApi.types.findAll(activeOnly),
  });
};

export const useDocumentType = (id: string) => {
  return useQuery({
    queryKey: knowledgeKeys.type(id),
    queryFn: () => knowledgeApi.types.findOne(id),
    enabled: !!id,
  });
};

export const useDocumentTypeStats = (id: string) => {
  return useQuery({
    queryKey: knowledgeKeys.typeStats(id),
    queryFn: () => knowledgeApi.types.getStats(id),
    enabled: !!id,
  });
};

// Document Types Mutations
export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.types.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.types() });
      toast.success("Tipo de documento creado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al crear tipo de documento: ${error.message}`);
    },
  });
};

export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTypeDto }) =>
      knowledgeApi.types.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.type(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.types() });
      toast.success("Tipo de documento actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al actualizar tipo de documento: ${error.message}`);
    },
  });
};

export const useToggleDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.types.toggleActive,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.type(data.id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.types() });
      toast.success(
        `Tipo de documento ${data.isActive ? "activado" : "desactivado"}`
      );
    },
    onError: (error) => {
      toast.error(`Error al cambiar estado del tipo: ${error.message}`);
    },
  });
};

export const useDeleteDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.types.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.types() });
      queryClient.removeQueries({ queryKey: knowledgeKeys.type(id) });
      toast.success("Tipo de documento eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar tipo de documento: ${error.message}`);
    },
  });
};

// Feedback Hooks
export const useMyFeedback = () => {
  return useQuery({
    queryKey: knowledgeKeys.myFeedback(),
    queryFn: knowledgeApi.feedback.getMyFeedback,
  });
};

// Feedback Mutations
export const useCreateDocumentFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.feedback.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentFeedback(data.documentId),
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentStats(data.documentId),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.myFeedback() });
      toast.success("Feedback enviado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al enviar feedback: ${error.message}`);
    },
  });
};

export const useUpdateDocumentFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDocumentFeedbackDto;
    }) => knowledgeApi.feedback.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentFeedback(data.documentId),
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentStats(data.documentId),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.myFeedback() });
      toast.success("Feedback actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al actualizar feedback: ${error.message}`);
    },
  });
};

export const useDeleteDocumentFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.feedback.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Feedback eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar feedback: ${error.message}`);
    },
  });
};
