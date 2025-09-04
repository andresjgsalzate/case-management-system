import { useState, useEffect, useCallback } from "react";
import { todoAPI } from "../services/todoAPI";
import {
  Todo,
  TodoPriority,
  CreateTodoData,
  UpdateTodoData,
  TodoFilters,
  TodoMetrics,
} from "../types/todo.types";

export const useTodos = (initialFilters?: TodoFilters) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [priorities, setPriorities] = useState<TodoPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TodoFilters>(initialFilters || {});

  // Cargar todos con filtros
  const fetchTodos = useCallback(
    async (appliedFilters?: TodoFilters) => {
      try {
        setLoading(true);
        setError(null);
        const filtersToUse = appliedFilters || filters;
        const todosData = await todoAPI.getAllTodos(filtersToUse);
        setTodos(todosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar TODOs");
        console.error("Error fetching todos:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Cargar prioridades
  const fetchPriorities = useCallback(async () => {
    try {
      const prioritiesData = await todoAPI.getPriorities();
      setPriorities(prioritiesData);
    } catch (err) {
      console.error("Error fetching priorities:", err);
    }
  }, []);

  // Crear TODO
  const createTodo = useCallback(
    async (todoData: CreateTodoData): Promise<Todo | null> => {
      try {
        setError(null);
        const newTodo = await todoAPI.createTodo(todoData);
        setTodos((prev) => [newTodo, ...prev]);
        return newTodo;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear TODO");
        console.error("Error creating todo:", err);
        return null;
      }
    },
    []
  );

  // Actualizar TODO
  const updateTodo = useCallback(
    async (id: string, todoData: UpdateTodoData): Promise<Todo | null> => {
      try {
        setError(null);
        const updatedTodo = await todoAPI.updateTodo(id, todoData);
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updatedTodo : todo))
        );
        return updatedTodo;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar TODO"
        );
        console.error("Error updating todo:", err);
        return null;
      }
    },
    []
  );

  // Eliminar TODO
  const deleteTodo = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await todoAPI.deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar TODO");
      console.error("Error deleting todo:", err);
      return false;
    }
  }, []);

  // Completar TODO
  const completeTodo = useCallback(async (id: string): Promise<Todo | null> => {
    try {
      setError(null);
      const completedTodo = await todoAPI.completeTodo(id);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? completedTodo : todo))
      );
      return completedTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al completar TODO");
      console.error("Error completing todo:", err);
      return null;
    }
  }, []);

  // Reactivar TODO
  const reactivateTodo = useCallback(
    async (id: string): Promise<Todo | null> => {
      try {
        setError(null);
        const reactivatedTodo = await todoAPI.reopenTodo(id);
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? reactivatedTodo : todo))
        );
        return reactivatedTodo;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al reactivar TODO"
        );
        console.error("Error reactivating todo:", err);
        return null;
      }
    },
    []
  );

  // ============= TIMER CONTROL METHODS =============

  // Iniciar timer
  const startTimer = useCallback(async (id: string): Promise<Todo | null> => {
    try {
      setError(null);
      const response = await todoAPI.startTodoTimer(id);
      if (response) {
        // Actualizar el estado del todo con el control actualizado
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, control: response } : todo
          )
        );
        return { ...todos.find((t) => t.id === id)!, control: response };
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar timer");
      console.error("Error starting timer:", err);
      return null;
    }
  }, []);

  // Pausar timer
  const pauseTimer = useCallback(async (id: string): Promise<Todo | null> => {
    try {
      setError(null);
      const response = await todoAPI.pauseTodoTimer(id);
      if (response) {
        // Actualizar el estado del todo con el control actualizado
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, control: response } : todo
          )
        );
        return { ...todos.find((t) => t.id === id)!, control: response };
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al pausar timer");
      console.error("Error pausing timer:", err);
      return null;
    }
  }, []);

  // ============= MANUAL TIME METHODS =============

  // Agregar tiempo manual
  const addManualTimeEntry = useCallback(
    async (
      todoId: string,
      data: {
        description: string;
        durationMinutes: number;
        date: string; // formato YYYY-MM-DD
        userId: string;
      }
    ): Promise<any | null> => {
      try {
        setError(null);
        const entry = await todoAPI.addManualTimeEntry(todoId, data);
        // Refetch todos para actualizar el tiempo total
        await fetchTodos(filters);
        return entry;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al agregar tiempo manual"
        );
        console.error("Error adding manual time entry:", err);
        return null;
      }
    },
    [filters, fetchTodos]
  );

  // Obtener entradas de tiempo manual
  const getManualTimeEntries = useCallback(
    async (todoId: string): Promise<any[]> => {
      try {
        setError(null);
        return await todoAPI.getTodoTimeEntries(todoId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al obtener entradas de tiempo manual"
        );
        console.error("Error getting manual time entries:", err);
        return [];
      }
    },
    []
  );

  // Eliminar entrada de tiempo manual
  const deleteManualTimeEntry = useCallback(
    async (todoId: string, entryId: string): Promise<boolean> => {
      try {
        setError(null);
        await todoAPI.deleteTimeEntry(todoId, entryId);
        // Refetch todos para actualizar el tiempo total
        await fetchTodos(filters);
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al eliminar entrada de tiempo manual"
        );
        console.error("Error deleting manual time entry:", err);
        return false;
      }
    },
    [filters, fetchTodos]
  );

  // Aplicar filtros
  const applyFilters = useCallback(
    (newFilters: TodoFilters) => {
      setFilters(newFilters);
      fetchTodos(newFilters);
    },
    [fetchTodos]
  );

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    fetchTodos(emptyFilters);
  }, [fetchTodos]);

  // Obtener TODOs vencidos
  const getOverdueTodos = useCallback((): Todo[] => {
    const today = new Date().toISOString().split("T")[0];
    return todos.filter(
      (todo) => !todo.isCompleted && todo.dueDate && todo.dueDate < today
    );
  }, [todos]);

  // Obtener TODOs por prioridad
  const getTodosByPriority = useCallback(
    (priorityId: string): Todo[] => {
      return todos.filter((todo) => todo.priorityId === priorityId);
    },
    [todos]
  );

  // Cargar datos iniciales
  useEffect(() => {
    fetchTodos();
    fetchPriorities();
  }, []);

  return {
    // Estado
    todos,
    priorities,
    loading,
    error,
    filters,

    // Acciones
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    reactivateTodo,

    // Timer control
    startTimer,
    pauseTimer,

    // Manual time control
    addManualTimeEntry,
    getManualTimeEntries,
    deleteManualTimeEntry,

    // Filtros
    applyFilters,
    clearFilters,

    // Utilidades
    getOverdueTodos,
    getTodosByPriority,

    // Métricas
    totalTodos: todos.length,
    activeTodos: todos.filter((t) => !t.isCompleted).length,
    completedTodos: todos.filter((t) => t.isCompleted).length,
    overdueTodos: getOverdueTodos().length,
  };
};

export const useTodoMetrics = () => {
  const [metrics, setMetrics] = useState<TodoMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metricsData = await todoAPI.getTodoMetrics();
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar métricas");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};
