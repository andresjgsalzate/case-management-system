import { Request, Response } from "express";
import AppDataSource from "../data-source";
import { TodoPriority } from "../entities/TodoPriority";
import { Repository } from "typeorm";
import { logger } from "../utils/logger";

export class TodoPriorityController {
  private getTodoPriorityRepository(): Repository<TodoPriority> {
    return AppDataSource.getRepository(TodoPriority);
  }

  /**
   * @route GET /api/admin/todo-priorities
   * @desc Obtener todas las prioridades con paginación y filtros
   * @access Privado
   */
  async getAllPriorities(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "level",
        sortOrder = "ASC",
        search = "",
        isActive,
      } = req.query;

      const pageNumber = Math.max(1, parseInt(page as string));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string)));
      const offset = (pageNumber - 1) * limitNumber;

      const todoPriorityRepository = this.getTodoPriorityRepository();
      const queryBuilder = todoPriorityRepository
        .createQueryBuilder("priority")
        .orderBy(`priority.${sortBy}`, sortOrder as "ASC" | "DESC");

      // Filtro por búsqueda
      if (search) {
        queryBuilder.where(
          "(priority.name ILIKE :search OR priority.description ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Filtro por estado activo
      if (isActive !== undefined) {
        queryBuilder.andWhere("priority.isActive = :isActive", {
          isActive: isActive === "true",
        });
      }

      // Ejecutar consulta con paginación
      const [priorities, total] = await queryBuilder
        .skip(offset)
        .take(limitNumber)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        success: true,
        data: {
          priorities,
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
        message: "Prioridades obtenidas correctamente",
      });
    } catch (error) {
      logger.error("Error al obtener prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route GET /api/admin/todo-priorities/stats
   * @desc Obtener estadísticas de las prioridades
   * @access Privado
   */
  async getPriorityStats(req: Request, res: Response): Promise<void> {
    try {
      const todoPriorityRepository = this.getTodoPriorityRepository();
      const stats = await todoPriorityRepository
        .createQueryBuilder("priority")
        .select([
          "COUNT(*) as total",
          "COUNT(CASE WHEN priority.isActive = true THEN 1 END) as active",
          "COUNT(CASE WHEN priority.isActive = false THEN 1 END) as inactive",
        ])
        .getRawOne();

      res.json({
        success: true,
        data: {
          total: parseInt(stats.total),
          active: parseInt(stats.active),
          inactive: parseInt(stats.inactive),
        },
        message: "Estadísticas obtenidas correctamente",
      });
    } catch (error) {
      logger.error("Error al obtener estadísticas de prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route GET /api/admin/todo-priorities/:id
   * @desc Obtener prioridad por ID
   * @access Privado
   */
  async getPriorityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const priority = await this.todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      res.json({
        success: true,
        data: priority,
        message: "Prioridad obtenida correctamente",
      });
    } catch (error) {
      logger.error("Error al obtener prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route POST /api/admin/todo-priorities
   * @desc Crear nueva prioridad
   * @access Privado
   */
  async createPriority(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color, level, displayOrder } = req.body;

      // Validaciones básicas
      if (!name || !level) {
        res.status(400).json({
          success: false,
          message: "Nombre y nivel son campos obligatorios",
        });
        return;
      }

      // Verificar si ya existe una prioridad con ese nombre o nivel
      const existingPriority = await this.todoPriorityRepository.findOne({
        where: [{ name }, { level }],
      });

      if (existingPriority) {
        res.status(400).json({
          success: false,
          message:
            existingPriority.name === name
              ? "Ya existe una prioridad con ese nombre"
              : "Ya existe una prioridad con ese nivel",
        });
        return;
      }

      const priority = this.todoPriorityRepository.create({
        name,
        description,
        color: color || "#6B7280",
        level,
        displayOrder: displayOrder || 0,
        isActive: true,
      });

      const savedPriority = await this.todoPriorityRepository.save(priority);

      res.status(201).json({
        success: true,
        data: savedPriority,
        message: "Prioridad creada correctamente",
      });
    } catch (error) {
      logger.error("Error al crear prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route PUT /api/admin/todo-priorities/:id
   * @desc Actualizar prioridad
   * @access Privado
   */
  async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color, level, displayOrder } = req.body;

      const priority = await this.todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      // Verificar conflictos con nombre o nivel (excluyendo el actual)
      if (name && name !== priority.name) {
        const existingName = await this.todoPriorityRepository.findOne({
          where: { name },
        });
        if (existingName) {
          res.status(400).json({
            success: false,
            message: "Ya existe una prioridad con ese nombre",
          });
          return;
        }
      }

      if (level && level !== priority.level) {
        const existingLevel = await this.todoPriorityRepository.findOne({
          where: { level },
        });
        if (existingLevel) {
          res.status(400).json({
            success: false,
            message: "Ya existe una prioridad con ese nivel",
          });
          return;
        }
      }

      // Actualizar campos
      if (name) priority.name = name;
      if (description !== undefined) priority.description = description;
      if (color) priority.color = color;
      if (level) priority.level = level;
      if (displayOrder !== undefined) priority.displayOrder = displayOrder;

      const updatedPriority = await this.todoPriorityRepository.save(priority);

      res.json({
        success: true,
        data: updatedPriority,
        message: "Prioridad actualizada correctamente",
      });
    } catch (error) {
      logger.error("Error al actualizar prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route PUT /api/admin/todo-priorities/:id/toggle
   * @desc Alternar estado activo/inactivo de la prioridad
   * @access Privado
   */
  async togglePriorityStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const priority = await this.todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      priority.isActive = !priority.isActive;
      const updatedPriority = await this.todoPriorityRepository.save(priority);

      res.json({
        success: true,
        data: updatedPriority,
        message: `Prioridad ${
          updatedPriority.isActive ? "activada" : "desactivada"
        } correctamente`,
      });
    } catch (error) {
      logger.error("Error al cambiar estado de prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route DELETE /api/admin/todo-priorities/:id
   * @desc Eliminar prioridad
   * @access Privado
   */
  async deletePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const priority = await this.todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      await this.todoPriorityRepository.remove(priority);

      res.json({
        success: true,
        message: "Prioridad eliminada correctamente",
      });
    } catch (error) {
      logger.error("Error al eliminar prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  /**
   * @route PUT /api/admin/todo-priorities/reorder
   * @desc Reordenar prioridades
   * @access Privado
   */
  async reorderPriorities(req: Request, res: Response): Promise<void> {
    try {
      const { priorities } = req.body;

      if (!Array.isArray(priorities)) {
        res.status(400).json({
          success: false,
          message: "Se requiere un array de prioridades",
        });
        return;
      }

      // Actualizar el orden de cada prioridad
      for (const item of priorities) {
        await this.todoPriorityRepository.update(item.id, {
          displayOrder: item.displayOrder,
        });
      }

      res.json({
        success: true,
        message: "Orden de prioridades actualizado correctamente",
      });
    } catch (error) {
      logger.error("Error al reordenar prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }
}
