import { CaseControl } from "./CaseControl";
import { UserProfile } from "./UserProfile";
export declare class TimeEntry {
    id: string;
    caseControlId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    caseControl: CaseControl;
    user: UserProfile;
}
