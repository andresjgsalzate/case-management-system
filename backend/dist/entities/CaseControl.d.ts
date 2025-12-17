import { Case } from "./Case";
import { UserProfile } from "./UserProfile";
import { CaseStatusControl } from "./CaseStatusControl";
import { TimeEntry } from "./TimeEntry";
import { ManualTimeEntry } from "./ManualTimeEntry";
export declare class CaseControl {
    id: string;
    caseId: string;
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
    case: Case;
    user: UserProfile;
    status: CaseStatusControl;
    timeEntries: TimeEntry[];
    manualTimeEntries: ManualTimeEntry[];
}
