import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { TodoControl } from "./TodoControl";
import { UserProfile } from "./UserProfile";

@Entity("todo_manual_time_entries")
export class TodoManualTimeEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "todo_control_id" })
  todoControlId: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ type: "date" })
  date: Date;

  @Column({ name: "duration_minutes", type: "integer" })
  durationMinutes: number;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "created_by" })
  createdBy: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => TodoControl, (control) => control.manualTimeEntries)
  @JoinColumn({ name: "todo_control_id" })
  todoControl: TodoControl;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "user_id" })
  user: UserProfile;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "created_by" })
  creator: UserProfile;
}
