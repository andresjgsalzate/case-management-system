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

// Case Control endpoints
export const getCaseControls = async (): Promise<CaseControl[]> => {
  const result = await authService.authenticatedRequest<CaseControl[]>(
    "/case-control"
  );

  if (!result.success) {
    throw new Error(result.message || "Error al obtener controles de casos");
  }

  return result.data || [];
};

export const getCaseControl = async (id: string): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    `/case-control/${id}`
  );

  if (!result.success) {
    throw new Error(result.message || "Error al obtener control de caso");
  }

  if (!result.data) {
    throw new Error("Control de caso no encontrado");
  }

  return result.data;
};

export const createCaseControl = async (
  data: CreateCaseControlDTO
): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    "/case-control",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error al crear control de caso");
  }

  if (!result.data) {
    throw new Error("Error al crear control de caso");
  }

  return result.data;
};

export const updateCaseControlStatus = async (
  data: UpdateCaseControlStatusDTO
): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    `/case-control/${data.id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ statusId: data.statusId }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message || "Error al actualizar estado del control de caso"
    );
  }

  if (!result.data) {
    throw new Error("Error al actualizar estado del control de caso");
  }

  return result.data;
};

export const startTimer = async (data: StartTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    `/case-control/${data.caseControlId}/start-timer`,
    {
      method: "POST",
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error al iniciar el temporizador");
  }

  if (!result.data) {
    throw new Error("Error al iniciar el temporizador");
  }

  return result.data;
};

export const stopTimer = async (data: StopTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    `/case-control/${data.caseControlId}/stop-timer`,
    {
      method: "POST",
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error al detener el temporizador");
  }

  if (!result.data) {
    throw new Error("Error al detener el temporizador");
  }

  return result.data;
};

export const pauseTimer = async (data: PauseTimerDTO): Promise<CaseControl> => {
  const result = await authService.authenticatedRequest<CaseControl>(
    `/case-control/${data.caseControlId}/pause-timer`,
    {
      method: "POST",
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error al pausar el temporizador");
  }

  if (!result.data) {
    throw new Error("Error al pausar el temporizador");
  }

  return result.data;
};

export const getCaseStatuses = async (): Promise<CaseStatus[]> => {
  const result = await authService.authenticatedRequest<CaseStatus[]>(
    "/case-control/statuses"
  );

  if (!result.success) {
    throw new Error(result.message || "Error al obtener estados de casos");
  }

  return result.data || [];
};

export const getTimeEntries = async (
  caseControlId: string
): Promise<TimeEntry[]> => {
  const result = await authService.authenticatedRequest<TimeEntry[]>(
    `/case-control/${caseControlId}/time-entries`
  );

  if (!result.success) {
    throw new Error(result.message || "Error al obtener entradas de tiempo");
  }

  return result.data || [];
};

export const getManualTimeEntries = async (
  caseControlId: string
): Promise<ManualTimeEntry[]> => {
  const result = await authService.authenticatedRequest<ManualTimeEntry[]>(
    `/case-control/${caseControlId}/manual-time-entries`
  );

  if (!result.success) {
    throw new Error(
      result.message || "Error al obtener entradas de tiempo manual"
    );
  }

  return result.data || [];
};

export const addManualTimeEntry = async (
  caseControlId: string,
  manualEntry: {
    date: string;
    durationMinutes: number;
    description: string;
  }
): Promise<ManualTimeEntry> => {
  const result = await authService.authenticatedRequest<ManualTimeEntry>(
    `/case-control/${caseControlId}/manual-time-entries`,
    {
      method: "POST",
      body: JSON.stringify(manualEntry),
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error adding manual time entry");
  }

  if (!result.data) {
    throw new Error("Error adding manual time entry");
  }

  return result.data;
};

export const deleteTimeEntry = async (
  caseControlId: string,
  entryId: string
): Promise<{ deletedEntryId: string; newTotalTimeMinutes: number }> => {
  const result = await authService.authenticatedRequest<{
    deletedEntryId: string;
    newTotalTimeMinutes: number;
  }>(`/case-control/${caseControlId}/time-entries/${entryId}`, {
    method: "DELETE",
  });

  if (!result.success) {
    throw new Error(result.message || "Error al eliminar entrada de tiempo");
  }

  if (!result.data) {
    throw new Error("Error al eliminar entrada de tiempo");
  }

  return result.data;
};

export const deleteManualTimeEntry = async (
  caseControlId: string,
  entryId: string
): Promise<{ deletedEntryId: string; newTotalTimeMinutes: number }> => {
  const result = await authService.authenticatedRequest<{
    deletedEntryId: string;
    newTotalTimeMinutes: number;
  }>(`/case-control/${caseControlId}/manual-time-entries/${entryId}`, {
    method: "DELETE",
  });

  if (!result.success) {
    throw new Error(
      result.message || "Error al eliminar entrada de tiempo manual"
    );
  }

  if (!result.data) {
    throw new Error("Error al eliminar entrada de tiempo manual");
  }

  return result.data;
};

export const addManualTime = async (
  data: AddManualTimeDTO
): Promise<ManualTimeEntry> => {
  const result = await authService.authenticatedRequest<ManualTimeEntry>(
    `/case-control/${data.caseControlId}/manual-time`,
    {
      method: "POST",
      body: JSON.stringify({
        date: data.date,
        durationMinutes: data.durationMinutes,
        description: data.description,
      }),
    }
  );

  if (!result.success) {
    throw new Error(result.message || "Error al agregar tiempo manual");
  }

  if (!result.data) {
    throw new Error("Error al agregar tiempo manual");
  }

  return result.data;
};

// Funciones para reportes - obtener todos los time entries y manual time entries
// Como el backend no tiene endpoints globales, obtenemos todos los case controls
// y luego iteramos para obtener las time entries de cada uno
export const getAllTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    // Primero obtener todos los case controls
    const caseControls = await getCaseControls();

    // Luego obtener time entries para cada case control
    const timeEntriesPromises = caseControls.map(
      (caseControl) => getTimeEntries(caseControl.id).catch(() => []) // Si falla, devolver array vacío
    );

    const timeEntriesArrays = await Promise.all(timeEntriesPromises);

    // Aplanar el array de arrays en un solo array
    return timeEntriesArrays.flat();
  } catch (error) {
    console.error("Error al obtener todas las entradas de tiempo:", error);
    return [];
  }
};

export const getAllManualTimeEntries = async (): Promise<ManualTimeEntry[]> => {
  try {
    // Primero obtener todos los case controls
    const caseControls = await getCaseControls();

    // Luego obtener manual time entries para cada case control
    const manualTimeEntriesPromises = caseControls.map(
      (caseControl) => getManualTimeEntries(caseControl.id).catch(() => []) // Si falla, devolver array vacío
    );

    const manualTimeEntriesArrays = await Promise.all(
      manualTimeEntriesPromises
    );

    // Aplanar el array de arrays en un solo array
    return manualTimeEntriesArrays.flat();
  } catch (error) {
    console.error(
      "Error al obtener todas las entradas de tiempo manual:",
      error
    );
    return [];
  }
};
