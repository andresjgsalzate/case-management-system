import { Repository, DataSource, ILike } from "typeorm";
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

/**
 * Normaliza un nombre de etiqueta para evitar duplicados
 * - Remueve espacios al inicio y final
 * - Remueve acentos/diacríticos
 * - Remueve puntos y caracteres especiales al inicio y final
 * - Convierte a mayúsculas
 * - Reemplaza múltiples espacios por uno solo
 */
export function normalizeTagName(tagName: string): string {
  if (!tagName) return "";

  let normalized = tagName
    // 1. Trim espacios al inicio y final
    .trim()
    // 2. Remover acentos/diacríticos usando normalize
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // 3. Remover caracteres especiales al inicio y final (puntos, guiones, etc.)
    .replace(/^[.\-_,;:!¡¿?@#$%^&*()+=\[\]{}|\\/<>'"]+/, "")
    .replace(/[.\-_,;:!¡¿?@#$%^&*()+=\[\]{}|\\/<>'"]+$/, "")
    // 4. Reemplazar múltiples espacios por uno solo
    .replace(/\s+/g, " ")
    // 5. Trim de nuevo por si quedaron espacios
    .trim()
    // 6. Convertir a mayúsculas
    .toUpperCase();

  return normalized;
}

/**
 * Genera una versión "slug" para comparación de duplicados
 * Esta versión elimina todos los espacios y caracteres especiales
 */
export function generateTagSlug(tagName: string): string {
  return normalizeTagName(tagName)
    .replace(/\s+/g, "") // Sin espacios
    .replace(/[^A-Z0-9]/g, ""); // Solo letras y números
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
   * - Normaliza el nombre (mayúsculas, sin acentos, sin espacios extra)
   * - Verifica duplicados considerando variaciones del nombre
   */
  async createTag(
    createDto: CreateKnowledgeTagDto,
    userId?: string
  ): Promise<KnowledgeTag> {
    // Normalizar el nombre de la etiqueta
    const normalizedName = normalizeTagName(createDto.tagName);

    if (!normalizedName) {
      throw new Error("El nombre de la etiqueta no puede estar vacío");
    }

    // Generar slug para comparación de duplicados
    const tagSlug = generateTagSlug(normalizedName);

    // Buscar duplicados potenciales
    // 1. Buscar coincidencia exacta (normalizada)
    const exactMatch = await this.tagRepository.findOne({
      where: { tagName: normalizedName },
    });

    if (exactMatch) {
      throw new Error(`La etiqueta "${normalizedName}" ya existe`);
    }

    // 2. Buscar etiquetas similares (sin espacios, sin acentos)
    const allTags = await this.tagRepository.find({
      where: { isActive: true },
    });

    const duplicateTag = allTags.find((tag) => {
      const existingSlug = generateTagSlug(tag.tagName);
      return existingSlug === tagSlug;
    });

    if (duplicateTag) {
      throw new Error(
        `Ya existe una etiqueta similar: "${duplicateTag.tagName}". ` +
          `La etiqueta "${createDto.tagName}" se considera duplicada.`
      );
    }

    const tag = this.tagRepository.create({
      ...createDto,
      tagName: normalizedName, // Guardar siempre normalizado
      createdBy: userId,
    });

    return await this.tagRepository.save(tag);
  }

  /**
   * Buscar o crear etiqueta por nombre
   * - Busca primero una etiqueta existente (considerando normalización)
   * - Si no existe, crea una nueva con el nombre normalizado
   */
  async findOrCreateTag(
    tagName: string,
    userId?: string
  ): Promise<KnowledgeTag> {
    // Normalizar el nombre
    const normalizedName = normalizeTagName(tagName);

    if (!normalizedName) {
      throw new Error("El nombre de la etiqueta no puede estar vacío");
    }

    // Buscar etiqueta existente por nombre normalizado exacto
    let tag = await this.tagRepository.findOne({
      where: { tagName: normalizedName },
    });

    // Si no hay coincidencia exacta, buscar por slug (para encontrar variaciones)
    if (!tag) {
      const tagSlug = generateTagSlug(normalizedName);
      const allTags = await this.tagRepository.find({
        where: { isActive: true },
      });

      tag = allTags.find((t) => generateTagSlug(t.tagName) === tagSlug) || null;
    }

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
      const lowerName = normalizedName.toLowerCase();

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
          tagName: normalizedName, // Ya está normalizado
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
    // Eliminar relaciones existentes
    await this.relationRepository.delete({ documentId });

    if (tagNames.length === 0) {
      // Actualizar tags_json en el documento
      await this.updateDocumentTagsJson(documentId, []);
      return;
    }

    // Encontrar o crear etiquetas
    const tags: KnowledgeTag[] = [];
    for (const tagName of tagNames) {
      const tag = await this.findOrCreateTag(tagName.trim(), userId);
      tags.push(tag);
    }

    // Crear nuevas relaciones
    const relations = tags.map((tag) =>
      this.relationRepository.create({
        documentId,
        tagId: tag.id,
      })
    );

    await this.relationRepository.save(relations);

    // Actualizar tags_json en el documento
    const tagIds = tags.map((tag) => tag.id);
    await this.updateDocumentTagsJson(documentId, tagIds);
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
   * - Si se cambia el nombre, lo normaliza y verifica duplicados
   */
  async updateTag(
    tagId: string,
    updateData: Partial<CreateKnowledgeTagDto>
  ): Promise<KnowledgeTag> {
    const tag = await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new Error("Etiqueta no encontrada");
    }

    // Si se está cambiando el nombre, normalizar y verificar unicidad
    if (updateData.tagName) {
      const normalizedName = normalizeTagName(updateData.tagName);

      if (!normalizedName) {
        throw new Error("El nombre de la etiqueta no puede estar vacío");
      }

      // Solo verificar duplicados si el nombre normalizado es diferente
      if (normalizedName !== tag.tagName) {
        // Buscar coincidencia exacta
        const exactMatch = await this.tagRepository.findOne({
          where: { tagName: normalizedName },
        });

        if (exactMatch && exactMatch.id !== tagId) {
          throw new Error(`La etiqueta "${normalizedName}" ya existe`);
        }

        // Buscar etiquetas similares por slug
        const tagSlug = generateTagSlug(normalizedName);
        const allTags = await this.tagRepository.find({
          where: { isActive: true },
        });

        const duplicateTag = allTags.find((t) => {
          if (t.id === tagId) return false; // Ignorar la etiqueta actual
          return generateTagSlug(t.tagName) === tagSlug;
        });

        if (duplicateTag) {
          throw new Error(
            `Ya existe una etiqueta similar: "${duplicateTag.tagName}". ` +
              `La etiqueta "${updateData.tagName}" se considera duplicada.`
          );
        }

        updateData.tagName = normalizedName;
      } else {
        // El nombre normalizado es el mismo, no hay cambio
        delete updateData.tagName;
      }
    }

    Object.assign(tag, updateData);
    return await this.tagRepository.save(tag);
  }
}
