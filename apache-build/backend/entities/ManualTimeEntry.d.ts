import { CaseControl } from "./CaseControl";
import { UserProfile } from "./UserProfile";
export declare class ManualTimeEntry {
    id: string;
    caseControlId: string;
    userId: string;
    date: string;
    durationMinutes: number;
    description: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    caseControl: CaseControl;
    user: UserProfile;
    creator: UserProfile;
}
