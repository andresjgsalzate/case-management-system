import { Repository, DataSource } from "typeorm";
import { KnowledgeTag, TagCategory } from "../entities/KnowledgeTag";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentTagRelation } from "../entities/KnowledgeDocumentTagRelation";
import { AppDataSource } from "../config/database";

export interface CreateKnowledgeTagDto {
  tagName: string;
  description?: string;
  color?: string;
  category?: TagCategory;
}

export interface KnowledgeTagWithUsage extends KnowledgeTag {
  usageCount: number;
}

export class KnowledgeTagService {
  private tagRepository: Repository<KnowledgeTag>;
  private relationRepository: Repository<KnowledgeDocumentTagRelation>;
  private documentRepository: Repository<KnowledgeDocument>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.tagRepository = ds.getRepository(KnowledgeTag);
    this.relationRepository = ds.getRepository(KnowledgeDocumentTagRelation);
    this.documentRepository = ds.getRepository(KnowledgeDocument);
  }

  /**
   * Crear una nueva etiqueta única
   */
  async createTag(
    createDto: CreateKnowledgeTagDto,
    userId?: string
  ): Promise<KnowledgeTag> {
    // Verificar que el nombre sea único
    const existingTag = await this.tagRepository.findOne({
      where: { tagName: createDto.tagName },
    });

    if (existingTag) {
      throw new Error(`La etiqueta "${createDto.tagName}" ya existe`);
    }

    const tag = this.tagRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return await this.tagRepository.save(tag);
  }

  /**
   * Buscar o crear etiqueta por nombre
   */
  async findOrCreateTag(
    tagName: string,
    userId?: string
  ): Promise<KnowledgeTag> {
    let tag = await this.tagRepository.findOne({
      where: { tagName },
    });

    if (!tag) {
      // Get recent tags to avoid color repetition
      const recentTags = await this.tagRepository.find({
        order: { createdAt: "DESC" },
        take: 3,
      });
      const recentColors = recentTags.map((tag) => tag.color);

      // Define color palette (same as old system)
      const TAG_COLORS = [
        "#EF4444", // Red
        "#F97316", // Orange
        "#F59E0B", // Amber
        "#10B981", // Emerald
        "#06B6D4", // Cyan
        "#3B82F6", // Blue
        "#8B5CF6", // Violet
        "#EC4899", // Pink
        "#6B7280", // Gray
        "#84CC16", // Lime
        "#F472B6", // Pink
        "#A78BFA", // Purple
      ];

      // Select available color
      const availableColors = TAG_COLORS.filter(
        (c) => !recentColors.includes(c)
      );
      const colorPool =
        availableColors.length > 0 ? availableColors : TAG_COLORS;
      const selectedColor =
        colorPool[Math.floor(Math.random() * colorPool.length)];

      // Determine category automatically
      let selectedCategory = TagCategory.CUSTOM;
      const lowerName = tagName.toLowerCase();

      if (
        ["bug", "error", "fix", "critical", "urgent"].some((k) =>
          lowerName.includes(k)
        )
      ) {
        selectedCategory = TagCategory.PRIORITY;
      } else if (
        [
          "react",
          "js",
          "css",
          "html",
          "typescript",
          "javascript",
          "vue",
          "angular",
        ].some((k) => lowerName.includes(k))
      ) {
        selectedCategory = TagCategory.TECHNOLOGY;
      } else if (
        ["backend", "frontend", "api", "database", "server", "client"].some(
          (k) => lowerName.includes(k)
        )
      ) {
        selectedCategory = TagCategory.TECHNICAL;
      } else if (
        ["user", "admin", "auth", "role", "permission"].some((k) =>
          lowerName.includes(k)
        )
      ) {
        selectedCategory = TagCategory.MODULE;
      }

      tag = await this.createTag(
        {
          tagName,
          color: selectedColor,
          category: selectedCategory,
          description: `Etiqueta creada automáticamente`,
        },
        userId
      );
    }

    return tag;
  }

  /**
   * Buscar etiqueta por nombre
   */
  async findTagByName(tagName: string): Promise<KnowledgeTagWithUsage | null> {
    const result = await this.tagRepository
      .createQueryBuilder("tag")
      .leftJoin("tag.documentRelations", "relation")
      .leftJoin("relation.document", "document", "document.isArchived = false")
      .select([
        "tag.id",
        "tag.tagName",
        "tag.description",
        "tag.color",
        "tag.category",
        "tag.isActive",
        "tag.createdBy",
        "tag.createdAt",
        "tag.updatedAt",
      ])
      .addSelect("COUNT(DISTINCT document.id)", "usageCount")
      .where("LOWER(tag.tagName) = LOWER(:tagName)", { tagName })
      .groupBy("tag.id")
      .addGroupBy("tag.tagName")
      .addGroupBy("tag.description")
      .addGroupBy("tag.color")
      .addGroupBy("tag.category")
      .addGroupBy("tag.isActive")
      .addGroupBy("tag.createdBy")
      .addGroupBy("tag.createdAt")
      .addGroupBy("tag.updatedAt")
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.tag_id,
      tagName: result.tag_tagName,
      description: result.tag_description,
      color: result.tag_color,
      category: result.tag_category,
      isActive: result.tag_isActive,
      createdBy: result.tag_createdBy,
      createdAt: result.tag_createdAt,
      updatedAt: result.tag_updatedAt,
      documentRelations: [], // Las relaciones no son necesarias para este caso de uso
      usageCount: parseInt(result.usageCount) || 0,
    };
  }

  /**
   * Obtener todas las etiquetas con contador de uso
   */
  async getAllTagsWithUsage(): Promise<KnowledgeTagWithUsage[]> {
    const result = await this.tagRepository
      .createQueryBuilder("tag")
      .leftJoin("tag.documentRelations", "relation")
      .leftJoin("relation.document", "document", "document.isArchived = false")
      .select([
        "tag.id",
        "tag.tagName",
        "tag.description",
        "tag.color",
        "tag.category",
        "tag.isActive",
        "tag.createdBy",
        "tag.createdAt",
        "tag.updatedAt",
      ])
      .addSelect("COUNT(DISTINCT document.id)", "usageCount")
      .groupBy("tag.id")
      .addGroupBy("tag.tagName")
      .addGroupBy("tag.description")
      .addGroupBy("tag.color")
      .addGroupBy("tag.category")
      .addGroupBy("tag.isActive")
      .addGroupBy("tag.createdBy")
      .addGroupBy("tag.createdAt")
      .addGroupBy("tag.updatedAt")
      .orderBy("COUNT(DISTINCT document.id)", "DESC")
      .addOrderBy("tag.tagName", "ASC")
      .getRawAndEntities();

    return result.entities.map((tag, index) => ({
      ...tag,
      usageCount: parseInt(result.raw[index].usageCount) || 0,
    }));
  }

  /**
   * Obtener etiquetas populares
   */
  async getPopularTags(limit: number = 20): Promise<KnowledgeTagWithUsage[]> {
    const allTags = await this.getAllTagsWithUsage();
    return allTags.filter((tag) => tag.usageCount > 0).slice(0, limit);
  }

  /**
   * Obtener etiqueta por ID con contador de uso
   */
  async getTagById(id: string): Promise<KnowledgeTagWithUsage | null> {
    const tag = await this.tagRepository.findOne({
      where: { id },
    });

    if (!tag) {
      return null;
    }

    // Contar documentos que usan esta etiqueta
    const usageCount = await this.relationRepository
      .createQueryBuilder("relation")
      .leftJoin("relation.document", "document")
      .where("relation.tagId = :tagId", { tagId: id })
      .andWhere("document.isArchived = false")
      .getCount();

    return {
      ...tag,
      usageCount,
    };
  }

  /**
   * Asignar etiquetas a un documento
   */
  async assignTagsToDocument(
    documentId: string,
    tagNames: string[],
    userId?: string
  ): Promise<void> {
    console.log(
      `[assignTagsToDocument] Document: ${documentId}, Tags:`,
      tagNames,
      `User: ${userId}`
    );

    // Eliminar relaciones existentes
    await this.relationRepository.delete({ documentId });
    console.log(
      `[assignTagsToDocument] Deleted existing relations for document ${documentId}`
    );

    if (tagNames.length === 0) {
      // Actualizar tags_json en el documento
      await this.updateDocumentTagsJson(documentId, []);
      console.log(
        `[assignTagsToDocument] No tags provided, updated document with empty tags`
      );
      return;
    }

    // Encontrar o crear etiquetas
    const tags: KnowledgeTag[] = [];
    for (const tagName of tagNames) {
      const tag = await this.findOrCreateTag(tagName.trim(), userId);
      tags.push(tag);
      console.log(
        `[assignTagsToDocument] Found/created tag: ${tag.tagName} (${tag.id})`
      );
    }

    // Crear nuevas relaciones
    const relations = tags.map((tag) =>
      this.relationRepository.create({
        documentId,
        tagId: tag.id,
      })
    );

    await this.relationRepository.save(relations);
    console.log(
      `[assignTagsToDocument] Created ${relations.length} new relations`
    );

    // Actualizar tags_json en el documento
    const tagIds = tags.map((tag) => tag.id);
    await this.updateDocumentTagsJson(documentId, tagIds);
    console.log(
      `[assignTagsToDocument] Updated document tags_json with IDs:`,
      tagIds
    );
  }

  /**
   * Actualizar campo tags_json en documento
   */
  private async updateDocumentTagsJson(
    documentId: string,
    tagIds: string[]
  ): Promise<void> {
    await this.documentRepository.update(
      { id: documentId },
      { tagsJson: tagIds }
    );
  }

  /**
   * Obtener etiquetas de un documento
   */
  async getDocumentTags(documentId: string): Promise<KnowledgeTag[]> {
    const relations = await this.relationRepository.find({
      where: { documentId },
      relations: ["tag"],
    });

    return relations.map((relation) => relation.tag);
  }

  /**
   * Eliminar etiqueta
   */
  async deleteTag(tagId: string): Promise<void> {
    // Verificar si la etiqueta existe
    const tag = await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new Error("Etiqueta no encontrada");
    }

    // Las relaciones se eliminarán automáticamente por CASCADE
    // El trigger actualizará automáticamente los campos tags_json
    await this.tagRepository.delete(tagId);
  }

  /**
   * Actualizar etiqueta
   */
  async updateTag(
    tagId: string,
    updateData: Partial<CreateKnowledgeTagDto>
  ): Promise<KnowledgeTag> {
    const tag = await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new Error("Etiqueta no encontrada");
    }

    // Si se está cambiando el nombre, verificar unicidad
    if (updateData.tagName && updateData.tagName !== tag.tagName) {
      const existingTag = await this.tagRepository.findOne({
        where: { tagName: updateData.tagName },
      });

      if (existingTag) {
        throw new Error(`La etiqueta "${updateData.tagName}" ya existe`);
      }
    }

    Object.assign(tag, updateData);
    return await this.tagRepository.save(tag);
  }
}
