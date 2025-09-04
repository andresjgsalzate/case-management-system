import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CaseControl } from "./CaseControl";
import { UserProfile } from "./UserProfile";

@Entity("time_entries")
export class TimeEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  caseControlId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "timestamp" })
  startTime: Date;

  @Column({ type: "timestamp", nullable: true })
  endTime?: Date;

  @Column({ type: "int", default: 0 })
  durationMinutes: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => CaseControl, (caseControl) => caseControl.timeEntries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "caseControlId" })
  caseControl: CaseControl;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserProfile;
}
