import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { KnowledgeDocument } from "./KnowledgeDocument";

export type TagCategory =
  | "priority"
  | "technical"
  | "type"
  | "technology"
  | "module"
  | "custom";

@Entity("knowledge_document_tags")
export class KnowledgeDocumentTag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", nullable: true })
  documentId?: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.tags, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document?: KnowledgeDocument;

  @Column({ name: "tag_name", type: "varchar", length: 50 })
  tagName: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "color", type: "varchar", length: 7, default: "#6B7280" })
  color: string;

  @Column({
    name: "category",
    type: "enum",
    enum: ["priority", "technical", "type", "technology", "module", "custom"],
    default: "custom",
  })
  category: TagCategory;

  @Column({ name: "usage_count", type: "integer", default: 0 })
  usageCount: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
