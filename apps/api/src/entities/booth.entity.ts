import { Zone } from '@kamf/interface/types/festival.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('booths')
export class Booth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titleKo: string;

  @Column({ type: 'varchar', length: 255 })
  titleEn: string;

  @Column({
    type: 'enum',
    enum: Zone,
  })
  zone: Zone;

  @Column({ type: 'text' })
  descriptionKo: string;

  @Column({ type: 'text' })
  descriptionEn: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
