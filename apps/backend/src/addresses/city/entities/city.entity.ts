import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Country } from '../../country/entities/country.entity';
import { Region } from '../../region/entities/region.entity';

/**
 * @file city.entity.ts
 * @description City reference table for addresses.
 */
@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  /** City name (e.g., "Homs", "Gaziantep") */
  @Column({ length: 64 })
  name: string;

  /** Region (may be null if not used) */
  @ManyToOne(() => Region, (region) => region.cities, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  region: Region;

  /** Country this city belongs to */
  @ManyToOne(() => Country, (country) => country.cities, {
    onDelete: 'CASCADE',
  })
  country: Country;
}
