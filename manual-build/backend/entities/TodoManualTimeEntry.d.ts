import { TodoControl } from "./TodoControl";
import { UserProfile } from "./UserProfile";
export declare class TodoManualTimeEntry {
    id: string;
    todoControlId: string;
    userId: string;
    date: Date;
    durationMinutes: number;
    description: string;
    createdBy: string;
    createdAt: Date;
    todoControl: TodoControl;
    user: UserProfile;
    creator: UserProfile;
}
