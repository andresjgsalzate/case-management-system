import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { KnowledgeDocument } from "./KnowledgeDocument";
import { UserProfile } from "./UserProfile";

export type KnowledgeReviewEventType =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "REPUBLISHED"
  | "RETURNED_TO_DRAFT";

@Entity("knowledge_document_review_events")
@Index(["documentId", "createdAt"])
@Index(["eventType"])
@Index(["actorUserId"])
export class KnowledgeDocumentReviewEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.reviewEvents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: KnowledgeDocument;

  @Column({ name: "event_type", type: "varchar", length: 30 })
  eventType: KnowledgeReviewEventType;

  @Column({ name: "actor_user_id", type: "uuid", nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => UserProfile, { lazy: true, nullable: true })
  @JoinColumn({ name: "actor_user_id" })
  actorUser: Promise<UserProfile | null>;

  @Column({ name: "from_status", type: "varchar", length: 30, nullable: true })
  fromStatus: string | null;

  @Column({ name: "to_status", type: "varchar", length: 30, nullable: true })
  toStatus: string | null;

  @Column({ name: "comments", type: "text", nullable: true })
  comments: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
