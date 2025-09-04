import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { Application } from "./Application";
import { Origin } from "./Origin";

export enum ClasificacionCase {
  BAJA = "Baja Complejidad",
  MEDIA = "Media Complejidad",
  ALTA = "Alta Complejidad",
}

export enum EstadoCase {
  NUEVO = "nuevo",
  EN_PROGRESO = "en_progreso",
  PENDIENTE = "pendiente",
  RESUELTO = "resuelto",
  CERRADO = "cerrado",
  CANCELADO = "cancelado",
}

@Entity("cases")
export class Case {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  numeroCaso!: string;

  @Column({ type: "text" })
  descripcion!: string;

  @Column({ type: "date" })
  fecha!: Date;

  // Criterios de calificación (1-3)
  @Column({ type: "int" })
  historialCaso!: number;

  @Column({ type: "int" })
  conocimientoModulo!: number;

  @Column({ type: "int" })
  manipulacionDatos!: number;

  @Column({ type: "int" })
  claridadDescripcion!: number;

  @Column({ type: "int" })
  causaFallo!: number;

  // Puntuación calculada automáticamente
  @Column({ type: "decimal", precision: 5, scale: 2 })
  puntuacion!: number;

  @Column({
    type: "enum",
    enum: ClasificacionCase,
  })
  clasificacion!: ClasificacionCase;

  @Column({
    type: "enum",
    enum: EstadoCase,
    default: EstadoCase.NUEVO,
  })
  estado!: EstadoCase;

  @Column({ type: "text", nullable: true })
  observaciones?: string;

  @Column({ type: "timestamp", nullable: true })
  fechaVencimiento?: Date;

  @Column({ type: "timestamp", nullable: true })
  fechaResolucion?: Date;

  // Relaciones
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => UserProfile, (user) => user.cases)
  @JoinColumn({ name: "userId" })
  user?: UserProfile;

  @Column({ type: "uuid", nullable: true })
  assignedToId?: string;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: "assignedToId" })
  assignedTo?: UserProfile;

  @Column({ type: "uuid", nullable: true })
  applicationId?: string;

  @ManyToOne(() => Application, (application) => application.cases)
  @JoinColumn({ name: "applicationId" })
  application?: Application;

  @Column({ type: "uuid", nullable: true })
  originId?: string;

  @ManyToOne(() => Origin, (origin) => origin.cases)
  @JoinColumn({ name: "originId" })
  origin?: Origin;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // Método para calcular puntuación antes de insertar/actualizar
  @BeforeInsert()
  @BeforeUpdate()
  calculateScoring() {
    this.puntuacion = this.calcularPuntuacion();
    this.clasificacion = this.clasificarCaso();
  }

  private calcularPuntuacion(): number {
    const total =
      this.historialCaso +
      this.conocimientoModulo +
      this.manipulacionDatos +
      this.claridadDescripcion +
      this.causaFallo;
    return total; // Puntuación directa de 5 a 15
  }

  private clasificarCaso(): ClasificacionCase {
    if (this.puntuacion >= 12) return ClasificacionCase.ALTA;
    if (this.puntuacion >= 7) return ClasificacionCase.MEDIA;
    return ClasificacionCase.BAJA;
  }
}
