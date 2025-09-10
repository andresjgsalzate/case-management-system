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

@Entity("knowledge_document_tags")
@Unique(["documentId", "tagName"])
export class KnowledgeDocumentTag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.tags, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "tag_name", type: "varchar", length: 50 })
  tagName: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
