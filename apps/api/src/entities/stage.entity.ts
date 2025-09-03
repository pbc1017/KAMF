import * as festival from '@kamf/interface/types/festival.type.js';
import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity.js';

@Entity('stages')
export class Stage extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '무대 ID' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '무대 이름 (한국어)' })
  titleKo: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '무대 이름 (English)' })
  titleEn: string;

  @Column({ type: 'varchar', length: 5 })
  @ApiProperty({ description: '공연 시작 시간 (HH:mm)', example: '14:30' })
  startTime: festival.Time;

  @Column({ type: 'varchar', length: 5 })
  @ApiProperty({ description: '공연 종료 시간 (HH:mm)', example: '16:30' })
  endTime: festival.Time;

  @Column({ type: 'text' })
  @ApiProperty({ description: '무대 설명 (한국어)' })
  descriptionKo: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: '무대 설명 (English)' })
  descriptionEn: string;

  @Column({
    type: 'enum',
    enum: festival.FestivalDay,
  })
  @ApiProperty({ description: '축제 날짜', enum: festival.FestivalDay })
  day: festival.FestivalDay;

  @Column({
    type: 'enum',
    enum: festival.StageType,
  })
  @ApiProperty({ description: '무대 타입', enum: festival.StageType })
  stageType: festival.StageType;
}
