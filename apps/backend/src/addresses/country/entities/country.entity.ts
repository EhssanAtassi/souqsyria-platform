import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { City } from '../../city/entities/city.entity';
import { Region } from '../../region/entities/region.entity';

/**
 * @file country.entity.ts
 * @description Country reference table for addresses.
 */
@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  /** ISO alpha-2 code (e.g., "SY", "TR") */
  @Column({ length: 2, unique: true })
  code: string;

  /** Display name (e.g., "Syria", "Turkey") */
  @Column({ length: 64 })
  name: string;

  @OneToMany(() => Region, (region) => region.country)
  regions: Region[];

  @OneToMany(() => City, (city) => city.country)
  cities: City[];
}
