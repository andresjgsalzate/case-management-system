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

@Entity("manual_time_entries")
export class ManualTimeEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  caseControlId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "int" })
  durationMinutes: number;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "uuid" })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(
    () => CaseControl,
    (caseControl) => caseControl.manualTimeEntries,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "caseControlId" })
  caseControl: CaseControl;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserProfile;

  @ManyToOne(() => UserProfile, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdBy" })
  creator: UserProfile;
}
