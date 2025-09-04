import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Role } from "./Role";
import { Case } from "./Case";

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  fullName?: string;

  @Column({ type: "varchar", nullable: true })
  password?: string;

  @Column({ type: "uuid", nullable: true })
  roleId?: string;

  @Column({ type: "varchar", default: "user" })
  roleName!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // Relaciones
  @ManyToOne(() => Role, (role: Role) => role.userProfiles)
  @JoinColumn({ name: "roleId" })
  role?: Role;

  @OneToMany(() => Case, (caseEntity: Case) => caseEntity.user)
  cases!: Case[];
}
