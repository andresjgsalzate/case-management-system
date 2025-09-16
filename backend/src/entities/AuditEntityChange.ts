import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { AuditLog } from "./AuditLog";

export enum ChangeType {
  ADDED = "ADDED",
  MODIFIED = "MODIFIED",
  REMOVED = "REMOVED",
}

@Entity("audit_entity_changes")
@Index(["auditLogId"])
@Index(["fieldName"])
@Index(["changeType"])
export class AuditEntityChange {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "audit_log_id", type: "uuid" })
  auditLogId: string;

  // Información del campo modificado
  @Column({ name: "field_name", type: "varchar", length: 100 })
  fieldName: string;

  @Column({ name: "field_type", type: "varchar", length: 50 })
  fieldType: string; // string, number, boolean, json, date, etc.

  // Valores antes y después
  @Column({ name: "old_value", type: "text", nullable: true })
  oldValue?: string; // valor anterior (serializado)

  @Column({ name: "new_value", type: "text", nullable: true })
  newValue?: string; // valor nuevo (serializado)

  // Metadatos del cambio
  @Column({
    name: "change_type",
    type: "enum",
    enum: ChangeType,
  })
  changeType: ChangeType;

  @Column({ name: "is_sensitive", type: "boolean", default: false })
  isSensitive: boolean; // indica si el campo contiene información sensible

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => AuditLog, (auditLog) => auditLog.changes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "audit_log_id" })
  auditLog: AuditLog;

  // Métodos helper
  getChangeDescription(): string {
    const descriptions = {
      [ChangeType.ADDED]: "añadido",
      [ChangeType.MODIFIED]: "modificado",
      [ChangeType.REMOVED]: "eliminado",
    };

    return descriptions[this.changeType] || this.changeType;
  }

  getDisplayValue(value?: string): string {
    if (!value) return "(vacío)";
    if (this.isSensitive) return "***";

    // Intentar parsear JSON para mejor visualización
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object") {
        return JSON.stringify(parsed, null, 2);
      }
      return parsed.toString();
    } catch {
      // Si no es JSON válido, devolver como string
      return value.length > 100 ? value.substring(0, 100) + "..." : value;
    }
  }

  getOldDisplayValue(): string {
    return this.getDisplayValue(this.oldValue);
  }

  getNewDisplayValue(): string {
    return this.getDisplayValue(this.newValue);
  }

  getFieldDisplayName(): string {
    // Convertir nombres de campo técnicos a nombres más amigables
    const fieldNames: Record<string, string> = {
      fullName: "Nombre completo",
      email: "Correo electrónico",
      isActive: "Estado activo",
      roleName: "Rol",
      title: "Título",
      description: "Descripción",
      estado: "Estado",
      fechaVencimiento: "Fecha de vencimiento",
      fechaResolucion: "Fecha de resolución",
      observaciones: "Observaciones",
      isCompleted: "Completado",
      assignedUserId: "Usuario asignado",
      createdAt: "Fecha de creación",
      updatedAt: "Fecha de actualización",
    };

    return fieldNames[this.fieldName] || this.fieldName;
  }

  getFullChangeDescription(): string {
    const fieldName = this.getFieldDisplayName();
    const changeType = this.getChangeDescription();

    switch (this.changeType) {
      case ChangeType.ADDED:
        return `${fieldName} fue ${changeType} con valor: ${this.getNewDisplayValue()}`;
      case ChangeType.REMOVED:
        return `${fieldName} fue ${changeType} (valor anterior: ${this.getOldDisplayValue()})`;
      case ChangeType.MODIFIED:
        return `${fieldName} fue ${changeType} de "${this.getOldDisplayValue()}" a "${this.getNewDisplayValue()}"`;
      default:
        return `${fieldName} fue ${changeType}`;
    }
  }
}
