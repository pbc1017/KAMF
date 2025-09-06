import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn, Column, Index, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { ModifiableEntity } from '../common/entities/base.entity.js';

@Entity('safety_minute_stats')
@Index(['minute']) // 분 단위 시간 조회 최적화
@Index(['minute', 'currentInside']) // 현재 인원이 있는 시간 조회 최적화
export class SafetyMinuteStats extends ModifiableEntity {
  @PrimaryColumn('varchar', { length: 36, default: () => 'UUID()' })
  @ApiProperty({ description: '분단위 통계 ID' })
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'datetime', unique: true })
  @ApiProperty({ description: '분 단위 시점 (예: 2025-01-05 10:34:00)' })
  minute: Date;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '현재 내부 인원수' })
  currentInside: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '해당 분까지의 총 입장 카운트' })
  incrementCount: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '해당 분까지의 총 퇴장 카운트' })
  decrementCount: number;

  /**
   * 계산된 속성: 순 입장 인원
   */
  get netCount(): number {
    return this.incrementCount - this.decrementCount;
  }
}
