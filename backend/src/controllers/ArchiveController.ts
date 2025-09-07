import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../middleware/JwtAuthGuard";
import { PermissionGuard } from "../middleware/PermissionGuard";
import { RequirePermissions } from "../middleware/RequirePermissions";
import { GetUser } from "../middleware/GetUser";
import { ArchiveService } from "../services/ArchiveService";
import {
  CreateArchivedCaseDto,
  CreateArchivedTodoDto,
  RestoreArchivedItemDto,
  DeleteArchivedItemDto,
  ArchiveFiltersDto,
  ArchiveStatsDto,
  ArchivedCaseResponseDto,
  ArchivedTodoResponseDto,
  ArchivedItemResponseDto,
} from "../dto/archive.dto";

@Controller("archive")
@UseGuards(JwtAuthGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  // =============================================
  // ENDPOINTS PARA ESTADÍSTICAS
  // =============================================

  /**
   * Obtener estadísticas del archivo
   */
  @Get("stats")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.stats")
  async getArchiveStats(
    @GetUser("id") userId: string
  ): Promise<ArchiveStatsDto> {
    return this.archiveService.getArchiveStats(userId);
  }

  // =============================================
  // ENDPOINTS PARA CASOS ARCHIVADOS
  // =============================================

  /**
   * Obtener casos archivados con filtros
   */
  @Get("cases")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async getArchivedCases(
    @GetUser("id") userId: string,
    @Query() filters: ArchiveFiltersDto
  ): Promise<ArchivedCaseResponseDto[]> {
    return this.archiveService.getArchivedCases(filters, userId);
  }

  /**
   * Archivar un caso
   */
  @Post("cases")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.create")
  @HttpCode(HttpStatus.CREATED)
  async archiveCase(
    @Body() createDto: CreateArchivedCaseDto,
    @GetUser("id") userId: string
  ): Promise<ArchivedCaseResponseDto> {
    return this.archiveService.archiveCase(createDto, userId);
  }

  /**
   * Obtener un caso archivado por ID
   */
  @Get("cases/:id")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async getArchivedCase(
    @Param("id") id: string,
    @GetUser("id") userId: string
  ): Promise<ArchivedCaseResponseDto> {
    const cases = await this.archiveService.getArchivedCases(
      {
        limit: 1,
        offset: 0,
      },
      userId
    );
    const caseFound = cases.find((c) => c.id === id);

    if (!caseFound) {
      throw new Error("Caso archivado no encontrado");
    }

    return caseFound;
  }

  /**
   * Restaurar un caso archivado
   */
  @Put("cases/:id/restore")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.restore")
  async restoreCase(
    @Param("id") id: string,
    @Body() restoreDto: RestoreArchivedItemDto,
    @GetUser("id") userId: string
  ): Promise<ArchivedCaseResponseDto> {
    return this.archiveService.restoreCase(id, restoreDto, userId);
  }

  /**
   * Eliminar permanentemente un caso archivado
   */
  @Delete("cases/:id")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArchivedCase(
    @Param("id") id: string,
    @Body() deleteDto: DeleteArchivedItemDto,
    @GetUser("id") userId: string
  ): Promise<void> {
    return this.archiveService.deleteArchivedCase(id, deleteDto, userId);
  }

  // =============================================
  // ENDPOINTS PARA TODOS ARCHIVADOS
  // =============================================

  /**
   * Obtener TODOs archivados con filtros
   */
  @Get("todos")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async getArchivedTodos(
    @GetUser("id") userId: string,
    @Query() filters: ArchiveFiltersDto
  ): Promise<ArchivedTodoResponseDto[]> {
    return this.archiveService.getArchivedTodos(filters, userId);
  }

  /**
   * Archivar un TODO
   */
  @Post("todos")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.create")
  @HttpCode(HttpStatus.CREATED)
  async archiveTodo(
    @Body() createDto: CreateArchivedTodoDto,
    @GetUser("id") userId: string
  ): Promise<ArchivedTodoResponseDto> {
    return this.archiveService.archiveTodo(createDto, userId);
  }

  /**
   * Obtener un TODO archivado por ID
   */
  @Get("todos/:id")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async getArchivedTodo(
    @Param("id") id: string,
    @GetUser("id") userId: string
  ): Promise<ArchivedTodoResponseDto> {
    const todos = await this.archiveService.getArchivedTodos(
      {
        limit: 1,
        offset: 0,
      },
      userId
    );
    const todoFound = todos.find((t) => t.id === id);

    if (!todoFound) {
      throw new Error("TODO archivado no encontrado");
    }

    return todoFound;
  }

  /**
   * Restaurar un TODO archivado
   */
  @Put("todos/:id/restore")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.restore")
  async restoreTodo(
    @Param("id") id: string,
    @Body() restoreDto: RestoreArchivedItemDto,
    @GetUser("id") userId: string
  ): Promise<ArchivedTodoResponseDto> {
    return this.archiveService.restoreTodo(id, restoreDto, userId);
  }

  /**
   * Eliminar permanentemente un TODO archivado
   */
  @Delete("todos/:id")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArchivedTodo(
    @Param("id") id: string,
    @Body() deleteDto: DeleteArchivedItemDto,
    @GetUser("id") userId: string
  ): Promise<void> {
    return this.archiveService.deleteArchivedTodo(id, deleteDto, userId);
  }

  // =============================================
  // ENDPOINTS GENERALES
  // =============================================

  /**
   * Obtener todos los elementos archivados (casos y TODOs combinados)
   */
  @Get("items")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async getArchivedItems(
    @GetUser("id") userId: string,
    @Query() filters: ArchiveFiltersDto
  ): Promise<ArchivedItemResponseDto[]> {
    return this.archiveService.getArchivedItems(filters, userId);
  }

  /**
   * Buscar en elementos archivados
   */
  @Get("search")
  @UseGuards(PermissionGuard)
  @RequirePermissions("archive.view")
  async searchArchivedItems(
    @GetUser("id") userId: string,
    @Query("q") searchTerm: string,
    @Query("type") type?: "cases" | "todos" | "all",
    @Query("limit") limit?: number
  ): Promise<ArchivedItemResponseDto[]> {
    const filters: ArchiveFiltersDto = {
      search: searchTerm,
      type: type || "all",
      limit: limit || 50,
    };

    return this.archiveService.getArchivedItems(filters, userId);
  }
}
