import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_gateway_configs')
export class PaymentGatewayConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gateway_name', length: 100 })
  gatewayName: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'api_key', length: 255, nullable: true })
  apiKey: string;

  @Column({ name: 'api_secret', length: 255, nullable: true })
  apiSecret: string;

  @Column({ name: 'webhook_url', length: 500, nullable: true })
  webhookUrl: string;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_test_mode', default: false })
  isTestMode: boolean;

  @Column({ name: 'supported_currencies', type: 'json', nullable: true })
  supportedCurrencies: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
