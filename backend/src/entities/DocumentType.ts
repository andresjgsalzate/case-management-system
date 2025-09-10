import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";

@Entity("document_types")
export class DocumentType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  code: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  icon: string | null;

  @Column({ type: "varchar", length: 7, default: "#6B7280" })
  color: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "integer", default: 0 })
  displayOrder: number;

  @Column({ name: "created_by" })
  createdBy: string;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: Promise<UserProfile>;

  @OneToMany(() => KnowledgeDocument, (doc) => doc.documentType)
  documents: KnowledgeDocument[];

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
