"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoController = void 0;
const TodoService_1 = require("../services/TodoService");
class TodoController {
    constructor() {
        this.todoService = new TodoService_1.TodoService();
    }
    validateId(id, res) {
        if (!id) {
            res.status(400).json({ error: "ID requerido" });
            return false;
        }
        return true;
    }
    async getAllTodos(req, res) {
        try {
            const filters = {
                priorityId: req.query.priorityId,
                assignedUserId: req.query.assignedUserId,
                createdByUserId: req.query.createdByUserId,
                dueDateFrom: req.query.dueDateFrom,
                dueDateTo: req.query.dueDateTo,
                search: req.query.search,
                showCompleted: req.query.showCompleted === "true"
                    ? true
                    : req.query.showCompleted === "false"
                        ? false
                        : undefined,
            };
            Object.keys(filters).forEach((key) => {
                if (filters[key] === undefined ||
                    filters[key] === "") {
                    delete filters[key];
                }
            });
            const todos = await this.todoService.getAllTodos(Object.keys(filters).length > 0 ? filters : undefined);
            res.json(todos);
        }
        catch (error) {
            console.error("Error fetching todos:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getTodoById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: "ID requerido" });
                return;
            }
            const todo = await this.todoService.getTodoById(id);
            if (!todo) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.json(todo);
        }
        catch (error) {
            console.error("Error fetching todo by id:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async createTodo(req, res) {
        try {
            const createTodoDto = req.body;
            if (!createTodoDto.title || !createTodoDto.priorityId) {
                res.status(400).json({ error: "Título y prioridad son requeridos" });
                return;
            }
            const currentUserId = req.user?.id || req.body.createdByUserId;
            if (!currentUserId) {
                res.status(401).json({ error: "Usuario no autenticado" });
                return;
            }
            const todo = await this.todoService.createTodo(createTodoDto, currentUserId);
            res.status(201).json(todo);
        }
        catch (error) {
            console.error("Error creating todo:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async updateTodo(req, res) {
        try {
            const { id } = req.params;
            if (!this.validateId(id, res))
                return;
            const updateTodoDto = req.body;
            const todo = await this.todoService.updateTodo(id, updateTodoDto);
            if (!todo) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.json(todo);
        }
        catch (error) {
            console.error("Error updating todo:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async deleteTodo(req, res) {
        try {
            const { id } = req.params;
            if (!this.validateId(id, res))
                return;
            const deleted = await this.todoService.deleteTodo(id);
            if (!deleted) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            console.error("Error deleting todo:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async completeTodo(req, res) {
        try {
            const { id } = req.params;
            if (!this.validateId(id, res))
                return;
            const todo = await this.todoService.completeTodo(id);
            if (!todo) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.json(todo);
        }
        catch (error) {
            console.error("Error completing todo:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async reactivateTodo(req, res) {
        try {
            const { id } = req.params;
            if (!this.validateId(id, res))
                return;
            const todo = await this.todoService.reactivateTodo(id);
            if (!todo) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.json(todo);
        }
        catch (error) {
            console.error("Error reactivating todo:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getTodoMetrics(req, res) {
        try {
            console.log("Starting getTodoMetrics...");
            const metrics = await this.todoService.getTodoMetrics();
            console.log("Metrics retrieved successfully:", metrics);
            res.json(metrics);
        }
        catch (error) {
            console.error("Error fetching todo metrics:", error);
            console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getTodoPriorities(req, res) {
        try {
            const priorities = await this.todoService.getAllPriorities();
            res.json(priorities);
        }
        catch (error) {
            console.error("Error fetching todo priorities:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getManualTimeEntries(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: "ID de TODO requerido" });
                return;
            }
            const entries = await this.todoService.getManualTimeEntries(id);
            res.json(entries);
        }
        catch (error) {
            console.error("Error fetching manual time entries:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async addManualTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const { description, durationMinutes, date, userId } = req.body;
            if (!id) {
                res.status(400).json({ error: "ID de TODO requerido" });
                return;
            }
            if (!description || !durationMinutes || !date || !userId) {
                res.status(400).json({
                    error: "Descripción, duración en minutos, fecha y usuario son requeridos",
                });
                return;
            }
            const entry = await this.todoService.addManualTimeEntry(id, {
                description,
                durationMinutes: parseInt(durationMinutes),
                date,
                userId,
            });
            if (!entry) {
                res.status(404).json({ error: "TODO no encontrado" });
                return;
            }
            res.status(201).json(entry);
        }
        catch (error) {
            console.error("Error adding manual time entry:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async updateManualTimeEntry(req, res) {
        try {
            const { entryId } = req.params;
            const { description, durationMinutes, date } = req.body;
            if (!entryId) {
                res.status(400).json({ error: "ID de entrada requerido" });
                return;
            }
            const entry = await this.todoService.updateManualTimeEntry(entryId, {
                description,
                durationMinutes: durationMinutes
                    ? parseInt(durationMinutes)
                    : undefined,
                date,
            });
            if (!entry) {
                res.status(404).json({ error: "Entrada de tiempo no encontrada" });
                return;
            }
            res.json(entry);
        }
        catch (error) {
            console.error("Error updating manual time entry:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async deleteManualTimeEntry(req, res) {
        try {
            const { entryId } = req.params;
            if (!entryId) {
                res.status(400).json({ error: "ID de entrada requerido" });
                return;
            }
            const deleted = await this.todoService.deleteManualTimeEntry(entryId);
            if (!deleted) {
                res.status(404).json({ error: "Entrada de tiempo no encontrada" });
                return;
            }
            res.json({ message: "Entrada de tiempo eliminada exitosamente" });
        }
        catch (error) {
            console.error("Error deleting manual time entry:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
exports.TodoController = TodoController;
