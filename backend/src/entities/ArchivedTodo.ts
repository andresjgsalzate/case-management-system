import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserProfile } from "./UserProfile";

export enum ArchivedTodoStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ON_HOLD = "ON_HOLD",
}

export enum ArchivedTodoPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

@Entity("archived_todos")
@Index("idx_archived_todos_original_todo_id", ["originalTodoId"])
@Index("idx_archived_todos_case_id", ["caseId"])
@Index("idx_archived_todos_status", ["status"])
@Index("idx_archived_todos_archived_by", ["archivedBy"])
@Index("idx_archived_todos_archived_at", ["archivedAt"])
export class ArchivedTodo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "original_todo_id", type: "uuid" })
  originalTodoId!: string;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId?: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: ArchivedTodoStatus,
    default: ArchivedTodoStatus.PENDING,
  })
  status!: ArchivedTodoStatus;

  @Column({
    type: "enum",
    enum: ArchivedTodoPriority,
    default: ArchivedTodoPriority.MEDIUM,
  })
  priority!: ArchivedTodoPriority;

  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedTo?: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy!: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy?: string;

  @Column({ name: "archived_by", type: "uuid" })
  archivedBy!: string;

  @Column({
    name: "archived_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  archivedAt!: Date;

  @Column({
    name: "archived_reason",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  archivedReason?: string;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate?: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date;

  @Column({ name: "original_created_at", type: "timestamptz" })
  originalCreatedAt!: Date;

  @Column({ name: "original_updated_at", type: "timestamptz", nullable: true })
  originalUpdatedAt?: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: "is_restored", type: "boolean", default: false })
  isRestored!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Relaciones
  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: "archived_by" })
  archivedByUser!: UserProfile;

  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assignedToUser?: UserProfile;

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: "created_by" })
  createdByUser!: UserProfile;

  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "updated_by" })
  updatedByUser?: UserProfile;
}
