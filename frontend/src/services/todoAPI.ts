import { authService } from "./auth.service";
import {
  Todo,
  CreateTodoData,
  UpdateTodoData,
  TodoFilters,
  TodoPriority,
  TodoTimeEntry,
  TodoManualTimeEntry,
  TodoControl,
  TodoMetrics,
} from "../types/todo.types";

export class TodoAPI {
  // ============= MAIN TODO METHODS =============

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
    const response = await authService.authenticatedRequest<Todo>(
      `/todos/${id}`
    );

    if (!response.success) {
      throw new Error(response.message || "Error al obtener TODO");
    }

    if (!response.data) {
      throw new Error("TODO no encontrado");
    }

    return response.data;
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const response = await authService.authenticatedRequest<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.message || "Error al crear TODO");
    }

    if (!response.data) {
      throw new Error("Error al crear TODO");
    }

    return response.data;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    const response = await authService.authenticatedRequest<Todo>(
      `/todos/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al actualizar TODO");
    }

    if (!response.data) {
      throw new Error("Error al actualizar TODO");
    }

    return response.data;
  }

  async deleteTodo(id: string): Promise<void> {
    const response = await authService.authenticatedRequest<void>(
      `/todos/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al eliminar TODO");
    }
  }

  async completeTodo(id: string): Promise<Todo> {
    const response = await authService.authenticatedRequest<Todo>(
      `/todos/${id}/complete`,
      {
        method: "PUT",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al completar TODO");
    }

    if (!response.data) {
      throw new Error("Error al completar TODO");
    }

    return response.data;
  }

  async reopenTodo(id: string): Promise<Todo> {
    const response = await authService.authenticatedRequest<Todo>(
      `/todos/${id}/reactivate`,
      {
        method: "PUT",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al reabrir TODO");
    }

    if (!response.data) {
      throw new Error("Error al reabrir TODO");
    }

    return response.data;
  }

  // ============= PRIORITY METHODS =============

  async getPriorities(): Promise<TodoPriority[]> {
    const response = await authService.authenticatedRequest<TodoPriority[]>(
      "/todos/priorities"
    );

    if (!response.success) {
      throw new Error(response.message || "Error al obtener prioridades");
    }

    return response.data || [];
  }

  async createPriority(data: Omit<TodoPriority, "id">): Promise<TodoPriority> {
    const response = await authService.authenticatedRequest<TodoPriority>(
      "/todos/priorities",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al crear prioridad");
    }

    if (!response.data) {
      throw new Error("Error al crear prioridad");
    }

    return response.data;
  }

  async updatePriority(
    id: string,
    data: Partial<Omit<TodoPriority, "id">>
  ): Promise<TodoPriority> {
    const response = await authService.authenticatedRequest<TodoPriority>(
      `/todos/priorities/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al actualizar prioridad");
    }

    if (!response.data) {
      throw new Error("Error al actualizar prioridad");
    }

    return response.data;
  }

  async deletePriority(id: string): Promise<void> {
    const response = await authService.authenticatedRequest<void>(
      `/todos/priorities/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al eliminar prioridad");
    }
  }

  // ============= TIMER CONTROL METHODS =============

  async startTodoTimer(todoId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<TodoControl>(
      `/todos/${todoId}/start-timer`,
      {
        method: "POST",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al iniciar timer");
    }

    if (!response.data) {
      throw new Error("Error al iniciar timer");
    }

    return response.data;
  }

  async pauseTodoTimer(todoId: string): Promise<TodoControl> {
    const response = await authService.authenticatedRequest<TodoControl>(
      `/todos/${todoId}/pause-timer`,
      {
        method: "POST",
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Error al pausar timer");
    }

    if (!response.data) {
      throw new Error("Error al pausar timer");
    }

    return response.data;
  }

  // ============= TIME ENTRIES MANAGEMENT =============

  async getTodoTimeEntries(todoId: string): Promise<TodoTimeEntry[]> {
    const response = await authService.authenticatedRequest<TodoTimeEntry[]>(
      `/todos/${todoId}/time-entries`
    );

    if (!response.success) {
      throw new Error(
        response.message || "Error al obtener entradas de tiempo"
      );
    }

    return response.data || [];
  }

  async addManualTimeEntry(
    todoId: string,
    data: {
      date: string;
      durationMinutes: number;
      description: string;
    }
  ): Promise<TodoManualTimeEntry> {
    const response =
      await authService.authenticatedRequest<TodoManualTimeEntry>(
        `/todos/${todoId}/manual-time-entries`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

    if (!response.success) {
      throw new Error(response.message || "Error al agregar tiempo manual");
    }

    if (!response.data) {
      throw new Error("Error al agregar tiempo manual");
    }

    return response.data;
  }

  async deleteTimeEntry(todoId: string, entryId: string): Promise<void> {
    const response = await authService.authenticatedRequest<void>(
      `/todos/${todoId}/time-entries/${entryId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.success) {
      throw new Error(
        response.message || "Error al eliminar entrada de tiempo"
      );
    }
  }

  // ============= METRICS METHODS =============

  async getTodoMetrics(filters?: TodoFilters): Promise<TodoMetrics> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await authService.authenticatedRequest<TodoMetrics>(
      `/todos/metrics${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (!response.success) {
      throw new Error(response.message || "Error al obtener métricas");
    }

    if (!response.data) {
      throw new Error("Error al obtener métricas");
    }

    return response.data;
  }
}

// Instancia única para exportar
export const todoAPI = new TodoAPI();
