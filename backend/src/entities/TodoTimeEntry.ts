import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TodoControl } from "./TodoControl";
import { UserProfile } from "./UserProfile";

@Entity("todo_time_entries")
export class TodoTimeEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "todo_control_id" })
  todoControlId: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "start_time", type: "timestamptz" })
  startTime: Date;

  @Column({ name: "end_time", type: "timestamptz", nullable: true })
  endTime?: Date;

  @Column({ name: "duration_minutes", type: "integer", nullable: true })
  durationMinutes?: number;

  @Column({
    name: "entry_type",
    type: "varchar",
    length: 20,
    default: "automatic",
  })
  entryType: "automatic" | "manual";

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => TodoControl, (control) => control.timeEntries)
  @JoinColumn({ name: "todo_control_id" })
  todoControl: TodoControl;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "user_id" })
  user: UserProfile;
}
