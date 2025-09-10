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
import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";

@Entity("knowledge_document_feedback")
@Unique(["documentId", "userId"])
export class KnowledgeDocumentFeedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.feedback, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserProfile;

  @Column({ name: "is_helpful", type: "boolean" })
  isHelpful: boolean; // true = helpful, false = not helpful

  @Column({ type: "text", nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
