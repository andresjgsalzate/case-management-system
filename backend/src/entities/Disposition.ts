import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Application } from "./Application";
import { UserProfile } from "./UserProfile";
import { Case } from "./Case";

@Entity("dispositions")
export class Disposition {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  date: string;

  @Column({ name: "case_id", type: "uuid", nullable: true })
  caseId?: string;

  @Column({ name: "case_number", type: "varchar" })
  caseNumber: string;

  @Column({ name: "script_name", type: "text" })
  scriptName: string;

  @Column({ name: "svn_revision_number", type: "text", nullable: true })
  svnRevisionNumber?: string;

  @Column({ name: "application_id", type: "uuid", nullable: true })
  applicationId?: string;

  @Column({
    name: "application_name",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  applicationName: string;

  @Column({ type: "text", nullable: true })
  observations: string | null;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Application, { nullable: true })
  @JoinColumn({ name: "application_id" })
  application?: Application;

  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: UserProfile;

  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: "case_id" })
  case?: Case;
}
