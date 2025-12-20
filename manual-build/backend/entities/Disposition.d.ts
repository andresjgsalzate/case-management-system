import { Application } from "./Application";
import { UserProfile } from "./UserProfile";
import { Case } from "./Case";
export declare class Disposition {
    id: string;
    date: string;
    caseId?: string;
    caseNumber: string;
    scriptName: string;
    svnRevisionNumber?: string;
    applicationId?: string;
    applicationName: string;
    observations: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    application?: Application;
    user?: UserProfile;
    case?: Case;
}
