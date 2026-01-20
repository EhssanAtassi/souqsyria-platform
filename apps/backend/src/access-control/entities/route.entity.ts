/**
 * @file route.entity.ts
 * @description Entity representing API routes linked to permissions.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string; // example: /admin/products

  @Column()
  method: string; // example: GET, POST, PUT, DELETE

  @ManyToOne(() => Permission, { nullable: true })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
