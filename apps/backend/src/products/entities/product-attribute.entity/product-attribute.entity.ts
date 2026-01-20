/**
 * This entity links a product to a specific attribute value.
 * For example: Product #10 → Color → Red (attribute_id = 1, value_id = 5)
 * It is used for filtering, personalization, and AI recommendations.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from '../product.entity';
import { Attribute } from '../../../attributes/entities/attribute.entity';
import { AttributeValue } from '../../../attributes/entities/attribute-value.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  // FK to the product this attribute is applied to
  @Column()
  product_id: number;

  // FK to the attribute type (e.g. "Color", "Size")
  @Column()
  attribute_id: number;

  // FK to the selected attribute value (e.g. "Red", "XL")
  @Column()
  value_id: number;

  @ManyToOne(() => ProductEntity, (product) => product.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => Attribute, { eager: true })
  @JoinColumn({ name: 'attribute_id' })
  attribute: Attribute;

  @ManyToOne(() => AttributeValue, { eager: true })
  @JoinColumn({ name: 'value_id' })
  value: AttributeValue;
}
