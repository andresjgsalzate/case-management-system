import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";

export type FileType = "image" | "document" | "spreadsheet" | "other";

@Entity("knowledge_document_attachments")
export class KnowledgeDocumentAttachment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "file_name", type: "varchar", length: 255 })
  fileName: string;

  @Column({ name: "file_path", type: "text" })
  filePath: string; // Ruta relativa desde uploads/

  @Column({ name: "file_size", type: "bigint" })
  fileSize: number;

  @Column({ name: "mime_type", type: "varchar", length: 100 })
  mimeType: string;

  @Column({ name: "file_type", type: "varchar", length: 20, nullable: true })
  fileType: FileType | null;

  @Column({ name: "file_hash", type: "varchar", length: 64, nullable: true })
  fileHash: string | null; // SHA-256 para deduplicación

  @Column({ name: "thumbnail_path", type: "text", nullable: true })
  thumbnailPath: string | null; // Ruta de miniatura generada

  @Column({ name: "processed_path", type: "text", nullable: true })
  processedPath: string | null; // Ruta de versión procesada/optimizada

  @Column({ name: "is_embedded", type: "boolean", default: false })
  isEmbedded: boolean; // Si está embebido en el contenido

  @Column({
    name: "upload_session_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  uploadSessionId: string | null; // ID de sesión de carga

  @Column({ name: "uploaded_by", type: "uuid" })
  uploadedBy: string;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "uploaded_by" })
  uploadedByUser: Promise<UserProfile>;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
