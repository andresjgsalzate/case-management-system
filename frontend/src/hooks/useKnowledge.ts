import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  knowledgeApi,
  KnowledgeDocumentTagService,
  KnowledgeDocumentFavoriteService,
  KnowledgeDocumentReviewService,
} from "../services/knowledge.service";
import {
  KnowledgeDocument,
  KnowledgeDocumentListResponse,
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  UpdateDocumentTypeDto,
  UpdateDocumentFeedbackDto,
} from "../types/knowledge";

// Query Keys
export const knowledgeKeys = {
  all: ["knowledge"] as const,
  documents: () => [...knowledgeKeys.all, "documents"] as const,
  documentsInfinite: () =>
    [...knowledgeKeys.all, "documents", "infinite"] as const,
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
  options?: UseQueryOptions<KnowledgeDocumentListResponse>,
) => {
  return useQuery({
    queryKey: [...knowledgeKeys.documents(), query],
    queryFn: () => knowledgeApi.documents.findAll(query),
    ...options,
  });
};

// Infinite scroll hook for knowledge documents
export const useInfiniteKnowledgeDocuments = (
  query?: Omit<KnowledgeDocumentQueryDto, "page">,
) => {
  return useInfiniteQuery({
    queryKey: [...knowledgeKeys.documentsInfinite(), query],
    queryFn: ({ pageParam = 1 }) =>
      knowledgeApi.documents.findAll({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, otherwise undefined
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.page > 1) {
        return firstPage.page - 1;
      }
      return undefined;
    },
  });
};

export const useKnowledgeDocument = (
  id: string,
  options?: UseQueryOptions<KnowledgeDocument>,
) => {
  return useQuery({
    queryKey: knowledgeKeys.document(id),
    queryFn: () => knowledgeApi.documents.findOne(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 segundos - para documentos que se actualizan frecuentemente
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
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.documents.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
    },
    ...options,
  });
};

export const useUpdateKnowledgeDocument = (
  options?: UseMutationOptions<
    KnowledgeDocument,
    Error,
    { id: string; data: UpdateKnowledgeDocumentDto }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => knowledgeApi.documents.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar y refetch inmediatamente las queries relacionadas
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
        refetchType: "active", // Solo refetch queries activas
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(),
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documentVersions(variables.id),
        refetchType: "active",
      });

      // Refetch explícito del documento específico
      queryClient.refetchQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
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
        replacementDocumentId,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
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
    },
  });
};

export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTypeDto }) =>
      knowledgeApi.types.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.type(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.types() });
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
    },
  });
};

export const useCheckUserFeedback = (documentId: string) => {
  return useQuery({
    queryKey: ["feedback", "check", documentId],
    queryFn: async () => {
      try {
        return await knowledgeApi.feedback.checkUserFeedback(documentId);
      } catch (error: any) {
        // Si es 404, significa que no hay feedback, devolver estado por defecto
        if (error.response?.status === 404) {
          return { hasFeedback: false, feedback: null };
        }
        throw error;
      }
    },
    enabled: !!documentId,
    retry: (failureCount, error: any) => {
      // No reintentar si es 404
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
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
    },
  });
};

export const useDeleteDocumentFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeApi.feedback.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
};

