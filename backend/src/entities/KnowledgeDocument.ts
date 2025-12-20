import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { DocumentType } from "./DocumentType";
import { KnowledgeDocumentTag } from "./KnowledgeDocumentTag";
import { KnowledgeDocumentTagRelation } from "./KnowledgeDocumentTagRelation";
import { KnowledgeDocumentVersion } from "./KnowledgeDocumentVersion";
import { KnowledgeDocumentAttachment } from "./KnowledgeDocumentAttachment";
import { KnowledgeDocumentRelation } from "./KnowledgeDocumentRelation";
import { KnowledgeDocumentFeedback } from "./KnowledgeDocumentFeedback";

export type Priority = "low" | "medium" | "high" | "urgent";

@Entity("knowledge_documents")
@Index(["title"]) // Solo índice en title - content puede ser muy grande para B-tree
export class KnowledgeDocument {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text", nullable: true })
  content: string | null; // Contenido de texto plano para búsqueda

  @Column({ name: "json_content", type: "jsonb" })
  jsonContent: object; // Contenido BlockNote en formato JSON

  @Column({ name: "document_type_id", type: "uuid", nullable: true })
  documentTypeId: string | null;

  @ManyToOne(() => DocumentType, (documentType) => documentType.documents, {
    lazy: true,
  })
  @JoinColumn({ name: "document_type_id" })
  documentType: Promise<DocumentType>;

  // Metadatos del documento
  @Column({ type: "varchar", length: 20, default: "medium" })
  priority: Priority;

  @Column({ name: "difficulty_level", type: "integer", default: 1 })
  difficultyLevel: number;

  // Estados del documento
  @Column({ name: "is_published", type: "boolean", default: false })
  isPublished: boolean;

  @Column({ name: "is_template", type: "boolean", default: false })
  isTemplate: boolean;

  @Column({ name: "is_deprecated", type: "boolean", default: false })
  isDeprecated: boolean;

  @Column({ name: "is_archived", type: "boolean", default: false })
  isArchived: boolean;

  // Métricas
  @Column({ name: "view_count", type: "integer", default: 0 })
  viewCount: number;

  @Column({ name: "helpful_count", type: "integer", default: 0 })
  helpfulCount: number;

  @Column({ name: "not_helpful_count", type: "integer", default: 0 })
  notHelpfulCount: number;

  // Control de versiones
  @Column({ type: "integer", default: 1 })
  version: number;

  // Fechas importantes
  @Column({
    name: "published_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  publishedAt: Date | null;

  @Column({
    name: "deprecated_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  deprecatedAt: Date | null;

  @Column({
    name: "archived_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  archivedAt: Date | null;

  // Auditoría
  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: Promise<UserProfile>;

  @Column({ name: "last_edited_by", type: "uuid", nullable: true })
  lastEditedBy: string | null;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "last_edited_by" })
  lastEditedByUser: Promise<UserProfile>;

  @Column({ name: "archived_by", type: "uuid", nullable: true })
  archivedBy: string | null;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "archived_by" })
  archivedByUser: Promise<UserProfile>;

  @Column({ name: "replacement_document_id", type: "uuid", nullable: true })
  replacementDocumentId: string | null;

  @ManyToOne(() => KnowledgeDocument, { lazy: true })
  @JoinColumn({ name: "replacement_document_id" })
  replacementDocument: Promise<KnowledgeDocument>;

  // Campo JSON para etiquetas (nueva estructura)
  @Column({ name: "tags_json", type: "jsonb", default: () => "'[]'::jsonb" })
  tagsJson: string[];

  // Campo JSON para casos asociados
  @Column({
    name: "associated_cases",
    type: "jsonb",
    default: () => "'[]'::jsonb",
  })
  associatedCases: string[];

  // Relaciones
  @OneToMany(() => KnowledgeDocumentTag, (tag) => tag.document)
  tags: KnowledgeDocumentTag[];

  @OneToMany(
    () => KnowledgeDocumentTagRelation,
    (relation) => relation.document
  )
  tagRelations: KnowledgeDocumentTagRelation[];

  @OneToMany(() => KnowledgeDocumentVersion, (version) => version.document)
  versions: KnowledgeDocumentVersion[];

  @OneToMany(
    () => KnowledgeDocumentAttachment,
    (attachment) => attachment.document
  )
  attachments: KnowledgeDocumentAttachment[];

  @OneToMany(
    () => KnowledgeDocumentRelation,
    (relation) => relation.parentDocument
  )
  parentRelations: KnowledgeDocumentRelation[];

  @OneToMany(
    () => KnowledgeDocumentRelation,
    (relation) => relation.childDocument
  )
  childRelations: KnowledgeDocumentRelation[];

  @OneToMany(() => KnowledgeDocumentFeedback, (feedback) => feedback.document)
  feedback: KnowledgeDocumentFeedback[];

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
