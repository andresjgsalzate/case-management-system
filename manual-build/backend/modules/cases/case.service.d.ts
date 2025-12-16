import { CreateCaseDto, UpdateCaseDto, CaseFiltersDto, CaseResponse } from "./case.dto";
export declare class CaseService {
    private caseRepository;
    private userRepository;
    private originRepository;
    private applicationRepository;
    constructor();
    createCase(createCaseDto: CreateCaseDto, userId: string): Promise<CaseResponse>;
    getCases(filters: CaseFiltersDto, userId?: string): Promise<CaseResponse[]>;
    getCaseById(id: string, userId?: string): Promise<CaseResponse>;
    updateCase(id: string, updateCaseDto: UpdateCaseDto, userId: string): Promise<CaseResponse>;
    deleteCase(id: string, userId: string): Promise<void>;
    getCaseStats(): Promise<{
        total: number;
        porClasificacion: Record<string, number>;
        porEstado: Record<string, number>;
    }>;
    private applyFilters;
    private mapCaseToResponse;
}
