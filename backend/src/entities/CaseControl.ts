import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Case } from "./Case";
import { UserProfile } from "./UserProfile";
import { CaseStatusControl } from "./CaseStatusControl";
import { TimeEntry } from "./TimeEntry";
import { ManualTimeEntry } from "./ManualTimeEntry";

@Entity("case_control")
@Index(["caseId"], { unique: true })
export class CaseControl {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  caseId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  statusId: string;

  // Control de tiempo
  @Column({ type: "int", default: 0 })
  totalTimeMinutes: number;

  @Column({ type: "timestamp", nullable: true })
  timerStartAt?: Date;

  @Column({ type: "boolean", default: false })
  isTimerActive: boolean;

  // Metadatos de flujo
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  assignedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  startedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Case, { onDelete: "CASCADE" })
  @JoinColumn({ name: "caseId" })
  case: Case;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserProfile;

  @ManyToOne(() => CaseStatusControl, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "statusId" })
  status: CaseStatusControl;

  @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.caseControl)
  timeEntries: TimeEntry[];

  @OneToMany(() => ManualTimeEntry, (manualEntry) => manualEntry.caseControl)
  manualTimeEntries: ManualTimeEntry[];
}
