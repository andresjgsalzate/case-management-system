import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { RolePermission } from "./RolePermission";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ length: 50 })
  module: string;

  @Column({ length: 20 })
  action: string;

  @Column({ length: 10 })
  scope: "own" | "team" | "all";

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission
  )
  rolePermissions: RolePermission[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
