// DTOs para Case Control
export interface CreateCaseControlDTO {
  caseId: string;
  userId?: string; // Si no se especifica, usa el usuario actual
  statusId?: string; // Si no se especifica, usa PENDIENTE
}

export interface UpdateCaseControlStatusDTO {
  statusId: string;
}

export interface StartTimerDTO {
  caseControlId: string;
}

export interface StopTimerDTO {
  caseControlId: string;
}

export interface PauseTimerDTO {
  caseControlId: string;
}

// DTOs para Time Entries
export interface CreateTimeEntryDTO {
  caseControlId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  description?: string;
}

export interface CreateManualTimeEntryDTO {
  caseControlId: string;
  date: string;
  durationMinutes: number;
  description: string;
}

export interface UpdateManualTimeEntryDTO {
  date?: string;
  durationMinutes?: number;
  description?: string;
}

// DTOs para Case Status Control
export interface CreateCaseStatusControlDTO {
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCaseStatusControlDTO {
  name?: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
}

// DTOs para respuestas
export interface CaseControlWithRelationsDTO {
  id: string;
  caseId: string;
  userId: string;
  statusId: string;
  totalTimeMinutes: number;
  timerStartAt?: string;
  isTimerActive: boolean;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones pobladas
  case?: {
    id: string;
    numeroCaso: string;
    descripcion: string;
    clasificacion: string;
    aplicacion?: {
      id: string;
      nombre: string;
      descripcion?: string;
    };
  };
  user?: {
    id: string;
    fullName?: string;
    email: string;
  };
  status?: {
    id: string;
    name: string;
    description?: string;
    color: string;
  };
}

// DTOs para filtros y búsquedas
export interface CaseControlFiltersDTO {
  statusId?: string;
  userId?: string;
  search?: string; // Para buscar por número de caso o descripción
  startDate?: string;
  endDate?: string;
  isTimerActive?: boolean;
}

// DTOs para reportes
export interface TimeReportFiltersDTO {
  startDate: string;
  endDate: string;
  userId?: string;
  statusId?: string;
  caseId?: string;
}

export interface CaseControlStatsDTO {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalTimeMinutes: number;
  averageTimePerCase: number;

  byStatus: {
    [statusName: string]: {
      count: number;
      totalMinutes: number;
    };
  };

  byUser: {
    userId: string;
    userName: string;
    caseCount: number;
    totalMinutes: number;
  }[];
}
