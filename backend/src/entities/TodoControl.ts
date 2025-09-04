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
import { Todo } from "./Todo";
import { UserProfile } from "./UserProfile";
import { CaseStatusControl } from "./CaseStatusControl";
import { TodoTimeEntry } from "./TodoTimeEntry";
import { TodoManualTimeEntry } from "./TodoManualTimeEntry";

@Entity("todo_control")
export class TodoControl {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "todo_id", unique: true })
  todoId: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "status_id" })
  statusId: string;

  @Column({ name: "total_time_minutes", type: "integer", default: 0 })
  totalTimeMinutes: number;

  @Column({ name: "timer_start_at", type: "timestamptz", nullable: true })
  timerStartAt?: Date;

  @Column({ name: "is_timer_active", type: "boolean", default: false })
  isTimerActive: boolean;

  @Column({
    name: "assigned_at",
    type: "timestamptz",
    default: () => "NOW()",
  })
  assignedAt: Date;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt?: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Todo, (todo) => todo.control)
  @JoinColumn({ name: "todo_id" })
  todo: Todo;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "user_id" })
  user: UserProfile;

  @ManyToOne(() => CaseStatusControl)
  @JoinColumn({ name: "status_id" })
  status: CaseStatusControl;

  @OneToMany(() => TodoTimeEntry, (timeEntry) => timeEntry.todoControl)
  timeEntries: TodoTimeEntry[];

  @OneToMany(
    () => TodoManualTimeEntry,
    (manualEntry) => manualEntry.todoControl
  )
  manualTimeEntries: TodoManualTimeEntry[];
}
