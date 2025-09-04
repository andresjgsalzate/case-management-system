import {
  Todo,
  TodoPriority,
  TodoControl,
  CreateTodoData,
  UpdateTodoData,
  TodoFilters,
  TodoMetrics,
  TodoTimeEntry,
  TodoManualTimeEntry,
} from "../types/todo.types";
import { authService } from "./auth.service";

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Todo API Service
class TodoAPI {
  // TODOs Management
  async getAllTodos(filters?: TodoFilters): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await authService.authenticatedRequest<Todo[]>(
      `/todos${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (!response.success) {
      throw new Error(response.message || "Error al obtener TODOs");
    }

    return response.data || [];
  }

  async getTodoById(id: string): Promise<Todo> {
    const response = await authService.authenticatedRequest<ApiResponse<Todo>>(
      `/todos/${id}`
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al obtener TODO");
    }

    return response.data.data;
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const response = await authService.authenticatedRequest<ApiResponse<Todo>>(
      "/todos",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al crear TODO");
    }

    return response.data.data;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    const response = await authService.authenticatedRequest<ApiResponse<Todo>>(
      `/todos/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al actualizar TODO");
    }

    return response.data.data;
  }

  async deleteTodo(id: string): Promise<void> {
    const response = await authService.authenticatedRequest<ApiResponse<void>>(
      `/todos/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al eliminar TODO");
    }
  }

  async completeTodo(id: string): Promise<Todo> {
    const response = await authService.authenticatedRequest<ApiResponse<Todo>>(
      `/todos/${id}/complete`,
      {
        method: "POST",
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al completar TODO");
    }

    return response.data.data;
  }

  async reopenTodo(id: string): Promise<Todo> {
    const response = await authService.authenticatedRequest<ApiResponse<Todo>>(
      `/todos/${id}/reopen`,
      {
        method: "POST",
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al reabrir TODO");
    }

    return response.data.data;
  }

  // Todo Priorities Management
  async getPriorities(): Promise<TodoPriority[]> {
    const response = await authService.authenticatedRequest<TodoPriority[]>(
      "/todos/priorities"
    );

    if (!response.success) {
      throw new Error(response.message || "Error al obtener prioridades");
    }

    return response.data || [];
  }

  async createPriority(
    data: Omit<TodoPriority, "id" | "isActive" | "displayOrder">
  ): Promise<TodoPriority> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoPriority>
    >("/todos/priorities", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al crear prioridad");
    }

    return response.data.data;
  }

  // Todo Control Management
  async getTodoControl(todoId: string): Promise<TodoControl | null> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoControl>
    >(`/todos/${todoId}/control`);

    if (!response.data?.success) {
      return null;
    }

    return response.data.data;
  }

  async assignTodo(todoId: string, userId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoControl>
    >(`/todos/${todoId}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al asignar TODO");
    }

    return response.data.data;
  }

  async startTodoTimer(todoId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoControl>
    >(`/todos/${todoId}/timer/start`, {
      method: "POST",
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al iniciar timer");
    }

    return response.data.data;
  }

  async pauseTodoTimer(todoId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoControl>
    >(`/todos/${todoId}/timer/pause`, {
      method: "POST",
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al pausar timer");
    }

    return response.data.data;
  }

  async stopTodoTimer(todoId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoControl>
    >(`/todos/${todoId}/timer/stop`, {
      method: "POST",
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al detener timer");
    }

    return response.data.data;
  }

  // Time Entries Management
  async getTodoTimeEntries(todoId: string): Promise<TodoTimeEntry[]> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoTimeEntry[]>
    >(`/todos/${todoId}/time-entries`);

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Error al obtener entradas de tiempo"
      );
    }

    return response.data.data;
  }

  async addManualTimeEntry(
    todoId: string,
    data: {
      date: string;
      durationMinutes: number;
      description: string;
    }
  ): Promise<TodoManualTimeEntry> {
    const response = await authService.authenticatedRequest<
      ApiResponse<TodoManualTimeEntry>
    >(`/todos/${todoId}/manual-time-entries`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Error al agregar tiempo manual"
      );
    }

    return response.data.data;
  }

  async deleteTimeEntry(todoId: string, entryId: string): Promise<void> {
    const response = await authService.authenticatedRequest<ApiResponse<void>>(
      `/todos/${todoId}/time-entries/${entryId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Error al eliminar entrada de tiempo"
      );
    }
  }

  // Metrics and Analytics
  async getTodoMetrics(filters?: TodoFilters): Promise<TodoMetrics> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await authService.authenticatedRequest<
      ApiResponse<TodoMetrics>
    >(`/todos/metrics${params.toString() ? `?${params.toString()}` : ""}`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al obtener métricas");
    }

    return response.data.data;
  }

  // User Management for Assignments
  async getAvailableUsers(): Promise<
    Array<{ id: string; email: string; fullName?: string }>
  > {
    const response = await authService.authenticatedRequest<
      ApiResponse<Array<{ id: string; email: string; fullName?: string }>>
    >("/users");

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Error al obtener usuarios");
    }

    return response.data.data;
  }
}

// Export singleton instance
export const todoAPI = new TodoAPI();
export default todoAPI;
