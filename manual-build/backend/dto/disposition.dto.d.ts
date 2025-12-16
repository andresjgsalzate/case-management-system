export declare class CreateDispositionDto {
    date: string;
    caseNumber: string;
    caseId?: string;
    scriptName: string;
    svnRevisionNumber?: string;
    applicationId: string;
    observations?: string;
}
export declare class UpdateDispositionDto {
    date?: string;
    caseNumber?: string;
    caseId?: string;
    scriptName?: string;
    svnRevisionNumber?: string;
    applicationId?: string;
    observations?: string;
}
export declare class DispositionFiltersDto {
    year?: number;
    month?: number;
    applicationId?: string;
    caseNumber?: string;
    userId?: string;
}
