import { Request, Response } from "express";
import { TodoService } from "./todo.service";
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoFiltersDto,
} from "../../dto/todo.dto";

// Función para validar UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class TodoController {
  private todoService: TodoService;

  constructor() {
    this.todoService = new TodoService();
  }

  async getAllTodos(req: Request, res: Response): Promise<void> {
    try {
      console.log("TodoController.getAllTodos - Starting...");

      // Test simple primero
      console.log("Testing service instantiation...");
      if (!this.todoService) {
        console.error("TodoService is not instantiated!");
        res.status(500).json({ error: "Service not available" });
        return;
      }

      console.log("Service instantiated successfully, calling getAllTodos...");

      const filters: TodoFiltersDto = {
        priorityId: req.query.priorityId as string,
        assignedUserId: req.query.assignedUserId as string,
        createdByUserId: req.query.createdByUserId as string,
        dueDateFrom: req.query.dueDateFrom as string,
        dueDateTo: req.query.dueDateTo as string,
        search: req.query.search as string,
        showCompleted:
          req.query.showCompleted === "true"
            ? true
            : req.query.showCompleted === "false"
            ? false
            : undefined,
      };

      // Limpiar filtros vacíos
      Object.keys(filters).forEach((key) => {
        if (
          filters[key as keyof TodoFiltersDto] === undefined ||
          filters[key as keyof TodoFiltersDto] === ""
        ) {
          delete filters[key as keyof TodoFiltersDto];
        }
      });

      const todos = await this.todoService.getAllTodos(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json({
        success: true,
        data: todos,
      });
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Todo ID is required",
        });
        return;
      }

      const todo = await this.todoService.getTodoById(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          message: "Todo not found",
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error getting todo by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const createTodoDto: CreateTodoDto = req.body;

      // Validaciones básicas
      if (!createTodoDto.title || !createTodoDto.priorityId) {
        res.status(400).json({ error: "Título y prioridad son requeridos" });
        return;
      }

      // Obtener el usuario actual (debería venir del middleware de autenticación)
      const currentUserId = req.user?.id || req.body.createdByUserId;
      if (!currentUserId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const todo = await this.todoService.createTodo(
        createTodoDto,
        currentUserId
      );
      res.status(201).json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateTodoDto: UpdateTodoDto = req.body;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const todo = await this.todoService.updateTodo(id, updateTodoDto);

      if (!todo) {
        res.status(404).json({
          success: false,
          message: "TODO no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const deleted = await this.todoService.deleteTodo(id);

      if (!deleted) {
        res.status(404).json({ error: "TODO no encontrado" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "TODO eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async completeTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const todo = await this.todoService.completeTodo(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          message: "TODO no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error completing todo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async reactivateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const todo = await this.todoService.reactivateTodo(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          message: "TODO no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error reactivating todo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async archiveTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const todo = await this.todoService.archiveTodo(id);

      if (!todo) {
        res.status(404).json({
          success: false,
          message: "TODO no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error("Error archiving todo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async getTodoMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.todoService.getTodoMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Error fetching todo metrics:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async getTodoPriorities(req: Request, res: Response): Promise<void> {
    try {
      const priorities = await this.todoService.getAllPriorities();
      res.json({
        success: true,
        data: priorities,
      });
    } catch (error) {
      console.error("Error fetching todo priorities:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // ============= TIMER CONTROL METHODS =============

  async startTimer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const result = await this.todoService.startTimer(id, userId);

      if (!result) {
        res
          .status(404)
          .json({ error: "TODO no encontrado o no se pudo iniciar timer" });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error starting timer:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async pauseTimer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const result = await this.todoService.pauseTimer(id, userId);

      if (!result) {
        res
          .status(404)
          .json({ error: "TODO no encontrado o no se pudo pausar timer" });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error pausing timer:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async getTodoTimeEntries(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const entries = await this.todoService.getTodoTimeEntries(id);
      res.json({
        success: true,
        data: entries,
      });
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async addManualTimeEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, durationMinutes, date, userId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de TODO requerido",
        });
        return;
      }

      if (!durationMinutes || durationMinutes <= 0) {
        res.status(400).json({
          success: false,
          message: "Duración en minutos requerida y debe ser mayor a 0",
        });
        return;
      }

      if (!description || !description.trim()) {
        res.status(400).json({
          success: false,
          message: "Descripción requerida",
        });
        return;
      }

      if (!date) {
        res.status(400).json({
          success: false,
          message: "Fecha requerida",
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "ID de usuario requerido",
        });
        return;
      }

      // Validar que userId sea un UUID válido
      if (!isValidUUID(userId)) {
        res.status(400).json({
          success: false,
          message: "ID de usuario debe ser un UUID válido",
        });
        return;
      }

      const entry = await this.todoService.addManualTimeEntry(id, {
        description,
        durationMinutes,
        date,
        userId,
      });

      if (!entry) {
        res.status(404).json({
          success: false,
          message: "TODO no encontrado",
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: entry,
        message: "Entrada de tiempo manual agregada exitosamente",
      });
    } catch (error) {
      console.error("Error adding manual time entry:", error);

      // Manejar errores específicos
      if (error instanceof Error) {
        if (
          error.message.includes("foreign key constraint") ||
          error.message.includes("violates foreign key")
        ) {
          res.status(400).json({
            success: false,
            message: "Usuario no válido o no existe",
          });
          return;
        }
        if (error.message.includes("invalid input syntax for type uuid")) {
          res.status(400).json({
            success: false,
            message: "ID de usuario no es un UUID válido",
          });
          return;
        }

        res.status(500).json({
          success: false,
          message: "Error interno del servidor",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error interno del servidor",
        });
      }
    }
  }

  async deleteTimeEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id, entryId } = req.params;

      if (!id || !entryId) {
        res.status(400).json({ error: "ID de TODO y entrada requeridos" });
        return;
      }

      const deleted = await this.todoService.deleteTimeEntry(entryId);

      if (!deleted) {
        res.status(404).json({ error: "Entrada de tiempo no encontrada" });
        return;
      }

      res.json({
        success: true,
        message: "Entrada de tiempo eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async getManualTimeEntries(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID de TODO requerido" });
        return;
      }

      const entries = await this.todoService.getManualTimeEntries(id);
      res.json({
        success: true,
        data: entries,
      });
    } catch (error) {
      console.error("Error fetching manual time entries:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async deleteManualTimeEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id, entryId } = req.params;

      if (!id || !entryId) {
        res.status(400).json({ error: "ID de TODO y entrada requeridos" });
        return;
      }

      const deleted = await this.todoService.deleteManualTimeEntry(entryId);

      if (!deleted) {
        res
          .status(404)
          .json({ error: "Entrada de tiempo manual no encontrada" });
        return;
      }

      res.json({
        success: true,
        message: "Entrada de tiempo manual eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting manual time entry:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}
