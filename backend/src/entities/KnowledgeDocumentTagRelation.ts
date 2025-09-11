import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { KnowledgeDocument } from "./KnowledgeDocument";
import { KnowledgeTag } from "./KnowledgeTag";

@Entity("knowledge_document_tag_relations")
@Unique(["documentId", "tagId"])
export class KnowledgeDocumentTagRelation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id" })
  documentId: string;

  @Column({ name: "tag_id" })
  tagId: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => KnowledgeDocument, (document) => document.tagRelations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @ManyToOne(() => KnowledgeTag, (tag) => tag.documentRelations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tag_id" })
  tag: KnowledgeTag;
}
