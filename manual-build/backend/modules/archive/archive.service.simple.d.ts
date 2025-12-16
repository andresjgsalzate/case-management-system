import { ArchiveStatsResponseDto, ArchivedItemResponseDto } from "../../dto/archive.dto";
export declare class ArchiveServiceExpress {
    getArchiveStats(): Promise<ArchiveStatsResponseDto>;
    getArchivedItems(filters: {
        type?: "all" | "cases" | "todos";
        showRestored?: boolean;
        page?: number;
        limit?: number;
    }): Promise<ArchivedItemResponseDto[]>;
}
