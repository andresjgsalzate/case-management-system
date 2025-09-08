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

@Entity("archived_todos")
@Index(["originalTodoId"])
@Index(["title"])
@Index(["archivedBy"])
@Index(["archivedAt"])
@Index(["isRestored"])
@Index(["priority"])
@Index(["category"])
@Index(["caseId"])
export class ArchivedTodo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "original_todo_id", type: "uuid" })
  originalTodoId: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 50 })
  priority: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  category: string;

  // Estado y fechas originales
  @Column({ name: "is_completed", type: "boolean", default: false })
  isCompleted: boolean;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ name: "original_created_at", type: "timestamptz" })
  originalCreatedAt: Date;

  @Column({ name: "original_updated_at", type: "timestamptz" })
  originalUpdatedAt: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt: Date;

  // Usuarios relacionados
  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId: string;

  @Column({ name: "assigned_user_id", type: "uuid", nullable: true })
  assignedUserId: string;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string;

  // Datos de archivo
  @Column({
    name: "archived_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  archivedAt: Date;

  @Column({ name: "archived_by", type: "uuid" })
  archivedBy: string;

  @Column({ name: "archive_reason", type: "text", nullable: true })
  archiveReason: string;

  // Datos de restauración
  @Column({ name: "restored_at", type: "timestamptz", nullable: true })
  restoredAt: Date;

  @Column({ name: "restored_by", type: "uuid", nullable: true })
  restoredBy: string;

  @Column({ name: "is_restored", type: "boolean", default: false })
  isRestored: boolean;

  // Datos JSON para preservar información completa
  @Column({ name: "original_data", type: "jsonb" })
  originalData: any;

  @Column({ name: "control_data", type: "jsonb" })
  controlData: any;

  // Campos JSONB para entradas de tiempo (igual que archived_cases)
  @Column({ name: "timer_entries", type: "jsonb", default: () => "'[]'" })
  timerEntries: any[];

  @Column({ name: "manual_time_entries", type: "jsonb", default: () => "'[]'" })
  manualTimeEntries: any[];

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata: any;

  // Tiempo total acumulado
  @Column({ name: "total_time_minutes", type: "integer", default: 0 })
  totalTimeMinutes: number;

  // Tiempo separado por tipo (mantenido para compatibilidad)
  @Column({ name: "timer_time_minutes", type: "integer", default: 0 })
  timerTimeMinutes: number;

  @Column({ name: "manual_time_minutes", type: "integer", default: 0 })
  manualTimeMinutes: number;

  // Timestamps de control
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "archived_by" })
  archivedByUser: Promise<UserProfile>;

  @ManyToOne(() => UserProfile, { lazy: true })
  @JoinColumn({ name: "restored_by" })
  restoredByUser: Promise<UserProfile>;
}
