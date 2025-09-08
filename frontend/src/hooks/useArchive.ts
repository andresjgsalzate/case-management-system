import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveApi } from "../services/archiveApi";
import {
  ArchiveFilters,
  CreateArchivedCaseData,
  CreateArchivedTodoData,
  RestoreArchivedItemData,
  DeleteArchivedItemData,
} from "../types/archive.types";

// =============================================
// KEYS PARA REACT QUERY
// =============================================

export const archiveKeys = {
  all: ["archive"] as const,
  stats: () => [...archiveKeys.all, "stats"] as const,
  cases: (filters?: ArchiveFilters) =>
    [...archiveKeys.all, "cases", filters] as const,
  case: (id: string) => [...archiveKeys.all, "cases", id] as const,
  todos: (filters?: ArchiveFilters) =>
    [...archiveKeys.all, "todos", filters] as const,
  todo: (id: string) => [...archiveKeys.all, "todos", id] as const,
  items: (filters?: ArchiveFilters) =>
    [...archiveKeys.all, "items", filters] as const,
  search: (term: string, type?: string) =>
    [...archiveKeys.all, "search", term, type] as const,
};

// =============================================
// HOOKS PARA ESTADÍSTICAS
// =============================================

/**
 * Hook para obtener estadísticas del archivo
 */
export const useArchiveStats = () => {
  return useQuery({
    queryKey: archiveKeys.stats(),
    queryFn: async () => {
      console.log("🔍 useArchiveStats - Ejecutando queryFn");
      const result = await archiveApi.getArchiveStats();
      console.log("🔍 useArchiveStats - Resultado de la API:", result);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// =============================================
// HOOKS PARA CASOS ARCHIVADOS
// =============================================

/**
 * Hook para obtener casos archivados con filtros
 */
export const useArchivedCases = (filters?: ArchiveFilters) => {
  return useQuery({
    queryKey: archiveKeys.cases(filters),
    queryFn: () => archiveApi.getArchivedCases(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para obtener un caso archivado por ID
 */
export const useArchivedCase = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: archiveKeys.case(id),
    queryFn: () => archiveApi.getArchivedCaseById(id),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para archivar un caso
 */
export const useArchiveCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseData: CreateArchivedCaseData) =>
      archiveApi.archiveCase(caseData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases"] }); // Invalidar casos activos
    },
    onError: (error) => {
      console.error("Error archiving case:", error);
    },
  });
};

/**
 * Hook para restaurar un caso archivado
 */
export const useRestoreCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      restoreData,
    }: {
      id: string;
      restoreData: RestoreArchivedItemData;
    }) => archiveApi.restoreCase(id, restoreData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases"] }); // Invalidar casos activos
    },
    onError: (error) => {
      console.error("Error restoring case:", error);
    },
  });
};

/**
 * Hook para eliminar permanentemente un caso archivado
 */
export const useDeleteArchivedCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      deleteData,
    }: {
      id: string;
      deleteData: DeleteArchivedItemData;
    }) => archiveApi.deleteArchivedCase(id, deleteData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
    onError: (error) => {
      console.error("Error deleting archived case:", error);
    },
  });
};

// =============================================
// HOOKS PARA TODOS ARCHIVADOS
// =============================================

/**
 * Hook para obtener TODOs archivados con filtros
 */
export const useArchivedTodos = (filters?: ArchiveFilters) => {
  return useQuery({
    queryKey: archiveKeys.todos(filters),
    queryFn: () => archiveApi.getArchivedTodos(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para obtener un TODO archivado por ID
 */
export const useArchivedTodo = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: archiveKeys.todo(id),
    queryFn: () => archiveApi.getArchivedTodoById(id),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para archivar un TODO
 */
export const useArchiveTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoData: CreateArchivedTodoData) =>
      archiveApi.archiveTodo(todoData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["todos"] }); // Invalidar TODOs activos
    },
    onError: (error) => {
      console.error("Error archiving todo:", error);
    },
  });
};

/**
 * Hook para restaurar un TODO archivado
 */
export const useRestoreTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      restoreData,
    }: {
      id: string;
      restoreData: RestoreArchivedItemData;
    }) => archiveApi.restoreTodo(id, restoreData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["todos"] }); // Invalidar TODOs activos
    },
    onError: (error) => {
      console.error("Error restoring todo:", error);
    },
  });
};

/**
 * Hook para eliminar permanentemente un TODO archivado
 */
export const useDeleteArchivedTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      deleteData,
    }: {
      id: string;
      deleteData: DeleteArchivedItemData;
    }) => archiveApi.deleteArchivedTodo(id, deleteData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
    onError: (error) => {
      console.error("Error deleting archived todo:", error);
    },
  });
};

// =============================================
// HOOKS GENERALES
// =============================================

