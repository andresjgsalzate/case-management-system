import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";

@Entity("knowledge_document_favorites")
@Unique(["documentId", "userId"])
@Index(["documentId"])
@Index(["userId"])
export class KnowledgeDocumentFavorite {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (doc) => doc.favorites, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserProfile;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
