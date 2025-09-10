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

export type RelationType = "related" | "replaces" | "prerequisite" | "follows";

@Entity("knowledge_document_relations")
@Unique(["parentDocumentId", "childDocumentId", "relationType"])
export class KnowledgeDocumentRelation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "parent_document_id" })
  parentDocumentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.parentRelations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parent_document_id" })
  parentDocument: KnowledgeDocument;

  @Column({ name: "child_document_id" })
  childDocumentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.childRelations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "child_document_id" })
  childDocument: KnowledgeDocument;

  @Column({
    name: "relation_type",
    type: "varchar",
    length: 50,
    default: "related",
  })
  relationType: RelationType;

  @Column({ name: "created_by" })
  createdBy: string;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: Promise<UserProfile>;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
