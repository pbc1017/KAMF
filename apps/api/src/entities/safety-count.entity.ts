import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  VersionColumn,
  Index,
  Unique,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { ModifiableEntity } from '../common/entities/base.entity.js';

import { User } from './user.entity.js';

@Entity('safety_counts')
@Unique(['userId', 'date']) // 하루에 사용자당 하나의 레코드만
@Index(['date']) // 날짜별 조회 최적화
@Index(['userId']) // 사용자별 조회 최적화
export class SafetyCount extends ModifiableEntity {
  @PrimaryColumn('varchar', { length: 36, default: () => 'UUID()' })
  @ApiProperty({ description: '안전 카운트 ID' })
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 36 })
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '입장 카운트' })
  increment: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '퇴장 카운트' })
  decrement: number;

  @Column({ type: 'date' })
  @ApiProperty({ description: 'UTC 기준 날짜 (YYYY-MM-DD)' })
  date: string;

  @VersionColumn()
  @ApiProperty({ description: '낙관적 락을 위한 버전' })
  version: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ description: '사용자', type: () => User })
  user?: User;

  // 계산된 속성: 현재 사용자의 순 카운트
  get netCount(): number {
    return this.increment - this.decrement;
  }
}
