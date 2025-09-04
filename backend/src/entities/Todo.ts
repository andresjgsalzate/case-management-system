import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { TodoPriority } from "./TodoPriority";
import { TodoControl } from "./TodoControl";

@Entity("todos")
export class Todo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "priority_id" })
  priorityId: string;

  @Column({ name: "assigned_user_id", nullable: true })
  assignedUserId?: string;

  @Column({ name: "created_by_user_id" })
  createdByUserId: string;

  @Column({ type: "date", nullable: true })
  dueDate?: Date;

  @Column({ name: "estimated_minutes", type: "integer", default: 0 })
  estimatedMinutes: number;

  @Column({ name: "is_completed", type: "boolean", default: false })
  isCompleted: boolean;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => TodoPriority)
  @JoinColumn({ name: "priority_id" })
  priority: TodoPriority;

  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser?: UserProfile;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser: UserProfile;

  @OneToMany(() => TodoControl, (control) => control.todo)
  controls: TodoControl[];

  // Relación uno a uno para el control actual (helper)
  get control(): TodoControl | undefined {
    return this.controls && this.controls.length > 0
      ? this.controls[0]
      : undefined;
  }
}
