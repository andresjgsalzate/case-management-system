import { Todo } from "./Todo";
import { UserProfile } from "./UserProfile";
import { CaseStatusControl } from "./CaseStatusControl";
import { TodoTimeEntry } from "./TodoTimeEntry";
import { TodoManualTimeEntry } from "./TodoManualTimeEntry";
export declare class TodoControl {
    id: string;
    todoId: string;
    userId: string;
    statusId: string;
    totalTimeMinutes: number;
    timerStartAt?: Date;
    isTimerActive: boolean;
    assignedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    todo: Todo;
    user: UserProfile;
    status: CaseStatusControl;
    timeEntries: TodoTimeEntry[];
    manualTimeEntries: TodoManualTimeEntry[];
}
