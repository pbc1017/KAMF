import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { ModifiableEntity } from '../common/entities/base.entity.js';

import { User } from './user.entity.js';

@Entity('safety_counts')
@Index(['userId', 'createdAt']) // 사용자별 시간순 조회 최적화
@Index(['createdAt']) // 시간별 조회 최적화
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

  // date 필드 제거: createdAt (ModifiableEntity에서 상속) 사용

  // version 필드 제거: 매 5초마다 새 레코드 생성하므로 낙관적 락 불필요

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ description: '사용자', type: () => User })
  user?: User;

  // 계산된 속성: 현재 사용자의 순 카운트
  get netCount(): number {
    return this.increment - this.decrement;
  }
}
