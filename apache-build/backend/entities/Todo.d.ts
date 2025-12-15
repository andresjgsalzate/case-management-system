import { UserProfile } from "./UserProfile";
import { TodoPriority } from "./TodoPriority";
import { TodoControl } from "./TodoControl";
export declare class Todo {
    id: string;
    title: string;
    description?: string;
    priorityId: string;
    assignedUserId?: string;
    createdByUserId: string;
    dueDate?: Date;
    estimatedMinutes: number;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    priority: TodoPriority;
    assignedUser?: UserProfile;
    createdByUser: UserProfile;
    controls: TodoControl[];
    get control(): TodoControl | undefined;
}
