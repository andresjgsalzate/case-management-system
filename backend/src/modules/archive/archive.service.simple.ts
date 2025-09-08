import {
  ArchiveStatsResponseDto,
  ArchivedItemResponseDto,
} from "../../dto/archive.dto";
import { AppDataSource } from "../../config/database";
import { ArchivedTodo } from "../../entities/archive/ArchivedTodo.entity";

export class ArchiveServiceExpress {
  /**
   * Obtener estadísticas del archivo
   */
  async getArchiveStats(): Promise<ArchiveStatsResponseDto> {
    try {
      const archivedTodoRepository = AppDataSource.getRepository(ArchivedTodo);

      // Contar todos archivados
      const totalArchivedTodos = await archivedTodoRepository.count();

      // Para ahora simplificamos y solo contamos TODOs
      const totalArchivedCases = 0;
      const totalTimeMinutes = 0;

      return {
        totalArchivedCases,
        totalArchivedTodos,
        totalArchivedTimeMinutes: totalTimeMinutes,
        archivedThisMonth: 0,
        restoredThisMonth: 0,
      };
    } catch (error) {
      console.error("Error getting archive stats:", error);
      throw new Error("Error obteniendo estadísticas del archivo");
    }
  }

  /**
   * Obtener elementos archivados con filtros
   */
  async getArchivedItems(filters: {
    type?: "all" | "cases" | "todos";
    showRestored?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ArchivedItemResponseDto[]> {
    try {
      const {
        type = "all",
        showRestored = false,
        page = 1,
        limit = 50,
      } = filters;
      const offset = (page - 1) * limit;
      const items: ArchivedItemResponseDto[] = [];

      if (type === "all" || type === "todos") {
        const archivedTodoRepository =
          AppDataSource.getRepository(ArchivedTodo);
        const queryBuilder =
          archivedTodoRepository.createQueryBuilder("archivedTodo");

        if (!showRestored) {
          queryBuilder.where("archivedTodo.isRestored = :isRestored", {
            isRestored: false,
          });
        }

        const archivedTodos = await queryBuilder
          .orderBy("archivedTodo.archivedAt", "DESC")
          .skip(offset)
          .take(limit)
          .getMany();

        const todoItems: ArchivedItemResponseDto[] = archivedTodos.map(
          (todo) => ({
            id: todo.id,
            itemType: "todo" as const,
            originalId: todo.originalTodoId,
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            archivedAt: todo.archivedAt.toISOString(),
            archivedBy: todo.archivedBy,
            archivedReason: todo.archiveReason,
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString(),
            isRestored: todo.isRestored,
            totalTimeMinutes: todo.totalTimeMinutes,
          })
        );

        items.push(...todoItems);
      }

      // Para casos archivados, por ahora retornamos array vacío
      // TODO: Implementar lógica para casos cuando sea necesario

      return items;
    } catch (error) {
      console.error("Error getting archived items:", error);
      throw new Error("Error obteniendo elementos archivados");
    }
  }
}
