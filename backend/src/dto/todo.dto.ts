export interface CreateTodoDto {
  title: string;
  description?: string;
  priorityId: string;
  assignedUserId?: string;
  dueDate?: string; // ISO date string
  estimatedMinutes?: number;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  priorityId?: string;
  assignedUserId?: string;
  dueDate?: string; // ISO date string
  estimatedMinutes?: number;
  isCompleted?: boolean;
}

export interface TodoResponseDto {
  id: string;
  title: string;
  description?: string;
  priorityId: string;
  assignedUserId?: string;
  createdByUserId: string;
  dueDate?: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  priority?: TodoPriorityResponseDto;
  assignedUser?: UserProfileResponseDto;
  createdByUser?: UserProfileResponseDto;
  control?: TodoControlResponseDto;
}

export interface TodoPriorityResponseDto {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: number;
  isActive: boolean;
  displayOrder: number;
}

export interface UserProfileResponseDto {
  id: string;
  email: string;
  fullName?: string;
  isActive: boolean;
}

export interface TodoControlResponseDto {
  id: string;
  todoId: string;
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
  user?: UserProfileResponseDto;
  status?: CaseStatusControlResponseDto;
}

export interface CaseStatusControlResponseDto {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TodoFiltersDto {
  priorityId?: string;
  assignedUserId?: string;
  createdByUserId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  showCompleted?: boolean;
}

export interface CreateTodoControlDto {
  todoId: string;
  userId: string;
  statusId: string;
}

export interface UpdateTodoControlDto {
  statusId?: string;
  totalTimeMinutes?: number;
  isTimerActive?: boolean;
  timerStartAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateTodoTimeEntryDto {
  todoControlId: string;
  startTime: string;
  endTime?: string;
  entryType: "automatic" | "manual";
  description?: string;
}

export interface CreateTodoManualTimeEntryDto {
  todoControlId: string;
  date: string;
  durationMinutes: number;
  description: string;
}

export interface TodoMetricsDto {
  totalTodos: number;
  activeTodos: number;
  completedTodos: number;
  overdueTodos: number;
  totalTimeMinutes: number;
  averageCompletionTime: number;
  todosByPriority: Array<{
    priorityId: string;
    priorityName: string;
    count: number;
  }>;
  todosByUser: Array<{
    userId: string;
    userName: string;
    assigned: number;
    completed: number;
  }>;
}
