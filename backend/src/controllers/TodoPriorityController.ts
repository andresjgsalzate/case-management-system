import { Request, Response } from "express";
import AppDataSource from "../data-source";
import { TodoPriority } from "../entities/TodoPriority";
import { Repository } from "typeorm";
import { logger } from "../utils/logger";

export class TodoPriorityController {
  private async getTodoPriorityRepository(): Promise<Repository<TodoPriority>> {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
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

      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const queryBuilder = todoPriorityRepository
        .createQueryBuilder("priority")
        .orderBy(`priority.${sortBy}`, sortOrder as "ASC" | "DESC");

      // Filtro por búsqueda
      if (search) {
        queryBuilder.where(
          "LOWER(priority.name) LIKE LOWER(:search) OR LOWER(priority.description) LIKE LOWER(:search)",
          {
            search: `%${search}%`,
          }
        );
      }

      // Filtro por estado activo
      if (isActive !== undefined) {
        const isActiveBoolean = isActive === "true";
        if (search) {
          queryBuilder.andWhere("priority.isActive = :isActive", {
            isActive: isActiveBoolean,
          });
        } else {
          queryBuilder.where("priority.isActive = :isActive", {
            isActive: isActiveBoolean,
          });
        }
      }

      // Ejecutar consulta con paginación
      const [priorities, totalItems] = await queryBuilder
        .skip(offset)
        .take(limitNumber)
        .getManyAndCount();

      const totalPages = Math.ceil(totalItems / limitNumber);

      res.status(200).json({
        success: true,
        message: "Prioridades obtenidas exitosamente",
        data: {
          priorities,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalItems,
            itemsPerPage: limitNumber,
          },
        },
      });
    } catch (error) {
      logger.error("Error al obtener prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
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
      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const stats = await todoPriorityRepository
        .createQueryBuilder("priority")
        .select([
          "COUNT(*) as total",
          "COUNT(CASE WHEN priority.isActive = true THEN 1 END) as active",
          "COUNT(CASE WHEN priority.isActive = false THEN 1 END) as inactive",
        ])
        .getRawOne();

      res.status(200).json({
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: {
          total: parseInt(stats.total),
          active: parseInt(stats.active),
          inactive: parseInt(stats.inactive),
        },
      });
    } catch (error) {
      logger.error("Error al obtener estadísticas de prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route GET /api/admin/todo-priorities/:id
   * @desc Obtener una prioridad por ID
   * @access Privado
   */
  async getPriorityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const priority = await todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Prioridad obtenida exitosamente",
        data: priority,
      });
    } catch (error) {
      logger.error("Error al obtener prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route POST /api/admin/todo-priorities
   * @desc Crear una nueva prioridad
   * @access Privado
   */
  async createPriority(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color, level } = req.body;

      // Validaciones básicas
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "El nombre es requerido y debe ser una cadena válida",
        });
        return;
      }

      if (!level || typeof level !== "number" || level < 1 || level > 10) {
        res.status(400).json({
          success: false,
          message: "El nivel es requerido y debe estar entre 1 y 10",
        });
        return;
      }

      const todoPriorityRepository = await this.getTodoPriorityRepository();

      // Verificar que no exista una prioridad con el mismo nombre
      const existingPriority = await todoPriorityRepository.findOne({
        where: { name: name.trim() },
      });

      if (existingPriority) {
        res.status(409).json({
          success: false,
          message: "Ya existe una prioridad con ese nombre",
        });
        return;
      }

      // Crear nueva prioridad
      const priority = todoPriorityRepository.create({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6B7280",
        level,
        displayOrder: level, // Por defecto, usar el mismo nivel como orden de visualización
      });

      const savedPriority = await todoPriorityRepository.save(priority);

      res.status(201).json({
        success: true,
        message: "Prioridad creada exitosamente",
        data: savedPriority,
      });
    } catch (error) {
      logger.error("Error al crear prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route PUT /api/admin/todo-priorities/:id
   * @desc Actualizar una prioridad existente
   * @access Privado
   */
  async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color, level } = req.body;

      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const priority = await todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      // Validar nombre si se proporciona
      if (name !== undefined) {
        if (typeof name !== "string" || name.trim().length === 0) {
          res.status(400).json({
            success: false,
            message: "El nombre debe ser una cadena válida",
          });
          return;
        }

        // Verificar que no exista otra prioridad con el mismo nombre
        const existingName = await todoPriorityRepository.findOne({
          where: { name: name.trim() },
        });

        if (existingName && existingName.id !== id) {
          res.status(409).json({
            success: false,
            message: "Ya existe una prioridad con ese nombre",
          });
          return;
        }

        priority.name = name.trim();
      }

      // Validar nivel si se proporciona
      if (level !== undefined) {
        if (typeof level !== "number" || level < 1 || level > 10) {
          res.status(400).json({
            success: false,
            message: "El nivel debe estar entre 1 y 10",
          });
          return;
        }

        // Verificar que no exista otra prioridad con el mismo nivel
        const existingLevel = await todoPriorityRepository.findOne({
          where: { level },
        });

        if (existingLevel && existingLevel.id !== id) {
          res.status(409).json({
            success: false,
            message: "Ya existe una prioridad con ese nivel",
          });
          return;
        }

        priority.level = level;
      }

      // Actualizar otros campos si se proporcionan
      if (description !== undefined) {
        priority.description = description?.trim() || null;
      }

      if (color !== undefined) {
        priority.color = color;
      }

      const updatedPriority = await todoPriorityRepository.save(priority);

      res.status(200).json({
        success: true,
        message: "Prioridad actualizada exitosamente",
        data: updatedPriority,
      });
    } catch (error) {
      logger.error("Error al actualizar prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route PATCH /api/admin/todo-priorities/:id/toggle
   * @desc Cambiar el estado activo/inactivo de una prioridad
   * @access Privado
   */
  async togglePriorityStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const priority = await todoPriorityRepository.findOne({
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
      const updatedPriority = await todoPriorityRepository.save(priority);

      res.status(200).json({
        success: true,
        message: `Prioridad ${
          priority.isActive ? "activada" : "desactivada"
        } exitosamente`,
        data: updatedPriority,
      });
    } catch (error) {
      logger.error("Error al cambiar estado de prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route DELETE /api/admin/todo-priorities/:id
   * @desc Eliminar una prioridad
   * @access Privado
   */
  async deletePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const todoPriorityRepository = await this.getTodoPriorityRepository();
      const priority = await todoPriorityRepository.findOne({
        where: { id },
      });

      if (!priority) {
        res.status(404).json({
          success: false,
          message: "Prioridad no encontrada",
        });
        return;
      }

      await todoPriorityRepository.remove(priority);

      res.status(200).json({
        success: true,
        message: "Prioridad eliminada exitosamente",
      });
    } catch (error) {
      logger.error("Error al eliminar prioridad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * @route POST /api/admin/todo-priorities/reorder
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

      const todoPriorityRepository = await this.getTodoPriorityRepository();

      // Actualizar el orden de visualización para cada prioridad
      for (const item of priorities) {
        if (item.id && typeof item.displayOrder === "number") {
          await todoPriorityRepository.update(item.id, {
            displayOrder: item.displayOrder,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Prioridades reordenadas exitosamente",
      });
    } catch (error) {
      logger.error("Error al reordenar prioridades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
