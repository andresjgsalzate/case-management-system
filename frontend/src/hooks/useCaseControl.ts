import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TimeEntry, ManualTimeEntry } from "../types/caseControl";
import { securityService } from "../services/security.service";
import { apiService } from "../services/api.service";
import config from "../config/config";

// API functions (usando el servicio centralizado)
const api = {
  async getTimeEntries(caseControlId: string): Promise<TimeEntry[]> {
    const tokens = securityService.getValidTokens();
    if (!tokens) {
      throw new Error("No valid authentication token");
    }

    return apiService.get<TimeEntry[]>(
      `/time-entries/case-control/${caseControlId}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      }
    );
  },

  async getManualTimeEntries(
    caseControlId: string
  ): Promise<ManualTimeEntry[]> {
    const tokens = securityService.getValidTokens();
    if (!tokens) {
      throw new Error("No valid authentication token");
    }

    return apiService.get<ManualTimeEntry[]>(
      `/manual-time-entries/case-control/${caseControlId}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      }
    );
  },

  async addManualTime(data: {
    caseControlId: string;
    description: string;
    durationHours: number;
    durationMinutes: number;
    date: string;
  }): Promise<ManualTimeEntry> {
    const tokens = securityService.getValidTokens();
    if (!tokens) {
      throw new Error("No valid authentication token");
    }

    const response = await fetch(
      `${config.api.backendUrl}/api/manual-time-entries`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.token}`,
        },
        body: JSON.stringify({
          caseControlId: data.caseControlId,
          description: data.description,
          durationMinutes: data.durationHours * 60 + data.durationMinutes,
          date: data.date,
        }),
      }
    );
    if (!response.ok) throw new Error("Failed to add manual time");
    return response.json();
  },

  async deleteTimeEntry(entryId: string): Promise<void> {
    const tokens = securityService.getValidTokens();
    if (!tokens) {
      throw new Error("No valid authentication token");
    }

    const response = await fetch(
      `${config.api.backendUrl}/api/time-entries/${entryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to delete time entry");
  },

  async deleteManualTimeEntry(entryId: string): Promise<void> {
    const tokens = securityService.getValidTokens();
    if (!tokens) {
      throw new Error("No valid authentication token");
    }

    const response = await fetch(
      `${config.api.backendUrl}/api/manual-time-entries/${entryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to delete manual time entry");
  },
};

// Hooks
export const useTimeEntries = (caseControlId: string) => {
  return useQuery({
    queryKey: ["timeEntries", caseControlId],
    queryFn: () => api.getTimeEntries(caseControlId),
    enabled: !!caseControlId,
  });
};

export const useManualTimeEntries = (caseControlId: string) => {
  return useQuery({
    queryKey: ["manualTimeEntries", caseControlId],
    queryFn: () => api.getManualTimeEntries(caseControlId),
    enabled: !!caseControlId,
  });
};

export const useAddManualTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.addManualTime,
    onSuccess: (data) => {
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["manualTimeEntries", data.caseControlId],
      });

      // Invalidar y refrescar inmediatamente la lista de case controls
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
      queryClient.refetchQueries({ queryKey: ["caseControls"] });

      // También invalidar las time entries por si acaso
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteTimeEntry,
    onSuccess: () => {
      // Invalidar todas las queries de time entries
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
      queryClient.refetchQueries({ queryKey: ["caseControls"] });
    },
  });
};

export const useDeleteManualTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteManualTimeEntry,
    onSuccess: () => {
      // Invalidar todas las queries de manual time entries
      queryClient.invalidateQueries({ queryKey: ["manualTimeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
      queryClient.refetchQueries({ queryKey: ["caseControls"] });
    },
  });
};
