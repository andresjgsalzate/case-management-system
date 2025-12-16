import { DataSource } from "typeorm";
import { DocumentType } from "../entities/DocumentType";
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from "../dto/document-type.dto";
export declare class DocumentTypeService {
    private documentTypeRepository;
    constructor(dataSource?: DataSource);
    create(createDto: CreateDocumentTypeDto, userId: string): Promise<DocumentType>;
    findAll(activeOnly?: boolean): Promise<DocumentType[]>;
    findOne(id: string): Promise<DocumentType>;
    findByCode(code: string): Promise<DocumentType | null>;
    update(id: string, updateDto: UpdateDocumentTypeDto): Promise<DocumentType>;
    toggleActive(id: string): Promise<DocumentType>;
    remove(id: string): Promise<void>;
    reorderTypes(typeOrders: {
        id: string;
        displayOrder: number;
    }[]): Promise<void>;
    getStats(id: string): Promise<{
        totalDocuments: number;
        publishedDocuments: number;
        archivedDocuments: number;
        templateDocuments: number;
    }>;
}
