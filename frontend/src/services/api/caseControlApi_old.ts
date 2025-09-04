import {
  CaseControl,
  CaseStatus,
  TimeEntry,
  ManualTimeEntry,
  StartTimerDTO,
  StopTimerDTO,
  PauseTimerDTO,
  UpdateCaseControlStatusDTO,
  CreateCaseControlDTO,
  AddManualTimeDTO,
} from "../../types/caseControl";
import { authService } from "../auth.service";

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Case Control endpoints
export const getCaseControls = async (): Promise<CaseControl[]> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl[]>
  >("/case-control");

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al obtener controles de casos"
    );
  }

  return result.data.data;
};

export const getCaseControl = async (id: string): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >(`/case-control/${id}`);

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al obtener control de caso");
  }

  return result.data.data;
};

export const createCaseControl = async (
  data: CreateCaseControlDTO
): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >("/case-control", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al crear control de caso");
  }

  return result.data.data;
};

export const updateCaseControlStatus = async (
  data: UpdateCaseControlStatusDTO
): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >(`/case-control/${data.id}/status`, {
    method: "PUT",
    body: JSON.stringify({ statusId: data.statusId }),
  });

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al actualizar estado del control de caso"
    );
  }

  return result.data.data;
};

// Case Status endpoints
export const getCaseStatuses = async (): Promise<CaseStatus[]> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseStatus[]>
  >("/case-control/case-statuses");

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al obtener estados de casos"
    );
  }

  return result.data.data;
};

export const initializeCaseStatuses = async (): Promise<CaseStatus[]> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseStatus[]>
  >("/case-control/case-statuses/initialize", {
    method: "POST",
  });

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al inicializar estados de casos"
    );
  }

  return result.data.data;
};

// Timer endpoints
export const startTimer = async (data: StartTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >("/case-control/timer/start", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al iniciar timer");
  }

  return result.data.data;
};

export const pauseTimer = async (data: PauseTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >("/case-control/timer/pause", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al pausar timer");
  }

  return result.data.data;
};

export const stopTimer = async (data: StopTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<CaseControl>
  >("/case-control/timer/stop", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al detener timer");
  }

  return result.data.data;
};

// Time entries endpoints
export const getTimeEntries = async (
  caseControlId: string
): Promise<TimeEntry[]> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<TimeEntry[]>
  >(`/case-control/${caseControlId}/time-entries`);

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al obtener entradas de tiempo"
    );
  }

  return result.data.data;
};

export const getManualTimeEntries = async (
  caseControlId: string
): Promise<ManualTimeEntry[]> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<ManualTimeEntry[]>
  >(`/case-control/${caseControlId}/manual-time-entries`);

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al obtener entradas de tiempo manual"
    );
  }

  return result.data.data;
};

export const addManualTimeEntry = async (
  caseControlId: string,
  manualEntry: AddManualTimeDTO
): Promise<ManualTimeEntry> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<ManualTimeEntry>
  >(`/case-control/${caseControlId}/manual-time-entries`, {
    method: "POST",
    body: JSON.stringify(manualEntry),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error adding manual time entry");
  }

  return result.data.data;
};

export const deleteTimeEntry = async (
  caseControlId: string,
  entryId: string
): Promise<{ deletedEntryId: string; newTotalTimeMinutes: number }> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<{
      deletedEntryId: string;
      newTotalTimeMinutes: number;
    }>
  >(`/case-control/${caseControlId}/time-entries/${entryId}`, {
    method: "DELETE",
  });

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al eliminar entrada de tiempo"
    );
  }

  return result.data.data;
};

export const deleteManualTimeEntry = async (
  caseControlId: string,
  entryId: string
): Promise<{ deletedEntryId: string; newTotalTimeMinutes: number }> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<{
      deletedEntryId: string;
      newTotalTimeMinutes: number;
    }>
  >(`/case-control/${caseControlId}/manual-time-entries/${entryId}`, {
    method: "DELETE",
  });

  if (!result.data?.success) {
    throw new Error(
      result.data?.message || "Error al eliminar entrada de tiempo manual"
    );
  }

  return result.data.data;
};

export const addManualTime = async (
  data: AddManualTimeDTO
): Promise<ManualTimeEntry> => {
  const result = await authService.authenticatedRequest<
    ApiResponse<ManualTimeEntry>
  >(`/case-control/${data.caseControlId}/manual-time`, {
    method: "POST",
    body: JSON.stringify({
      date: data.date,
      durationMinutes: data.durationMinutes,
      description: data.description,
    }),
  });

  if (!result.data?.success) {
    throw new Error(result.data?.message || "Error al agregar tiempo manual");
  }

  return result.data.data;
};
