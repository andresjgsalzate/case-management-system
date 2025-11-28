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
import { TeamMember } from "./TeamMember";
import { Team } from "./Team";

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

  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  teamMemberships!: TeamMember[];

  @OneToMany(() => Team, (team) => team.manager)
  managedTeams!: Team[];

  // ============================================
  // MÉTODOS HELPER PARA EQUIPOS
  // ============================================

  /**
   * Obtiene los equipos activos del usuario
   */
  getActiveTeams(): Team[] {
    return (
      this.teamMemberships
        ?.filter((membership) => membership.isActive)
        ?.map((membership) => membership.team)
        ?.filter((team) => team && team.isActive) || []
    );
  }

  /**
   * Obtiene las membresías activas del usuario
   */
  getActiveTeamMemberships(): TeamMember[] {
    return (
      this.teamMemberships?.filter((membership) => membership.isActive) || []
    );
  }

  /**
   * Verifica si el usuario es miembro activo de un equipo específico
   */
  isActiveMemberOfTeam(teamId: string): boolean {
    return this.getActiveTeamMemberships().some(
      (membership) => membership.teamId === teamId
    );
  }

  /**
   * Obtiene el rol del usuario en un equipo específico
   */
  getRoleInTeam(
    teamId: string
  ): "manager" | "lead" | "senior" | "member" | null {
    const membership = this.getActiveTeamMemberships().find(
      (membership) => membership.teamId === teamId
    );
    return membership?.role || null;
  }

  /**
   * Verifica si el usuario es manager de algún equipo
   */
  isTeamManager(): boolean {
    return (
      this.getActiveTeamMemberships().some(
        (membership) => membership.role === "manager"
      ) || (this.managedTeams?.length || 0) > 0
    );
  }

  /**
   * Verifica si el usuario es manager de un equipo específico
   */
  isManagerOfTeam(teamId: string): boolean {
    return (
      this.getActiveTeamMemberships().some(
        (membership) =>
          membership.teamId === teamId && membership.role === "manager"
      ) ||
      this.managedTeams?.some((team) => team.id === teamId) ||
      false
    );
  }

  /**
   * Obtiene todos los equipos donde el usuario tiene rol de gestión (manager o lead)
   */
  getManagedTeams(): Team[] {
    const membershipTeams = this.getActiveTeamMemberships()
      .filter(
        (membership) =>
          membership.role === "manager" || membership.role === "lead"
      )
      .map((membership) => membership.team)
      .filter((team) => team);

    const officialManagedTeams =
      this.managedTeams?.filter((team) => team.isActive) || [];

    // Combinar y eliminar duplicados
    const allManagedTeams = [...membershipTeams, ...officialManagedTeams];
    return allManagedTeams.filter(
      (team, index, self) => index === self.findIndex((t) => t.id === team.id)
    );
  }

  /**
   * Obtiene los IDs de todos los equipos del usuario (para filtros de permisos)
   */
  getTeamIds(): string[] {
    return this.getActiveTeams().map((team) => team.id);
  }

  /**
   * Verifica si el usuario puede gestionar a otro usuario basado en equipos compartidos
   */
  canManageUserInTeams(otherUserId: string, otherUserTeams: string[]): boolean {
    const managedTeamIds = this.getManagedTeams().map((team) => team.id);
    return managedTeamIds.some((teamId) => otherUserTeams.includes(teamId));
  }

  /**
   * Obtiene estadísticas de equipos del usuario
   */
  getTeamStats() {
    const activeTeams = this.getActiveTeams();
    const managedTeams = this.getManagedTeams();
    const memberships = this.getActiveTeamMemberships();

    return {
      totalTeams: activeTeams.length,
      managedTeamsCount: managedTeams.length,
      roles: memberships.reduce((acc, membership) => {
        acc[membership.role] = (acc[membership.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      isManager: this.isTeamManager(),
    };
  }
}
