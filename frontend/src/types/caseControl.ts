export interface CaseStatus {
  id: string;
  name: string;
  description: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseControl {
  id: string;
  caseId: string;
  userId: string;
  statusId: string;
  totalTimeMinutes: number;
  isTimerActive: boolean;
  timerStartAt?: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones
  case?: {
    id: string;
    numeroCaso: string;
    descripcion: string;
    clasificacion: string;
    estado: string;
    aplicacion?: {
      id: string;
      nombre: string;
      descripcion: string;
    };
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  status?: CaseStatus;
}

export interface TimeEntry {
  id: string;
  caseControlId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ManualTimeEntry {
  id: string;
  caseControlId: string;
  userId: string;
  date: string;
  durationMinutes: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// DTOs
export interface StartTimerDTO {
  caseControlId: string;
}

export interface StopTimerDTO {
  caseControlId: string;
}

export interface PauseTimerDTO {
  caseControlId: string;
}

export interface UpdateCaseControlStatusDTO {
  id: string;
  statusId: string;
}

export interface CreateCaseControlDTO {
  caseId: string;
  userId?: string;
  statusId?: string;
}

export interface AddManualTimeDTO {
  caseControlId: string;
  date: string;
  durationMinutes: number;
  description: string;
}
