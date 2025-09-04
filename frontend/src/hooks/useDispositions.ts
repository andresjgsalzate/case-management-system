import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dispositionApi,
  // type Disposition,
  type CreateDispositionData,
  type UpdateDispositionData,
  type DispositionFilters,
  // type DispositionMensual,
} from "../services/dispositionApi";
import toast from "react-hot-toast";

// Query Keys
export const DISPOSITION_QUERY_KEYS = {
  all: ["dispositions"] as const,
  lists: () => [...DISPOSITION_QUERY_KEYS.all, "list"] as const,
  list: (filters?: DispositionFilters) =>
    [...DISPOSITION_QUERY_KEYS.lists(), filters] as const,
  details: () => [...DISPOSITION_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...DISPOSITION_QUERY_KEYS.details(), id] as const,
  monthlyStats: (year: number) =>
    [...DISPOSITION_QUERY_KEYS.all, "monthlyStats", year] as const,
  years: () => [...DISPOSITION_QUERY_KEYS.all, "years"] as const,
  byMonth: (year: number) =>
    [...DISPOSITION_QUERY_KEYS.all, "byMonth", year] as const,
};

// Hook para obtener todas las disposiciones
export const useDispositions = (filters?: DispositionFilters) => {
  return useQuery({
    queryKey: DISPOSITION_QUERY_KEYS.list(filters),
    queryFn: () => dispositionApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener una disposición por ID
export const useDisposition = (id: string) => {
  return useQuery({
    queryKey: DISPOSITION_QUERY_KEYS.detail(id),
    queryFn: () => dispositionApi.getById(id),
    enabled: !!id,
  });
};

// Hook para obtener disposiciones agrupadas por mes
export const useDispositionsByMonth = (year: number) => {
  return useQuery({
    queryKey: DISPOSITION_QUERY_KEYS.byMonth(year),
    queryFn: () => dispositionApi.getDispositionsByMonth(year),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener estadísticas mensuales
export const useMonthlyStats = (year: number) => {
  return useQuery({
    queryKey: DISPOSITION_QUERY_KEYS.monthlyStats(year),
    queryFn: () => dispositionApi.getMonthlyStats(year),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener años disponibles
export const useAvailableYears = () => {
  return useQuery({
    queryKey: DISPOSITION_QUERY_KEYS.years(),
    queryFn: () => dispositionApi.getAvailableYears(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

// Hook para crear disposición
export const useCreateDisposition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDispositionData) => dispositionApi.create(data),
    onSuccess: (newDisposition) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.byMonth(
          new Date(newDisposition.date).getFullYear()
        ),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.monthlyStats(
          new Date(newDisposition.date).getFullYear()
        ),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.years(),
      });

      toast.success("Disposición creada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear la disposición");
    },
  });
};

// Hook para actualizar disposición
export const useUpdateDisposition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDispositionData }) =>
      dispositionApi.update(id, data),
    onSuccess: (updatedDisposition) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.detail(updatedDisposition.id),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.byMonth(
          new Date(updatedDisposition.date).getFullYear()
        ),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.monthlyStats(
          new Date(updatedDisposition.date).getFullYear()
        ),
      });

      toast.success("Disposición actualizada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar la disposición");
    },
  });
};

// Hook para eliminar disposición
export const useDeleteDisposition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dispositionApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: DISPOSITION_QUERY_KEYS.years(),
      });

      // Remover de caché el detalle de la disposición eliminada
      queryClient.removeQueries({
        queryKey: DISPOSITION_QUERY_KEYS.detail(deletedId),
      });

      // Invalidar stats mensuales de todos los años por si acaso
      queryClient.invalidateQueries({ queryKey: DISPOSITION_QUERY_KEYS.all });

      toast.success("Disposición eliminada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar la disposición");
    },
  });
};

// Hook para refrescar datos
export const useRefreshDispositions = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: DISPOSITION_QUERY_KEYS.all });
  };
};
