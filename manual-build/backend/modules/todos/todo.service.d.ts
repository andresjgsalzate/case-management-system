import { TodoPriority } from "../../entities/TodoPriority";
import { CreateTodoDto, UpdateTodoDto, TodoResponseDto, TodoFiltersDto, TodoMetricsDto } from "../../dto/todo.dto";
export declare class TodoService {
    private todoRepository;
    private todoControlRepository;
    private todoPriorityRepository;
    constructor();
    getAllTodos(filters?: TodoFiltersDto): Promise<TodoResponseDto[]>;
    getTodoById(id: string): Promise<TodoResponseDto | null>;
    createTodo(createTodoDto: CreateTodoDto, createdByUserId: string): Promise<TodoResponseDto>;
    updateTodo(id: string, updateTodoDto: UpdateTodoDto): Promise<TodoResponseDto | null>;
    deleteTodo(id: string): Promise<boolean>;
    completeTodo(id: string): Promise<TodoResponseDto | null>;
    reactivateTodo(id: string): Promise<TodoResponseDto | null>;
    archiveTodo(id: string): Promise<TodoResponseDto | null>;
    getTodoMetrics(): Promise<TodoMetricsDto>;
    getAllPriorities(): Promise<TodoPriority[]>;
    private applyFilters;
    private mapToResponseDto;
    startTimer(todoId: string, userId: string): Promise<TodoResponseDto | null>;
    pauseTimer(todoId: string, userId: string): Promise<TodoResponseDto | null>;
    getTodoTimeEntries(todoId: string): Promise<any[]>;
    addManualTimeEntry(todoId: string, data: {
        description: string;
        durationMinutes: number;
        date: string;
        userId: string;
    }): Promise<any | null>;
    getManualTimeEntries(todoId: string): Promise<any[]>;
    deleteTimeEntry(entryId: string): Promise<boolean>;
    deleteManualTimeEntry(entryId: string): Promise<boolean>;
}
