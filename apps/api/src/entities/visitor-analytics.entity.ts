import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../common/entities/base.entity.js';

import { User } from './user.entity.js';

@Entity('visitor_analytics')
@Index(['landingPage'])
@Index(['visitedAt'])
export class VisitorAnalytics extends BaseEntity {
  @PrimaryColumn('varchar', { length: 36, default: () => 'UUID()' })
  @ApiProperty({ description: '방문 추적 ID' })
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column()
  @ApiProperty({ description: '첫 방문한 페이지 경로' })
  landingPage: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '사용자 에이전트', nullable: true })
  userAgent: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: '방문 시간' })
  visitedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ description: '연결된 사용자 (로그인된 경우)', nullable: true })
  user: User | null;

  @Column({ nullable: true })
  userId: string | null;
}