/**
 * Hook para obtener elementos archivados combinados (casos y TODOs)
 */
export const useArchivedItems = (filters?: ArchiveFilters) => {
  console.log("🔍 useArchivedItems - Llamando con filtros:", filters);

  return useQuery({
    queryKey: archiveKeys.items(filters),
    queryFn: async () => {
      console.log(
        "🔍 useArchivedItems - Ejecutando queryFn con filtros:",
        filters
      );
      const result = await archiveApi.getArchivedItems(filters);
      console.log("🔍 useArchivedItems - Resultado de la API:", result);
      return result;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar elementos archivados
 */
export const useSearchArchivedItems = (
  searchTerm: string,
  type?: "cases" | "todos" | "all",
  limit?: number
) => {
  return useQuery({
    queryKey: archiveKeys.search(searchTerm, type),
    queryFn: () => archiveApi.searchArchivedItems(searchTerm, type, limit),
    enabled: searchTerm.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// =============================================
// HOOKS COMBINADOS/COMPUESTOS
// =============================================

/**
 * Hook para obtener datos completos del archivo
 */
export const useArchiveData = (filters?: ArchiveFilters) => {
  const statsQuery = useArchiveStats();
  const itemsQuery = useArchivedItems(filters);

  // Debug logs
  console.log("🔍 useArchiveData Debug:", {
    filters,
    statsLoading: statsQuery.isLoading,
    itemsLoading: itemsQuery.isLoading,
    statsError: statsQuery.isError,
    itemsError: itemsQuery.isError,
    stats: statsQuery.data,
    items: itemsQuery.data,
    statsErrorMessage: statsQuery.error?.message,
    itemsErrorMessage: itemsQuery.error?.message,
  });

  return {
    stats: statsQuery.data,
    items: itemsQuery.data,
    isLoading: statsQuery.isLoading || itemsQuery.isLoading,
    isError: statsQuery.isError || itemsQuery.isError,
    error: statsQuery.error || itemsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      itemsQuery.refetch();
    },
  };
};

/**
 * Hook para gestionar elementos archivados (con acciones CRUD)
 */
export const useArchiveManager = () => {
  const archiveCaseMutation = useArchiveCase();
  const archiveTodoMutation = useArchiveTodo();
  const restoreCaseMutation = useRestoreCase();
  const restoreTodoMutation = useRestoreTodo();
  const deleteCaseMutation = useDeleteArchivedCase();
  const deleteTodoMutation = useDeleteArchivedTodo();

  return {
    // Funciones de archivo
    archiveCase: archiveCaseMutation.mutateAsync,
    archiveTodo: archiveTodoMutation.mutateAsync,

    // Funciones de restauración
    restoreCase: restoreCaseMutation.mutateAsync,
    restoreTodo: restoreTodoMutation.mutateAsync,

    // Funciones de eliminación
    deleteCase: deleteCaseMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,

    // Estados de carga
    isArchiving: archiveCaseMutation.isPending || archiveTodoMutation.isPending,
    isRestoring: restoreCaseMutation.isPending || restoreTodoMutation.isPending,
    isDeleting: deleteCaseMutation.isPending || deleteTodoMutation.isPending,

    // Errores
    archiveError: archiveCaseMutation.error || archiveTodoMutation.error,
    restoreError: restoreCaseMutation.error || restoreTodoMutation.error,
    deleteError: deleteCaseMutation.error || deleteTodoMutation.error,
  };
};

// =============================================
// HOOKS SIMPLES PARA ARCHIVADO POR ID
// =============================================

/**
 * Hook simple para archivar casos por ID
 */
export const useArchiveCaseById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, reason }: { caseId: number; reason?: string }) =>
      archiveApi.archiveCaseById(caseId, reason),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
    },
    onError: (error) => {
      console.error("Error archiving case:", error);
    },
  });
};

/**
 * Hook simple para archivar todos por ID
 */
export const useArchiveTodoById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, reason }: { todoId: number; reason?: string }) =>
      archiveApi.archiveTodoById(todoId, reason),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todoControls"] });
    },
    onError: (error) => {
      console.error("Error archiving todo:", error);
    },
  });
};

/**
 * Hook principal simplificado para archivado
 */
export const useArchive = () => {
  const archiveCaseMutation = useArchiveCaseById();
  const archiveTodoMutation = useArchiveTodoById();

  return {
    // Funciones simplificadas
    archiveCase: (caseId: number, reason?: string) =>
      archiveCaseMutation.mutateAsync({ caseId, reason }),
    archiveTodo: (todoId: number, reason?: string) =>
      archiveTodoMutation.mutateAsync({ todoId, reason }),

    // Estados de carga
    isArchiving: archiveCaseMutation.isPending || archiveTodoMutation.isPending,

    // Errores
    archiveError: archiveCaseMutation.error || archiveTodoMutation.error,
  };
};
