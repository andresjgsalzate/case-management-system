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

export enum ArchivedCaseStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export enum ArchivedCasePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ArchivedCaseClassification {
  INCIDENT = "INCIDENT",
  REQUEST = "REQUEST",
  CHANGE = "CHANGE",
  PROBLEM = "PROBLEM",
}

@Entity("archived_cases")
@Index("idx_archived_cases_original_case_id", ["originalCaseId"])
@Index("idx_archived_cases_case_number", ["caseNumber"])
@Index("idx_archived_cases_status", ["status"])
@Index("idx_archived_cases_archived_by", ["archivedBy"])
@Index("idx_archived_cases_archived_at", ["archivedAt"])
export class ArchivedCase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "original_case_id", type: "uuid" })
  originalCaseId!: string;

  @Column({ name: "case_number", type: "varchar", length: 50 })
  caseNumber!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: ArchivedCaseStatus,
    default: ArchivedCaseStatus.OPEN,
  })
  status!: ArchivedCaseStatus;

  @Column({
    type: "enum",
    enum: ArchivedCasePriority,
    default: ArchivedCasePriority.MEDIUM,
  })
  priority!: ArchivedCasePriority;

  @Column({
    type: "enum",
    enum: ArchivedCaseClassification,
    default: ArchivedCaseClassification.INCIDENT,
  })
  classification!: ArchivedCaseClassification;

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

  @Column({ name: "original_created_at", type: "timestamptz" })
  originalCreatedAt!: Date;

  @Column({ name: "original_updated_at", type: "timestamptz", nullable: true })
  originalUpdatedAt?: Date;

  @Column({
    name: "timer_entries",
    type: "jsonb",
    nullable: true,
    default: () => "'[]'",
  })
  timerEntries?: Array<{
    id: string;
    caseControlId: string;
    userId: string;
    userEmail?: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  @Column({
    name: "manual_time_entries",
    type: "jsonb",
    nullable: true,
    default: () => "'[]'",
  })
  manualTimeEntries?: Array<{
    id: string;
    caseControlId: string;
    userId: string;
    userEmail?: string;
    date: Date;
    durationMinutes: number;
    description?: string;
    createdBy: string;
    createdByEmail?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

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
