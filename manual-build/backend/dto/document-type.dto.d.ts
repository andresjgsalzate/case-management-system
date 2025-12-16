export declare class CreateDocumentTypeDto {
    code: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    displayOrder?: number;
}
export declare class UpdateDocumentTypeDto {
    code?: string;
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    displayOrder?: number;
}
