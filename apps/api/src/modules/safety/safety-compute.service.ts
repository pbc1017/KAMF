import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TimeService } from '../../common/services/time.service.js';
import { SafetyCount } from '../../entities/safety-count.entity.js';

import { SafetyMinuteStatsRepository, MinuteStatsData } from './safety-minute-stats.repository.js';

/**
 * 실시간 분단위 통계 계산 서비스
 * 매분 실행되어 1분 전 데이터를 사전 계산하여 저장
 */
@Injectable()
export class SafetyComputeService {
  private readonly logger = new Logger(SafetyComputeService.name);

  constructor(
    @InjectRepository(SafetyCount)
    private readonly safetyCountRepository: Repository<SafetyCount>,
    private readonly minuteStatsRepository: SafetyMinuteStatsRepository,
    private readonly timeService: TimeService
  ) {}

  /**
   * 매분 실행되는 정기 계산 작업
   * 1분 전 데이터를 계산하여 저장 (크론: 0 * * * * *)
   */
  @Cron('0 * * * * *', { name: 'computeRealtimeMinuteStats' })
  async computeRealtimeMinuteStats(): Promise<void> {
    const startTime = Date.now();

    try {
      // 1분 전 시점 계산
      const now = new Date();
      const previousMinute = new Date(now.getTime() - 60 * 1000);
      previousMinute.setSeconds(0, 0);

      // 이미 계산된 데이터가 있는지 확인
      const exists = await this.minuteStatsRepository.existsByMinute(previousMinute);
      if (exists) {
        this.logger.debug(`Stats already exist for minute: ${previousMinute.toISOString()}`);
        return;
      }

      // 해당 분의 통계 계산
      const stats = await this.computeSingleMinuteStats(previousMinute);

      // 데이터베이스에 저장
      await this.minuteStatsRepository.upsertMinuteStats(stats);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Computed minute stats for ${previousMinute.toISOString()}: ` +
          `inside=${stats.currentInside}, increment=${stats.incrementCount}, ` +
          `decrement=${stats.decrementCount} (${duration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to compute realtime minute stats (${duration}ms):`, error);
      // 에러가 발생해도 다음 분 실행에 영향이 없도록 throw하지 않음
    }
  }

  /**
   * 특정 분의 통계를 계산
   */
  async computeSingleMinuteStats(minuteTime: Date): Promise<MinuteStatsData> {
    const targetDate = this.timeService.formatUTCDate(minuteTime);

    try {
      // 🎯 개선된 쿼리: 해당 분까지 각 유저별 최신 레코드 기준으로 누적 계산
      const latestRecords = await this.safetyCountRepository.query(
        `
        SELECT sc.userId, sc.increment, sc.decrement
        FROM safety_counts sc
        WHERE DATE(sc.createdAt) = ?
          AND sc.createdAt <= ?
          AND sc.createdAt = (
            SELECT MAX(sc2.createdAt) 
            FROM safety_counts sc2 
            WHERE sc2.userId = sc.userId 
              AND DATE(sc2.createdAt) = ?
              AND sc2.createdAt <= ?
          )
        GROUP BY sc.userId, sc.increment, sc.decrement
        `,
        [targetDate, minuteTime, targetDate, minuteTime]
      );

      // 집계 계산 (기존 getDailyTotalStats와 동일한 방식)
      let totalIncrement = 0;
      let totalDecrement = 0;

      for (const record of latestRecords) {
        totalIncrement += parseInt(record.increment) || 0;
        totalDecrement += parseInt(record.decrement) || 0;
      }

      const currentInside = Math.max(0, totalIncrement - totalDecrement);

      return {
        minute: minuteTime,
        currentInside,
        incrementCount: totalIncrement,
        decrementCount: totalDecrement,
      };
    } catch (error) {
      this.logger.error(`Failed to compute stats for minute ${minuteTime.toISOString()}:`, error);

      // 에러 발생 시 기본값 반환
      return {
        minute: minuteTime,
        currentInside: 0,
        incrementCount: 0,
        decrementCount: 0,
      };
    }
  }

  /**
   * 수동 계산 트리거 (테스트/디버깅용)
   */
  async computeSpecificMinute(minuteTime: Date): Promise<MinuteStatsData> {
    this.logger.log(`Manual compute triggered for: ${minuteTime.toISOString()}`);

    const stats = await this.computeSingleMinuteStats(minuteTime);
    await this.minuteStatsRepository.upsertMinuteStats(stats);

    this.logger.log(
      `Manual compute completed: inside=${stats.currentInside}, increment=${stats.incrementCount}, decrement=${stats.decrementCount}`
    );

    return stats;
  }

  /**
   * 여러 분의 데이터를 연속으로 계산 (복구용)
   */
  async computeMinuteRange(startMinute: Date, endMinute: Date): Promise<MinuteStatsData[]> {
    const results: MinuteStatsData[] = [];

    this.logger.log(
      `Computing minute range: ${startMinute.toISOString()} to ${endMinute.toISOString()}`
    );

    for (
      let current = new Date(startMinute);
      current <= endMinute;
      current.setMinutes(current.getMinutes() + 1)
    ) {
      try {
        const stats = await this.computeSingleMinuteStats(new Date(current));
        await this.minuteStatsRepository.upsertMinuteStats(stats);
        results.push(stats);

        // 과부하 방지를 위한 짧은 대기
        await this.sleep(100);
      } catch (error) {
        this.logger.error(`Failed to compute minute ${current.toISOString()}:`, error);
      }
    }

    this.logger.log(`Completed minute range computation: ${results.length} minutes processed`);
    return results;
  }

  /**
   * 서비스 상태 확인
   */
  getStatus(): {
    serviceName: string;
    isHealthy: boolean;
    lastExecution?: Date;
    nextExecution?: Date;
  } {
    return {
      serviceName: 'SafetyComputeService',
      isHealthy: true,
      // 크론 스케줄러 활성화 후 실제 값으로 업데이트 예정
      lastExecution: undefined,
      nextExecution: undefined,
    };
  }

  /**
   * 유틸리티: 대기 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
