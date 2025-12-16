import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserProfile } from "./UserProfile";

@Entity("user_sessions")
@Index(["userId", "isActive"]) // Índice para optimizar consultas por usuario y estado activo
export class UserSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => UserProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserProfile;

  @Column({ name: "token_hash", unique: true })
  tokenHash: string; // Hash del JWT token para identificación única

  @Column({ name: "refresh_token_hash", nullable: true })
  refreshTokenHash?: string; // Hash del refresh token

  @Column({ name: "device_info", type: "jsonb", nullable: true })
  deviceInfo?: {
    userAgent?: string;
    browser?: string;
    os?: string;
    device?: string;
    ip?: string;
  };

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @Column({ name: "location_info", type: "jsonb", nullable: true })
  locationInfo?: {
    country?: string;
    city?: string;
    region?: string;
  };

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @Column({
    name: "last_activity_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastActivityAt: Date;

  @Column({ name: "logout_reason", nullable: true })
  logoutReason?: string; // 'manual', 'forced', 'expired', 'new_login'

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
