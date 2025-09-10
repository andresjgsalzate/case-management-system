import { Repository, DataSource } from "typeorm";
import { DocumentType } from "../entities/DocumentType";
import { AppDataSource } from "../config/database";
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from "../dto/document-type.dto";

export class DocumentTypeService {
  private documentTypeRepository: Repository<DocumentType>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.documentTypeRepository = ds.getRepository(DocumentType);
  }

  async create(
    createDto: CreateDocumentTypeDto,
    userId: string
  ): Promise<DocumentType> {
    // Verificar que el código no exista
    const existing = await this.documentTypeRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new Error(
        `Ya existe un tipo de documento con el código '${createDto.code}'`
      );
    }

    const documentType = this.documentTypeRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.documentTypeRepository.save(documentType);
  }

  async findAll(activeOnly: boolean = false): Promise<DocumentType[]> {
    const whereCondition = activeOnly ? { isActive: true } : {};

    return this.documentTypeRepository.find({
      where: whereCondition,
      order: { displayOrder: "ASC", name: "ASC" },
      relations: ["createdByUser"],
    });
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
      relations: ["createdByUser", "documents"],
    });

    if (!documentType) {
      throw new Error(`Tipo de documento con ID ${id} no encontrado`);
    }

    return documentType;
  }

  async findByCode(code: string): Promise<DocumentType | null> {
    return this.documentTypeRepository.findOne({
      where: { code },
      relations: ["createdByUser"],
    });
  }

  async update(
    id: string,
    updateDto: UpdateDocumentTypeDto
  ): Promise<DocumentType> {
    const documentType = await this.findOne(id);

    // Si se está cambiando el código, verificar que no exista
    if (updateDto.code && updateDto.code !== documentType.code) {
      const existing = await this.documentTypeRepository.findOne({
        where: { code: updateDto.code },
      });

      if (existing) {
        throw new Error(
          `Ya existe un tipo de documento con el código '${updateDto.code}'`
        );
      }
    }

    Object.assign(documentType, updateDto);
    return this.documentTypeRepository.save(documentType);
  }

  async toggleActive(id: string): Promise<DocumentType> {
    const documentType = await this.findOne(id);
    documentType.isActive = !documentType.isActive;
    return this.documentTypeRepository.save(documentType);
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);

    // Verificar que no tenga documentos asociados
    const documentsCount = await this.documentTypeRepository
      .createQueryBuilder("dt")
      .leftJoin("dt.documents", "doc")
      .where("dt.id = :id", { id })
      .andWhere("doc.isArchived = false")
      .getCount();

    if (documentsCount > 0) {
      throw new Error(
        "No se puede eliminar un tipo de documento que tiene documentos activos asociados"
      );
    }

    await this.documentTypeRepository.remove(documentType);
  }

  async reorderTypes(
    typeOrders: { id: string; displayOrder: number }[]
  ): Promise<void> {
    for (const typeOrder of typeOrders) {
      await this.documentTypeRepository.update(
        { id: typeOrder.id },
        { displayOrder: typeOrder.displayOrder }
      );
    }
  }

  async getStats(id: string): Promise<{
    totalDocuments: number;
    publishedDocuments: number;
    archivedDocuments: number;
    templateDocuments: number;
  }> {
    const stats = await this.documentTypeRepository
      .createQueryBuilder("dt")
      .leftJoin("dt.documents", "doc")
      .where("dt.id = :id", { id })
      .select([
        "COUNT(doc.id) as totalDocuments",
        "COUNT(CASE WHEN doc.isPublished = true THEN 1 END) as publishedDocuments",
        "COUNT(CASE WHEN doc.isArchived = true THEN 1 END) as archivedDocuments",
        "COUNT(CASE WHEN doc.isTemplate = true THEN 1 END) as templateDocuments",
      ])
      .groupBy("dt.id")
      .getRawOne();

    return {
      totalDocuments: parseInt(stats?.totalDocuments || "0"),
      publishedDocuments: parseInt(stats?.publishedDocuments || "0"),
      archivedDocuments: parseInt(stats?.archivedDocuments || "0"),
      templateDocuments: parseInt(stats?.templateDocuments || "0"),
    };
  }
}
