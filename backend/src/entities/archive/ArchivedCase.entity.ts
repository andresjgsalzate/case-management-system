import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserProfile } from "../UserProfile";

@Entity("archived_cases")
@Index(["originalCaseId"])
@Index(["caseNumber"])
@Index(["archivedBy"])
@Index(["archivedAt"])
@Index(["isRestored"])
@Index(["classification"])
@Index(["status"])
export class ArchivedCase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "original_case_id", type: "uuid" })
  originalCaseId: string;

  @Column({ name: "case_number", type: "varchar", length: 255 })
  caseNumber: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 100 })
  status: string;

  @Column({ type: "varchar", length: 50 })
  priority: string;

  @Column({ type: "varchar", length: 100 })
  classification: string;

  // Usuarios relacionados
  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedTo: string;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string;

  // Datos temporales originales
  @Column({ name: "original_created_at", type: "timestamptz" })
  originalCreatedAt: Date;

  @Column({ name: "original_updated_at", type: "timestamptz" })
  originalUpdatedAt: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt: Date;

  // Datos de archivo
  @Column({
    name: "archived_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  archivedAt: Date;

  @Column({ name: "archived_by", type: "uuid" })
  archivedBy: string;

  @Column({
    name: "archive_reason",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  archiveReason: string;

  // Datos de restauración
  @Column({ name: "restored_at", type: "timestamptz", nullable: true })
  restoredAt: Date;

  @Column({ name: "restored_by", type: "uuid", nullable: true })
  restoredBy: string;

  @Column({ name: "is_restored", type: "boolean", default: false })
  isRestored: boolean;

  // Datos JSON para preservar información completa
  @Column({ name: "timer_entries", type: "jsonb", default: () => "'[]'" })
  timerEntries: any[];

  @Column({ name: "manual_time_entries", type: "jsonb", default: () => "'[]'" })
  manualTimeEntries: any[];

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata: any;

  // Tiempo total acumulado
  @Column({ name: "total_time_minutes", type: "integer", default: 0 })
  totalTimeMinutes: number;

  // Timestamps de control
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by" })
  createdByUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "assigned_to" })
  assignedUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "updated_by" })
  updatedByUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "archived_by" })
  archivedByUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "restored_by" })
  restoredByUser: Promise<UserProfile>;
}
