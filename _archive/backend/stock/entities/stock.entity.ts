// src/modules/stock/entities/stock.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stock')
export class StockEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  // @ManyToOne(() => ProductEntity, (product) => product.stocks, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'product_id' })
  // product: ProductEntity;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
