import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Country } from '../../country/entities/country.entity';
import { City } from '../../city/entities/city.entity';

/**
 * @file region.entity.ts
 * @description Region/State reference table for addresses.
 */
@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn()
  id: number;

  /** Region or state name (e.g., "Damascus Governorate", "Istanbul") */
  @Column({ length: 64 })
  name: string;

  /** ISO region code (optional) */
  @Column({ length: 8, nullable: true })
  code: string;

  /** Country this region belongs to */
  @ManyToOne(() => Country, (country) => country.regions, {
    onDelete: 'CASCADE',
  })
  country: Country;

  @OneToMany(() => City, (city) => city.region)
  cities: City[];
}
