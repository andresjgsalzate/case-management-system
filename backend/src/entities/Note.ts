import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { Case } from "./Case";
import { UserProfile } from "./UserProfile";

@Entity("notes")
@Index(["createdBy"])
@Index(["assignedTo"])
@Index(["caseId"])
@Index(["isArchived"])
@Index(["isImportant"])
@Index(["reminderDate"])
@Index(["createdAt"])
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({
    name: "note_type",
    type: "varchar",
    length: 50,
    default: "note",
  })
  noteType: string; // 'note' | 'solution' | 'guide' | 'faq' | 'template' | 'procedure'

  @Column({
    name: "priority",
    type: "varchar",
    length: 20,
    default: "medium",
  })
  priority: string; // 'low' | 'medium' | 'high' | 'urgent'

  @Column({
    name: "difficulty_level",
    type: "integer",
    default: 1,
  })
  difficultyLevel: number; // 1-5

  @Column({ type: "text", array: true, default: "{}" })
  tags: string[];

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId?: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedTo?: string;

  @Column({ name: "is_important", type: "boolean", default: false })
  isImportant: boolean;

  @Column({ name: "is_archived", type: "boolean", default: false })
  isArchived: boolean;

  @Column({ name: "is_template", type: "boolean", default: false })
  isTemplate: boolean;

  @Column({ name: "is_published", type: "boolean", default: true })
  isPublished: boolean;

  @Column({ name: "is_deprecated", type: "boolean", default: false })
  isDeprecated: boolean;

  @Column({ name: "view_count", type: "integer", default: 0 })
  viewCount: number;

  @Column({ name: "helpful_count", type: "integer", default: 0 })
  helpfulCount: number;

  @Column({ name: "not_helpful_count", type: "integer", default: 0 })
  notHelpfulCount: number;

  @Column({ name: "version", type: "integer", default: 1 })
  version: number;

  @Column({
    name: "archived_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  archivedAt?: Date;

  @Column({ name: "archived_by", type: "uuid", nullable: true })
  archivedBy?: string;

  @Column({
    name: "reminder_date",
    type: "timestamp with time zone",
    nullable: true,
  })
  reminderDate?: Date;

  @Column({ name: "is_reminder_sent", type: "boolean", default: false })
  isReminderSent: boolean;

  @Column({ name: "complexity_notes", type: "text", nullable: true })
  complexityNotes?: string;

  @Column({ name: "prerequisites", type: "text", nullable: true })
  prerequisites?: string;

  @Column({
    name: "estimated_solution_time",
    type: "integer",
    nullable: true,
  })
  estimatedSolutionTime?: number; // minutos

  @Column({ name: "deprecation_reason", type: "text", nullable: true })
  deprecationReason?: string;

  @Column({ name: "replacement_note_id", type: "uuid", nullable: true })
  replacementNoteId?: string;

  @Column({
    name: "last_reviewed_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  lastReviewedAt?: Date;

  @Column({ name: "last_reviewed_by", type: "uuid", nullable: true })
  lastReviewedBy?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Case, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "case_id" })
  case?: Case;

  @ManyToOne(() => UserProfile, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "created_by" })
  createdByUser: UserProfile;

  @ManyToOne(() => UserProfile, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assigned_to" })
  assignedToUser?: UserProfile;

  @ManyToOne(() => UserProfile, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "archived_by" })
  archivedByUser?: UserProfile;

  @ManyToOne(() => Note, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "replacement_note_id" })
  replacementNote?: Note;
}
