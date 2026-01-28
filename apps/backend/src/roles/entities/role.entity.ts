import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { RolePermission } from '../../access-control/entities/role-permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  type: string; // 'business' or 'admin'

  /**
   * Priority of the role for conflict resolution
   * Higher priority roles take precedence when permission conflicts occur
   * Default: 0 (lowest priority)
   * System roles typically have priority >= 100
   * @example 50
   */
  @Column({ default: 0 })
  priority: number;

  /**
   * Indicates if this is a system-critical role that cannot be deleted
   * System roles like 'owner' and 'super_admin' should have this set to true
   * Default: false
   */
  @Column({ default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[]; // ✅ New: to load role's permissions

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
