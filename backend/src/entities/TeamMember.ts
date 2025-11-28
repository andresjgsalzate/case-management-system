import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { Team } from "./Team";
import { UserProfile } from "./UserProfile";

@Entity("team_members")
@Index("idx_team_members_team", ["teamId"])
@Index("idx_team_members_user", ["userId"])
@Index("idx_team_members_active", ["isActive"])
@Index("idx_team_members_role", ["role"])
@Index("idx_team_members_joined_at", ["joinedAt"])
@Index("idx_team_members_left_at", ["leftAt"])
// Índice único parcial para evitar membresías duplicadas activas (solo cuando isActive=true)
// El índice real se maneja en la migración SQL ya que TypeORM no soporta índices únicos parciales
// @Unique("unique_team_user_active", ["teamId", "userId"]) - REMOVIDO: causaba conflictos
export class TeamMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  teamId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "member",
  })
  role!: "manager" | "lead" | "senior" | "member";

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true, default: () => "NOW()" })
  joinedAt?: Date;

  @Column({ type: "timestamptz", nullable: true })
  leftAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => Team, (team) => team.members, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teamId" })
  team!: Team;

  @ManyToOne(() => UserProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: UserProfile;

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Verifica si la membresía está actualmente activa
   */
  isCurrentlyActive(): boolean {
    return this.isActive && (!this.leftAt || this.leftAt > new Date());
  }

  /**
   * Calcula la duración de la membresía en días
   */
  getMembershipDurationInDays(): number {
    if (!this.joinedAt) return 0;

    const endDate = this.leftAt || new Date();
    const startDate = this.joinedAt;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica si el usuario tiene permisos de gestión (manager o lead)
   */
  hasManagementRole(): boolean {
    return this.role === "manager" || this.role === "lead";
  }

  /**
   * Obtiene el nivel de autoridad numérico del rol (mayor número = más autoridad)
   */
  getRoleLevel(): number {
    const roleLevels = {
      member: 1,
      senior: 2,
      lead: 3,
      manager: 4,
    };
    return roleLevels[this.role] || 0;
  }

  /**
   * Verifica si este miembro puede gestionar a otro miembro
   */
  canManage(otherMember: TeamMember): boolean {
    // Solo miembros del mismo equipo
    if (this.teamId !== otherMember.teamId) return false;

    // Managers pueden gestionar a todos
    if (this.role === "manager") return true;

    // Leads pueden gestionar a seniors y members
    if (
      this.role === "lead" &&
      ["senior", "member"].includes(otherMember.role)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Marca la membresía como inactiva (salida del equipo)
   */
  deactivate(leftDate?: Date): void {
    this.isActive = false;
    this.leftAt = leftDate || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reactiva la membresía
   */
  reactivate(): void {
    this.isActive = true;
    this.leftAt = undefined;
    this.joinedAt = this.joinedAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Cambia el rol del miembro
   */
  changeRole(newRole: "manager" | "lead" | "senior" | "member"): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  /**
   * Serializa la membresía para respuestas de API
   */
  toJSON() {
    return {
      id: this.id,
      teamId: this.teamId,
      userId: this.userId,
      role: this.role,
      isActive: this.isActive,
      joinedAt: this.joinedAt,
      leftAt: this.leftAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Información del usuario si está cargada
      user: this.user
        ? {
            id: this.user.id,
            fullName: this.user.fullName,
            email: this.user.email,
            isActive: this.user.isActive,
          }
        : undefined,
      // Información del equipo si está cargada
      team: this.team
        ? {
            id: this.team.id,
            name: this.team.name,
            code: this.team.code,
            color: this.team.color,
          }
        : undefined,
      // Estadísticas calculadas
      stats: {
        isCurrentlyActive: this.isCurrentlyActive(),
        membershipDurationDays: this.getMembershipDurationInDays(),
        hasManagementRole: this.hasManagementRole(),
        roleLevel: this.getRoleLevel(),
      },
    };
  }

  /**
   * Valida los datos de la membresía antes de guardar
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.teamId) {
      errors.push("El ID del equipo es requerido");
    }

    if (!this.userId) {
      errors.push("El ID del usuario es requerido");
    }

    if (
      !this.role ||
      !["manager", "lead", "senior", "member"].includes(this.role)
    ) {
      errors.push("El rol debe ser uno de: manager, lead, senior, member");
    }

    if (this.leftAt && this.joinedAt && this.leftAt < this.joinedAt) {
      errors.push(
        "La fecha de salida no puede ser anterior a la fecha de ingreso"
      );
    }

    // Si está marcado como inactivo, debe tener fecha de salida
    if (!this.isActive && !this.leftAt) {
      errors.push("Las membresías inactivas deben tener fecha de salida");
    }

    // Si está activo, no debe tener fecha de salida
    if (this.isActive && this.leftAt) {
      errors.push("Las membresías activas no pueden tener fecha de salida");
    }

    return errors;
  }

  /**
   * Crea una representación string de la membresía
   */
  toString(): string {
    const teamName = this.team?.name || `Team[${this.teamId}]`;
    const userName = this.user?.fullName || `User[${this.userId}]`;
    const status = this.isActive ? "Active" : "Inactive";
    return `TeamMember[${status}]: ${userName} as ${this.role} in ${teamName}`;
  }
}
