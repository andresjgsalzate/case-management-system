import { TodoControl } from "./TodoControl";
import { UserProfile } from "./UserProfile";
export declare class TodoTimeEntry {
    id: string;
    todoControlId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes?: number;
    entryType: "automatic" | "manual";
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    todoControl: TodoControl;
    user: UserProfile;
}
