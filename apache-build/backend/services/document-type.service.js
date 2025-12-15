"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypeService = void 0;
const DocumentType_1 = require("../entities/DocumentType");
const database_1 = require("../config/database");
class DocumentTypeService {
    constructor(dataSource) {
        const ds = dataSource || database_1.AppDataSource;
        this.documentTypeRepository = ds.getRepository(DocumentType_1.DocumentType);
    }
    async create(createDto, userId) {
        const existing = await this.documentTypeRepository.findOne({
            where: { code: createDto.code },
        });
        if (existing) {
            throw new Error(`Ya existe un tipo de documento con el código '${createDto.code}'`);
        }
        const documentType = this.documentTypeRepository.create({
            ...createDto,
            createdBy: userId,
        });
        return this.documentTypeRepository.save(documentType);
    }
    async findAll(activeOnly = false) {
        const whereCondition = activeOnly ? { isActive: true } : {};
        return this.documentTypeRepository.find({
            where: whereCondition,
            order: { displayOrder: "ASC", name: "ASC" },
            relations: ["createdByUser"],
        });
    }
    async findOne(id) {
        const documentType = await this.documentTypeRepository.findOne({
            where: { id },
            relations: ["createdByUser", "documents"],
        });
        if (!documentType) {
            throw new Error(`Tipo de documento con ID ${id} no encontrado`);
        }
        return documentType;
    }
    async findByCode(code) {
        return this.documentTypeRepository.findOne({
            where: { code },
            relations: ["createdByUser"],
        });
    }
    async update(id, updateDto) {
        const documentType = await this.findOne(id);
        if (updateDto.code && updateDto.code !== documentType.code) {
            const existing = await this.documentTypeRepository.findOne({
                where: { code: updateDto.code },
            });
            if (existing) {
                throw new Error(`Ya existe un tipo de documento con el código '${updateDto.code}'`);
            }
        }
        Object.assign(documentType, updateDto);
        return this.documentTypeRepository.save(documentType);
    }
    async toggleActive(id) {
        const documentType = await this.findOne(id);
        documentType.isActive = !documentType.isActive;
        return this.documentTypeRepository.save(documentType);
    }
    async remove(id) {
        const documentType = await this.findOne(id);
        const documentsCount = await this.documentTypeRepository
            .createQueryBuilder("dt")
            .leftJoin("dt.documents", "doc")
            .where("dt.id = :id", { id })
            .andWhere("doc.isArchived = false")
            .getCount();
        if (documentsCount > 0) {
            throw new Error("No se puede eliminar un tipo de documento que tiene documentos activos asociados");
        }
        await this.documentTypeRepository.remove(documentType);
    }
    async reorderTypes(typeOrders) {
        for (const typeOrder of typeOrders) {
            await this.documentTypeRepository.update({ id: typeOrder.id }, { displayOrder: typeOrder.displayOrder });
        }
    }
    async getStats(id) {
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
exports.DocumentTypeService = DocumentTypeService;
