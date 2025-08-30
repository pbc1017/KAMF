import * as festival from '@kamf/interface/types/festival.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stages')
export class Stage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titleKo: string;

  @Column({ type: 'varchar', length: 255 })
  titleEn: string;

  @Column({ type: 'varchar', length: 5 })
  startTime: festival.Time;

  @Column({ type: 'varchar', length: 5 })
  endTime: festival.Time;

  @Column({ type: 'text' })
  descriptionKo: string;

  @Column({ type: 'text' })
  descriptionEn: string;

  @Column({
    type: 'enum',
    enum: festival.FestivalDay,
  })
  day: festival.FestivalDay;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
