export interface Todo {
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
  priority?: TodoPriority;
  assignedUser?: UserProfile;
  createdByUser?: UserProfile;
  control?: TodoControl;
}

export interface TodoPriority {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: number;
  isActive: boolean;
  displayOrder: number;
}

export interface TodoControl {
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
  user?: UserProfile;
  status?: CaseStatusControl;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  roleId?: string;
  isActive: boolean;
}

export interface CaseStatusControl {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priorityId: string;
  assignedUserId?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priorityId?: string;
  assignedUserId?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  isCompleted?: boolean;
}

export interface TodoFilters {
  priorityId?: string;
  assignedUserId?: string;
  createdByUserId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  showCompleted?: boolean;
}

export interface TodoMetrics {
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

export interface TodoTimeEntry {
  id: string;
  todoControlId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  entryType: "automatic" | "manual";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoManualTimeEntry {
  id: string;
  todoControlId: string;
  userId: string;
  date: string;
  durationMinutes: number;
  description: string;
  createdAt: string;
  createdBy: string;
}
