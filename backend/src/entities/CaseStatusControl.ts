import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("case_status_control")
export class CaseStatusControl {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 20, default: "#6B7280" })
  color: string;

  @Column({ type: "int", default: 0 })
  displayOrder: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones - se cargará dinámicamente para evitar referencias circulares
  // @OneToMany(() => CaseControl, caseControl => caseControl.status)
  // caseControls: CaseControl[];
}
