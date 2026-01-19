import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { AuditEntityChange } from "./AuditEntityChange";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  RESTORE = "RESTORE",
  ARCHIVE = "ARCHIVE",
  READ = "READ",
  DOWNLOAD = "DOWNLOAD",
  VIEW = "VIEW",
  EXPORT = "EXPORT",
  // Acciones de sesión
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGOUT_ALL = "LOGOUT_ALL",
  FORCE_LOGOUT = "FORCE_LOGOUT",
}

@Entity("audit_logs")
@Index(["userId"])
@Index(["action"])
@Index(["entityType"])
@Index(["entityId"])
@Index(["module"])
@Index(["createdAt"])
@Index(["ipAddress"])
@Index(["entityType", "entityId"]) // Índice compuesto
@Index(["userId", "action", "createdAt"]) // Índice compuesto para consultas frecuentes
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Información del usuario que realizó la acción
  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId?: string;

  @Column({ name: "user_email", type: "varchar", length: 255 })
  userEmail: string;

  @Column({ name: "user_name", type: "varchar", length: 500, nullable: true })
  userName?: string;

  @Column({ name: "user_role", type: "varchar", length: 100, nullable: true })
  userRole?: string;

  // Información de la acción
  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ name: "entity_type", type: "varchar", length: 100 })
  entityType: string; // cases, todos, users, roles, etc.

  @Column({ name: "entity_id", type: "uuid" })
  entityId: string;

  @Column({ name: "entity_name", type: "varchar", length: 500, nullable: true })
  entityName?: string; // nombre descriptivo de la entidad

  // Contexto de la operación
  @Column({ type: "varchar", length: 50 })
  module: string; // módulo que realizó la acción

  @Column({ name: "operation_context", type: "jsonb", nullable: true })
  operationContext?: any; // contexto adicional de la operación

  // Información técnica
  @Column({ name: "ip_address", type: "inet", nullable: true })
  ipAddress?: string;

  // Datos de geolocalización de IP (enriquecidos via ip.guide)
  @Column({ name: "ip_city", type: "varchar", length: 255, nullable: true })
  ipCity?: string;

  @Column({ name: "ip_country", type: "varchar", length: 255, nullable: true })
  ipCountry?: string;

  @Column({
    name: "ip_country_code",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  ipCountryCode?: string;

  @Column({ name: "ip_timezone", type: "varchar", length: 100, nullable: true })
  ipTimezone?: string;

  @Column({
    name: "ip_latitude",
    type: "decimal",
    precision: 10,
    scale: 8,
    nullable: true,
  })
  ipLatitude?: number;

  @Column({
    name: "ip_longitude",
    type: "decimal",
    precision: 11,
    scale: 8,
    nullable: true,
  })
  ipLongitude?: number;

  // Datos de red
  @Column({
    name: "ip_network_cidr",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  ipNetworkCidr?: string;

  // Datos del ISP/ASN
  @Column({ name: "ip_asn", type: "integer", nullable: true })
  ipAsn?: number;

  @Column({ name: "ip_isp", type: "varchar", length: 255, nullable: true })
  ipIsp?: string;

  @Column({
    name: "ip_organization",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  ipOrganization?: string;

  // Metadatos de enriquecimiento
  @Column({
    name: "ip_enrichment_source",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  ipEnrichmentSource?: string;

  @Column({ name: "ip_is_private", type: "boolean", default: false })
  ipIsPrivate?: boolean;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent?: string;

  @Column({ name: "session_id", type: "varchar", length: 255, nullable: true })
  sessionId?: string;

  @Column({
    name: "request_path",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  requestPath?: string;

  @Column({
    name: "request_method",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  requestMethod?: string;

  // Estado de la operación
  @Column({ name: "operation_success", type: "boolean", default: true })
  operationSuccess: boolean;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => UserProfile, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user?: UserProfile;

  @OneToMany(
    () => AuditEntityChange,
    (change: AuditEntityChange) => change.auditLog,
    {
      cascade: true,
    }
  )
  changes: AuditEntityChange[];

  // Métodos helper
  getEntityDisplayName(): string {
    return this.entityName || `${this.entityType}#${this.entityId}`;
  }

  getActionDescription(): string {
    const actionDescriptions = {
      [AuditAction.CREATE]: "creó",
      [AuditAction.UPDATE]: "actualizó",
      [AuditAction.DELETE]: "eliminó",
      [AuditAction.RESTORE]: "restauró",
      [AuditAction.ARCHIVE]: "archivó",
      [AuditAction.READ]: "accedió a",
      [AuditAction.DOWNLOAD]: "descargó",
      [AuditAction.VIEW]: "visualizó",
      [AuditAction.EXPORT]: "exportó",
      [AuditAction.LOGIN]: "inició sesión en",
      [AuditAction.LOGOUT]: "cerró sesión de",
      [AuditAction.LOGOUT_ALL]: "cerró todas las sesiones de",
      [AuditAction.FORCE_LOGOUT]: "forzó el cierre de sesión en",
    };

    return actionDescriptions[this.action] || this.action;
  }

  getFullDescription(): string {
    return `${
      this.userName || this.userEmail
    } ${this.getActionDescription()} ${this.getEntityDisplayName()}`;
  }
}
