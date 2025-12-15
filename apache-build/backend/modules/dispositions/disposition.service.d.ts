import { Disposition } from "../../entities/Disposition";
import { CreateDispositionDto, UpdateDispositionDto, DispositionFiltersDto } from "../../dto/disposition.dto";
export declare class DispositionService {
    private dispositionRepository;
    private caseRepository;
    private applicationRepository;
    private userRepository;
    constructor();
    create(createDispositionDto: CreateDispositionDto, userId: string): Promise<Disposition>;
    findAll(filters?: DispositionFiltersDto, userId?: string): Promise<Disposition[]>;
    findOne(id: string): Promise<Disposition | null>;
    update(id: string, updateDispositionDto: UpdateDispositionDto): Promise<Disposition>;
    remove(id: string): Promise<void>;
    getAvailableYears(): Promise<number[]>;
    getMonthlyStats(year: number, month: number): Promise<any>;
}
