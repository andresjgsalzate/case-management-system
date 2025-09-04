import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TimeEntry, ManualTimeEntry } from "../types/caseControl";

// API functions (necesitaremos crearlas)
const api = {
  async getTimeEntries(caseControlId: string): Promise<TimeEntry[]> {
    const response = await fetch(
      `http://localhost:3000/api/time-entries/case-control/${caseControlId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch time entries");
    return response.json();
  },

  async getManualTimeEntries(
    caseControlId: string
  ): Promise<ManualTimeEntry[]> {
    const response = await fetch(
      `http://localhost:3000/api/manual-time-entries/case-control/${caseControlId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch manual time entries");
    return response.json();
  },

  async addManualTime(data: {
    caseControlId: string;
    description: string;
    durationHours: number;
    durationMinutes: number;
    date: string;
  }): Promise<ManualTimeEntry> {
    const response = await fetch(
      "http://localhost:3000/api/manual-time-entries",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    const response = await fetch(
      `http://localhost:3000/api/time-entries/${entryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to delete time entry");
  },

  async deleteManualTimeEntry(entryId: string): Promise<void> {
    const response = await fetch(
      `http://localhost:3000/api/manual-time-entries/${entryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
