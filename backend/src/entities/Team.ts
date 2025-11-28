import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { TeamMember } from "./TeamMember";

@Entity("teams")
@Index("idx_teams_active", ["isActive"])
@Index("idx_teams_code", ["code"])
@Index("idx_teams_name", ["name"])
export class Team {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 10, unique: true })
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 7, nullable: true })
  color?: string; // Color en formato hex: #FF5733

  @Column({ type: "uuid", nullable: true })
  @Index("idx_teams_manager")
  managerId?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => UserProfile, { nullable: true })
  @JoinColumn({ name: "managerId" })
  manager?: UserProfile;

  @OneToMany(() => TeamMember, (teamMember) => teamMember.team, {
    cascade: true,
  })
  members!: TeamMember[];

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Obtiene los miembros activos del equipo
   */
  getActiveMembers(): TeamMember[] {
    return this.members?.filter((member) => member.isActive) || [];
  }

  /**
   * Obtiene el número de miembros activos
   */
  getActiveMembersCount(): number {
    return this.getActiveMembers().length;
  }

  /**
   * Getter virtual para el conteo de miembros (incluido en la serialización JSON)
   */
  get memberCount(): number {
    return this.getActiveMembersCount();
  }

  /**
   * Verifica si un usuario es miembro activo del equipo
   */
  isUserActiveMember(userId: string): boolean {
    return this.getActiveMembers().some((member) => member.userId === userId);
  }

  /**
   * Obtiene el rol de un usuario en el equipo
   */
  getUserRole(userId: string): "manager" | "lead" | "senior" | "member" | null {
    const member = this.getActiveMembers().find(
      (member) => member.userId === userId
    );
    return member?.role || null;
  }

  /**
   * Verifica si un usuario es manager del equipo
   */
  isUserManager(userId: string): boolean {
    return (
      this.managerId === userId ||
      this.getActiveMembers().some(
        (member) => member.userId === userId && member.role === "manager"
      )
    );
  }

  /**
   * Obtiene miembros por rol
   */
  getMembersByRole(
    role: "manager" | "lead" | "senior" | "member"
  ): TeamMember[] {
    return this.getActiveMembers().filter((member) => member.role === role);
  }

  /**
   * Serializa el equipo para respuestas de API
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      color: this.color,
      managerId: this.managerId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Incluir memberCount usando el getter
      memberCount: this.memberCount,
      // Incluir información del manager si está cargado
      manager: this.manager
        ? {
            id: this.manager.id,
            fullName: this.manager.fullName,
            email: this.manager.email,
          }
        : undefined,
      // Estadísticas básicas si los miembros están cargados
      stats: this.members
        ? {
            totalMembers: this.members.length,
            activeMembers: this.getActiveMembersCount(),
            membersByRole: {
              managers: this.getMembersByRole("manager").length,
              leads: this.getMembersByRole("lead").length,
              seniors: this.getMembersByRole("senior").length,
              members: this.getMembersByRole("member").length,
            },
          }
        : undefined,
    };
  }

  /**
   * Valida los datos del equipo antes de guardar
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("El nombre del equipo es requerido");
    }

    if (this.name && this.name.length > 100) {
      errors.push("El nombre del equipo no puede exceder 100 caracteres");
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push("El código del equipo es requerido");
    }

    if (this.code && !/^[A-Z0-9_-]+$/.test(this.code)) {
      errors.push(
        "El código del equipo solo puede contener letras mayúsculas, números, guiones y guiones bajos"
      );
    }

    if (this.code && this.code.length > 10) {
      errors.push("El código del equipo no puede exceder 10 caracteres");
    }

    if (this.color && !/^#[0-9A-Fa-f]{6}$/.test(this.color)) {
      errors.push(
        "El color debe estar en formato hexadecimal válido (#RRGGBB)"
      );
    }

    return errors;
  }

  /**
   * Crea una representación string del equipo
   */
  toString(): string {
    return `Team[${this.code}]: ${this.name}`;
  }
}
