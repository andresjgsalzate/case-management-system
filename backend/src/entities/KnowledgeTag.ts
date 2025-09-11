import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { KnowledgeDocumentTagRelation } from "./KnowledgeDocumentTagRelation";

export enum TagCategory {
  PRIORITY = "priority",
  TECHNICAL = "technical",
  TYPE = "type",
  TECHNOLOGY = "technology",
  MODULE = "module",
  CUSTOM = "custom",
}

@Entity("knowledge_tags")
export class KnowledgeTag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tag_name", type: "varchar", length: 50, unique: true })
  tagName: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "color", type: "varchar", length: 7, default: "#6B7280" })
  color: string;

  @Column({
    name: "category",
    type: "enum",
    enum: TagCategory,
    default: TagCategory.CUSTOM,
  })
  category: TagCategory;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;

  // Relación con documentos a través de la tabla de relaciones
  @OneToMany(() => KnowledgeDocumentTagRelation, (relation) => relation.tag)
  documentRelations: KnowledgeDocumentTagRelation[];

  // Campo virtual para contar documentos relacionados
  usageCount?: number;
}
