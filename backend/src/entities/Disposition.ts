import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Case } from "./Case";
import { Application } from "./Application";
import { UserProfile } from "./UserProfile";

@Entity("dispositions")
export class Disposition {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  date: string;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId: string | null;

  @Column({ name: "case_number", type: "varchar" })
  caseNumber: string;

  @Column({ name: "script_name", type: "text" })
  scriptName: string;

  @Column({ name: "svn_revision_number", type: "text", nullable: true })
  svnRevisionNumber: string | null;

  @Column({ name: "application_id", type: "uuid" })
  applicationId: string;

  @Column({ type: "text", nullable: true })
  observations: string | null;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: "case_id" })
  case?: Case;

  @ManyToOne(() => Application, { nullable: false })
  @JoinColumn({ name: "application_id" })
  application: Application;

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: UserProfile;
}
