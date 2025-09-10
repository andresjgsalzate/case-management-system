import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";

@Entity("knowledge_document_versions")
@Unique(["documentId", "versionNumber"])
export class KnowledgeDocumentVersion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.versions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "version_number", type: "integer" })
  versionNumber: number;

  @Column({ type: "jsonb" })
  content: object; // Contenido BlockNote en formato JSON

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ name: "change_summary", type: "text", nullable: true })
  changeSummary: string | null;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: Promise<UserProfile>;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