// Tags Hooks
export const usePopularTags = (limit?: number) => {
  return useQuery({
    queryKey: ["knowledge", "tags", "popular", limit],
    queryFn: async () => {
      try {
        const result = await KnowledgeDocumentTagService.getPopularTags(limit);
        return result;
      } catch (error) {
        console.error("🚨 Popular tags query error:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - tiempo razonable para etiquetas
    retry: 2, // Intentos normales
  });
};

export const useAllTags = () => {
  return useQuery({
    queryKey: ["knowledge", "tags", "all"],
    queryFn: () => {
      return KnowledgeDocumentTagService.getAllTags();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh more often for better UX
  });
};

export const useKnowledgeTagDetails = (tagId: string | null) => {
  return useQuery({
    queryKey: ["knowledge", "tags", "details", tagId],
    queryFn: () => {
      if (!tagId) throw new Error("Tag ID is required");
      return KnowledgeDocumentTagService.getTagById(tagId);
    },
    enabled: !!tagId,
    staleTime: 30 * 1000, // 30 seconds for tag details
  });
};

export const useSearchTags = (searchQuery: string) => {
  return useQuery({
    queryKey: ["knowledge", "tags", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }
      // Get all tags and filter client-side for now
      const allTags = await KnowledgeDocumentTagService.getAllTags();
      return allTags.filter((tag) =>
        tag.tagName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
};

// Mutations for Knowledge Document Tags
export const useCreateTag = (options?: {
  onSuccess?: (tag: any) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      tagName: string;
      description?: string;
      color?: string;
      category?: string;
    }) =>
      KnowledgeDocumentTagService.createTag(params.tagName, {
        description: params.description,
        color: params.color,
        category: params.category,
      }),
    onSuccess: (data) => {
      // Invalidate all tag-related queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["knowledge", "tags"] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export const useDeleteKnowledgeTag = (options?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => KnowledgeDocumentTagService.deleteTag(tagId),
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ["knowledge", "tags"] });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

// =========================================
// KNOWLEDGE DOCUMENT FAVORITES HOOKS
// =========================================

export const favoriteKeys = {
  all: ["knowledge", "favorites"] as const,
  check: (documentId: string) =>
    [...favoriteKeys.all, "check", documentId] as const,
  myFavorites: () => [...favoriteKeys.all, "my"] as const,
  popular: () => [...favoriteKeys.all, "popular"] as const,
};

export const useCheckFavorite = (documentId: string) => {
  return useQuery({
    queryKey: favoriteKeys.check(documentId),
    queryFn: () => KnowledgeDocumentFavoriteService.checkFavorite(documentId),
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMyFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: [...favoriteKeys.myFavorites(), { page, limit }],
    queryFn: () => KnowledgeDocumentFavoriteService.getMyFavorites(page, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useMostFavoritedDocuments = (limit?: number) => {
  return useQuery({
    queryKey: [...favoriteKeys.popular(), { limit }],
    queryFn: () => KnowledgeDocumentFavoriteService.getMostFavorited(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useToggleFavorite = (options?: {
  onSuccess?: (data: { isFavorite: boolean; favoriteCount: number }) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      KnowledgeDocumentFavoriteService.toggleFavorite(documentId),
    onSuccess: (data, documentId) => {
      // Invalidate favorite-related queries
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.check(documentId),
      });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.myFavorites() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.popular() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

// =========================================
// KNOWLEDGE DOCUMENT REVIEW WORKFLOW HOOKS
// =========================================

export const reviewKeys = {
  all: ["knowledge", "review"] as const,
  pending: () => [...reviewKeys.all, "pending"] as const,
};

export const usePendingReviewDocuments = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: [...reviewKeys.pending(), { page, limit }],
    queryFn: () =>
      KnowledgeDocumentReviewService.getPendingReviewDocuments(page, limit),
    staleTime: 30 * 1000, // 30 seconds - refresh frequently for review queue
  });
};

export const useSubmitForReview = (options?: {
  onSuccess?: (document: KnowledgeDocument) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      KnowledgeDocumentReviewService.submitForReview(documentId),
    onSuccess: (data) => {
      // Invalidate document-related queries
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(data.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export const useApproveDocument = (options?: {
  onSuccess?: (document: KnowledgeDocument) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      documentId: string;
      notes?: string;
      autoPublish?: boolean;
    }) =>
      KnowledgeDocumentReviewService.approveDocument(
        params.documentId,
        params.notes,
        params.autoPublish,
      ),
    onSuccess: (data) => {
      // Invalidate document-related queries
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(data.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export const useRejectDocument = (options?: {
  onSuccess?: (document: KnowledgeDocument) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { documentId: string; notes: string }) =>
      KnowledgeDocumentReviewService.rejectDocument(
        params.documentId,
        params.notes,
      ),
    onSuccess: (data) => {
      // Invalidate document-related queries
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(data.id),
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.documents() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
