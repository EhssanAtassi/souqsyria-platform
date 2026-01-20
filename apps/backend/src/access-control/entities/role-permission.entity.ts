/**
 * @file role-permission.entity.ts
 * @description Entity for linking roles to permissions (Many-to-Many).
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role)
  role: Role;

  @ManyToOne(() => Permission)
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;
}
