import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, QueryRunner } from 'typeorm';

import { SafetyMinuteStats } from '../../entities/safety-minute-stats.entity.js';

export interface MinuteStatsData {
  minute: Date;
  currentInside: number;
  incrementCount: number;
  decrementCount: number;
}

@Injectable()
export class SafetyMinuteStatsRepository {
  private readonly logger = new Logger(SafetyMinuteStatsRepository.name);

  constructor(
    @InjectRepository(SafetyMinuteStats)
    private readonly repository: Repository<SafetyMinuteStats>
  ) {}

  /**
   * 특정 분의 통계가 이미 존재하는지 확인
   */
  async existsByMinute(minute: Date): Promise<boolean> {
    const count = await this.repository.count({
      where: { minute },
    });
    return count > 0;
  }

  /**
   * 새로운 분단위 통계 생성
   */
  async createMinuteStats(
    data: MinuteStatsData,
    queryRunner?: QueryRunner
  ): Promise<SafetyMinuteStats> {
    const stats = this.repository.create({
      minute: data.minute,
      currentInside: Math.max(0, data.currentInside),
      incrementCount: data.incrementCount,
      decrementCount: data.decrementCount,
    });

    if (queryRunner) {
      return await queryRunner.manager.save(SafetyMinuteStats, stats);
    }

    return await this.repository.save(stats);
  }

  /**
   * 기존 통계 업데이트 (upsert)
   */
  async upsertMinuteStats(data: MinuteStatsData): Promise<SafetyMinuteStats> {
    // MySQL의 ON DUPLICATE KEY UPDATE 사용
    const query = `
      INSERT INTO safety_minute_stats (id, minute, currentInside, incrementCount, decrementCount, createdAt, updatedAt)
      VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        currentInside = VALUES(currentInside),
        incrementCount = VALUES(incrementCount),
        decrementCount = VALUES(decrementCount),
        updatedAt = NOW()
    `;

    await this.repository.query(query, [
      data.minute,
      Math.max(0, data.currentInside),
      data.incrementCount,
      data.decrementCount,
    ]);

    // 업데이트된 레코드 반환
    const result = await this.repository.findOne({ where: { minute: data.minute } });
    if (!result) {
      throw new Error(`Failed to upsert minute stats for ${data.minute.toISOString()}`);
    }

    return result;
  }

  /**
   * 날짜 범위의 통계 조회
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<SafetyMinuteStats[]> {
    return await this.repository.find({
      where: {
        minute: Between(startDate, endDate),
      },
      order: { minute: 'ASC' },
    });
  }

  /**
   * 현재 인원이 0보다 큰 시간만 조회 (성능 최적화)
   */
  async findActiveMinutesByDate(targetDate: string): Promise<SafetyMinuteStats[]> {
    const today = new Date().toISOString().split('T')[0];
    let endDate: Date;
    let startDate: Date;

    if (targetDate === today) {
      // 오늘 날짜인 경우: 현재 시간 기준으로 6시간 이내
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000); // 6시간 전
    } else {
      // 과거 날짜인 경우: 해당 날짜의 끝 시간 기준으로 6시간 이내
      endDate = new Date(`${targetDate}T23:59:59Z`);
      startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000); // 6시간 전
    }

    return await this.repository.find({
      where: [
        {
          minute: Between(startDate, endDate),
          currentInside: MoreThan(0),
        },
        {
          minute: Between(startDate, endDate),
          incrementCount: MoreThan(0),
        },
      ],
      order: { minute: 'ASC' },
    });
  }

  /**
   * 최근 N시간 내의 누락된 분들을 찾기
   */
  async findMissingMinutes(hours: number = 6): Promise<Date[]> {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // 시작 시간을 분 단위로 정리
    startTime.setSeconds(0, 0);
    const currentMinute = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0
    );

    // 기존 통계가 있는 분들 조회
    const existingStats = await this.repository.find({
      where: {
        minute: Between(startTime, currentMinute),
      },
      select: ['minute'],
      order: { minute: 'ASC' },
    });

    const existingMinutes = new Set(existingStats.map(stat => stat.minute.toISOString()));
    const missingMinutes: Date[] = [];

    // 누락된 분들 찾기
    for (
      let minute = new Date(startTime);
      minute < currentMinute;
      minute.setMinutes(minute.getMinutes() + 1)
    ) {
      const minuteISO = minute.toISOString();
      if (!existingMinutes.has(minuteISO)) {
        missingMinutes.push(new Date(minute));
      }
    }

    return missingMinutes;
  }

  /**
   * 배치 생성 (성능 최적화)
   */
  async createBatch(dataList: MinuteStatsData[]): Promise<void> {
    if (dataList.length === 0) return;

    const chunks = this.chunkArray(dataList, 50); // 50개씩 배치 처리

    for (const chunk of chunks) {
      const entities = chunk.map(data =>
        this.repository.create({
          minute: data.minute,
          currentInside: Math.max(0, data.currentInside),
          incrementCount: data.incrementCount,
          decrementCount: data.decrementCount,
        })
      );

      try {
        await this.repository.save(entities);
        this.logger.debug(`Created batch of ${entities.length} minute stats`);
      } catch (error) {
        this.logger.error('Failed to create batch:', error);
        // 개별적으로 다시 시도 (중복 키 오류 등을 위해)
        for (const entity of entities) {
          try {
            await this.upsertMinuteStats({
              minute: entity.minute,
              currentInside: entity.currentInside,
              incrementCount: entity.incrementCount,
              decrementCount: entity.decrementCount,
            });
          } catch (individualError) {
            this.logger.error(
              `Failed to create individual minute stats for ${entity.minute}:`,
              individualError
            );
          }
        }
      }
    }
  }

  /**
   * 배열을 청크로 나누는 유틸리티
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
